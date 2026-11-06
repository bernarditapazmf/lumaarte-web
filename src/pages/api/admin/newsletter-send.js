import { initDb } from '../../../lib/db.js';
import { isAuthenticated } from '../../../lib/auth.js';
import { unsubscribeFooterHtml, unsubscribeUrl } from '../../../lib/unsubscribe.js';
export const prerender = false;

const FROM = 'Luma Arte <contacto@lumaarte.com>';
const REPLY_TO = 'contacto@lumaarte.com';
const TEST_EMAIL = 'bernimirf@gmail.com';

const AUDIENCIAS = {
  suscriptores: "SELECT nombre, email FROM contactos WHERE (origen='newsletter' OR tags LIKE '%suscriptor%') AND email IS NOT NULL AND email != '' AND unsubscribed_at IS NULL",
  todos: "SELECT nombre, email FROM contactos WHERE email IS NOT NULL AND email != '' AND unsubscribed_at IS NULL",
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

function armarCorreo({ email, nombre }, asunto, html, prefijo = '') {
  return {
    from: FROM,
    to: [email],
    reply_to: REPLY_TO,
    subject: prefijo + personalizar(asunto, nombre, false),
    html: conBaja(personalizar(html, nombre), email),
  };
}

const esperar = ms => new Promise(r => setTimeout(r, ms));

async function enviarUno(apiKey, correo) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(correo),
  });
  if (res.ok) return null;
  const d = await res.json().catch(() => ({}));
  return d.message || `HTTP ${res.status}`;
}

// Resend permite 100 correos por llamada a /emails/batch y ~2 llamadas por segundo
async function enviarLotes(apiKey, correos) {
  let enviados = 0;
  const errors = [];
  for (let i = 0; i < correos.length; i += 100) {
    const lote = correos.slice(i, i + 100);
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(lote),
    });
    if (res.ok) {
      enviados += lote.length;
    } else {
      // Si el lote completo falla (p. ej. un correo mal escrito), se reintenta uno a uno
      for (const c of lote) {
        await esperar(600);
        try {
          const err = await enviarUno(apiKey, c);
          if (err) errors.push({ email: c.to[0], error: err });
          else enviados++;
        } catch (e) {
          errors.push({ email: c.to[0], error: String(e) });
        }
      }
    }
    await esperar(600);
  }
  return { enviados, errors };
}

export async function POST({ request }) {
  if (!isAuthenticated(request)) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401 });

  const { test, asunto, html, campanaId, audiencia = 'suscriptores' } = await request.json();
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ ok: false, error: 'RESEND_API_KEY no configurado' }), { status: 500 });

  const db = await initDb();

  if (test) {
    // Enviar solo a bernimirf@gmail.com, personalizado con su nombre en la base
    const { rows } = await db.execute({ sql: 'SELECT nombre FROM contactos WHERE lower(email)=? LIMIT 1', args: [TEST_EMAIL] });
    const err = await enviarUno(apiKey, armarCorreo({ email: TEST_EMAIL, nombre: rows[0]?.nombre ?? 'Berni' }, asunto, html, '[PRUEBA] '));
    return new Response(JSON.stringify({ ok: !err, error: err }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (!AUDIENCIAS[audiencia]) return new Response(JSON.stringify({ ok: false, error: 'audiencia inválida' }), { status: 422 });

  // Envío masivo — excluye dados de baja y correos repetidos
  const { rows } = await db.execute(AUDIENCIAS[audiencia]);
  const vistos = new Set();
  const destinatarios = rows.filter(r => {
    const e = String(r.email).trim().toLowerCase();
    if (vistos.has(e)) return false;
    vistos.add(e);
    return true;
  });

  const { enviados, errors } = await enviarLotes(apiKey, destinatarios.map(d => armarCorreo({ email: String(d.email).trim(), nombre: d.nombre }, asunto, html)));

  // Actualizar campaña como enviada
  if (campanaId) {
    await db.execute({
      sql: "UPDATE campanas SET estado='enviado', enviados=? WHERE id=?",
      args: [enviados, campanaId],
    });
  }

  return new Response(JSON.stringify({ ok: true, enviados, errors }), { headers: { 'Content-Type': 'application/json' } });
}
