import { initDb } from './db.js';
import { unsubscribeFooterHtml, unsubscribeUrl } from './unsubscribe.js';

const FROM = 'Luma Arte <contacto@lumaarte.com>';
const REPLY_TO = 'contacto@lumaarte.com';

export const AUDIENCIAS = {
  suscriptores: "(origen='newsletter' OR tags LIKE '%suscriptor%')",
  todos: '1=1',
};

function escapar(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Primer nombre con mayúscula inicial ("maría josé pérez" → "María"); vacío si no hay un nombre usable
function primerNombre(nombre) {
  const p = String(nombre ?? '').trim().split(/\s+/)[0] || '';
  if (!p || p.includes('@') || /\d/.test(p)) return '';
  return p.charAt(0).toLocaleUpperCase('es') + p.slice(1).toLocaleLowerCase('es');
}

// {nombre} → primer nombre. Sin nombre, "Hola, {nombre}." queda "Hola."
function personalizar(texto, nombre, esHtml = true) {
  const n = esHtml ? escapar(primerNombre(nombre)) : primerNombre(nombre);
  return texto
    .replace(/,\s*\{nombre\}/g, n ? `, ${n}` : '')
    .replace(/\{nombre\}/g, n);
}

// {{baja}} → link de baja del destinatario; si la plantilla no lo trae, se agrega el pie estándar
function conBaja(html, email) {
  return html.includes('{{baja}}')
    ? html.replaceAll('{{baja}}', unsubscribeUrl(email))
    : html + unsubscribeFooterHtml(email);
}

export function armarCorreo({ email, nombre }, asunto, html, prefijo = '') {
  return {
    from: FROM,
    to: [email],
    reply_to: REPLY_TO,
    subject: prefijo + personalizar(asunto, nombre, false),
    html: conBaja(personalizar(html, nombre), email),
  };
}

const esperar = ms => new Promise(r => setTimeout(r, ms));

export async function enviarUno(correo) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${import.meta.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(correo),
  });
  if (res.ok) return null;
  const d = await res.json().catch(() => ({}));
  return { status: res.status, message: d.message || `HTTP ${res.status}` };
}

// Resend permite 100 correos por llamada a /emails/batch y ~2 llamadas por segundo.
// onResultado recibe por lote los emails enviados y los que fallaron de forma definitiva.
async function enviarLotes(correos, onResultado) {
  let enviados = 0;
  const errors = [];
  for (let i = 0; i < correos.length; i += 100) {
    const lote = correos.slice(i, i + 100);
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${import.meta.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(lote),
    });
    const ok = [];
    const fallidos = [];
    if (res.ok) {
      ok.push(...lote.map(c => c.to[0]));
    } else {
      // Si el lote completo falla (p. ej. un correo mal escrito), se reintenta uno a uno
      for (const c of lote) {
        await esperar(600);
        try {
          const err = await enviarUno(c);
          if (!err) ok.push(c.to[0]);
          else {
            errors.push({ email: c.to[0], error: err.message });
            // 429 = límite de Resend: se reintenta en la próxima tanda. Otro error (correo inválido): no se reintenta
            if (err.status !== 429) fallidos.push({ email: c.to[0], error: err.message });
          }
        } catch (e) {
          errors.push({ email: c.to[0], error: String(e) });
        }
      }
    }
    enviados += ok.length;
    if (ok.length || fallidos.length) await onResultado(ok, fallidos);
    await esperar(600);
  }
  return { enviados, errors };
}

// Envía la siguiente tanda de una campaña (o todo lo pendiente si por_dia = 0) a quienes aún no la recibieron
export async function enviarTanda(db, campana) {
  const filtro = AUDIENCIAS[campana.audiencia] ?? AUDIENCIAS.suscriptores;
  const limite = Number(campana.por_dia) > 0 ? Number(campana.por_dia) : -1;
  const { rows } = await db.execute({
    sql: `SELECT lower(trim(email)) AS email, MAX(nombre) AS nombre FROM contactos
          WHERE ${filtro} AND email IS NOT NULL AND trim(email) != '' AND unsubscribed_at IS NULL
            AND lower(trim(email)) NOT IN (SELECT email FROM campana_envios WHERE campana_id = ?)
          GROUP BY lower(trim(email)) ORDER BY MIN(id) LIMIT ?`,
    args: [campana.id, limite],
  });

  const { errors } = await enviarLotes(
    rows.map(r => armarCorreo(r, campana.asunto, campana.html)),
    (ok, fallidos) => db.batch([
      ...ok.map(e => ({ sql: 'INSERT OR IGNORE INTO campana_envios (campana_id, email) VALUES (?,?)', args: [campana.id, e] })),
      ...fallidos.map(f => ({ sql: 'INSERT OR IGNORE INTO campana_envios (campana_id, email, error) VALUES (?,?,?)', args: [campana.id, f.email, f.error] })),
    ], 'write'),
  );

  const { rows: [{ total }] } = await db.execute({ sql: 'SELECT COUNT(*) AS total FROM campana_envios WHERE campana_id=? AND error IS NULL', args: [campana.id] });
  const { rows: [{ pendientes }] } = await db.execute({
    sql: `SELECT COUNT(DISTINCT lower(trim(email))) AS pendientes FROM contactos
          WHERE ${filtro} AND email IS NOT NULL AND trim(email) != '' AND unsubscribed_at IS NULL
            AND lower(trim(email)) NOT IN (SELECT email FROM campana_envios WHERE campana_id = ?)`,
    args: [campana.id],
  });
  await db.execute({
    sql: 'UPDATE campanas SET enviados=?, estado=? WHERE id=?',
    args: [Number(total), Number(pendientes) > 0 ? 'enviando' : 'enviado', campana.id],
  });
  return { enviados: rows.length - errors.length, errors, total: Number(total), pendientes: Number(pendientes) };
}

// Campañas por tandas: si pasaron 24 h desde la última, envía la siguiente
export async function revisarTandas() {
  if (!import.meta.env.RESEND_API_KEY) return;
  const db = await initDb();
  const { rows } = await db.execute(
    "SELECT * FROM campanas WHERE estado='enviando' AND por_dia > 0 AND (ultima_tanda IS NULL OR ultima_tanda <= datetime('now','-24 hours'))"
  );
  for (const c of rows) {
    // Reservar la tanda antes de enviar, para que dos procesos no la manden dos veces
    const claim = await db.execute({
      sql: "UPDATE campanas SET ultima_tanda=datetime('now') WHERE id=? AND (ultima_tanda IS NULL OR ultima_tanda <= datetime('now','-24 hours'))",
      args: [c.id],
    });
    if (claim.rowsAffected !== 1) continue;
    const r = await enviarTanda(db, c);
    console.log(`Newsletter #${c.id}: tanda de ${r.enviados} enviada (${r.total} en total, ${r.pendientes} pendientes, ${r.errors.length} errores)`);
  }
}
