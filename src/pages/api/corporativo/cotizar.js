import { initDb } from '../../../lib/db.js';
export const prerender = false;

export async function POST({ request }) {
  let data = {};
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      data = await request.json();
    } else {
      const form = await request.formData();
      for (const [k, v] of form.entries()) data[k] = v;
    }
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'bad_request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const nombre  = String(data.nombre   || '').trim();
  const email   = String(data.email    || '').trim();
  const empresa = String(data.empresa  || '').trim();
  const ocasion = String(data.ocasion  || '').trim();
  const cantidad = Number(data.cantidad) || 0;
  const tamano  = String(data.tamano   || '').trim();
  const presupuesto = String(data.presupuesto || '').trim();
  const mensaje = String(data.mensaje  || '').trim();

  if (!nombre || !email || !empresa) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), { status: 422, headers: { 'Content-Type': 'application/json' } });
  }

  const PRECIOS = { 'A4 — 21 × 30 cm': 75000, '30 × 40 cm': 95000, '40 × 50 cm': 145000, '50 × 70 cm': 220000 };
  const precioUnit = PRECIOS[tamano] || 0;
  const totalEstimado = precioUnit && cantidad ? precioUnit * cantidad : 0;

  const items = [{ desc: `${tamano || 'Sin tamaño definido'} — ${ocasion || 'Ocasión no indicada'}`, qty: cantidad || 1, precio: precioUnit }];
  const notas = [
    ocasion   ? `Ocasión: ${ocasion}` : null,
    cantidad  ? `Cantidad aprox.: ${cantidad} obras` : null,
    tamano    ? `Tamaño preferido: ${tamano}` : null,
    presupuesto ? `Presupuesto indicado: ${presupuesto}` : null,
    mensaje   ? `Mensaje: ${mensaje}` : null,
  ].filter(Boolean).join('\n');

  try {
    const db = await initDb();
    await db.execute({
      sql: `INSERT INTO cotizaciones (cliente_nombre, cliente_email, cliente_empresa, items, total, notas, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [nombre, email, empresa, JSON.stringify(items), totalEstimado, notas, 'pendiente'],
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO contactos (nombre, email, origen, tags) VALUES (?, ?, ?, ?)`,
      args: [nombre, email, 'corporativo', `empresa:${empresa}`],
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'db_error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const apiKey = import.meta.env.RESEND_API_KEY;
  if (apiKey) {
    const totalFmt = totalEstimado ? `$${totalEstimado.toLocaleString('es-CL')} CLP` : 'Por definir';
    const html = `<div style="font-family:sans-serif;max-width:580px;color:#211f18">
      <h2 style="font-size:20px;margin:0 0 20px">🎁 Nueva solicitud corporativa — Luma Arte</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#666;width:160px">Empresa</td><td style="padding:8px 0;font-weight:500">${empresa}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Contacto</td><td style="padding:8px 0">${nombre}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:8px 0;color:#666">Ocasión</td><td style="padding:8px 0">${ocasion || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Cantidad</td><td style="padding:8px 0">${cantidad ? cantidad + ' obras' : '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Tamaño</td><td style="padding:8px 0">${tamano || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Presupuesto</td><td style="padding:8px 0">${presupuesto || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Total estimado</td><td style="padding:8px 0;font-weight:600;color:#54582f">${totalFmt}</td></tr>
      </table>
      ${mensaje ? `<p style="margin-top:16px"><strong>Mensaje:</strong><br>${mensaje.replace(/\n/g,'<br>')}</p>` : ''}
      <hr style="border:none;border-top:1px solid #ddd;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Enviado desde lumaarte.com/regalos-corporativos</p>
    </div>`;
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Luma Arte <contacto@lumaproducciones.cl>',
          to: ['contacto@lumaproducciones.cl'],
          reply_to: email,
          subject: `🎁 Cotización corporativa — ${empresa} (${cantidad ? cantidad + ' obras' : 'cantidad a definir'})`,
          html,
        }),
      });
    } catch {}
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
