import { initDb } from '../../../lib/db.js';
export const prerender = false;

export async function POST({ request }) {
  let data = {};
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'bad_request' }), { status: 400 });
  }

  const nombre  = String(data.nombre  || '').trim();
  const email   = String(data.email   || '').trim();
  const tamano  = String(data.tamano  || '').trim();
  const madera  = String(data.madera  || '').trim();
  const mensaje = String(data.mensaje || '').trim();

  if (!nombre || !email) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), { status: 422 });
  }

  const items = [{ desc: `Foto Bordado — ${tamano || 'tamaño a definir'} · madera ${madera || 'a definir'}`, qty: 1, precio: 0 }];
  const notas = [
    tamano  ? `Tamaño: ${tamano}` : null,
    madera  ? `Madera: ${madera}` : null,
    mensaje ? `Mensaje: ${mensaje}` : null,
  ].filter(Boolean).join('\n');

  try {
    const db = await initDb();
    await db.execute({
      sql: `INSERT INTO cotizaciones (cliente_nombre, cliente_email, items, total, notas, estado)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [nombre, email, JSON.stringify(items), 0, notas, 'pendiente'],
    });
    await db.execute({
      sql: `INSERT OR IGNORE INTO contactos (nombre, email, origen, tags) VALUES (?, ?, ?, ?)`,
      args: [nombre, email, 'foto-bordado', madera ? `madera:${madera}` : null],
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'db_error' }), { status: 500 });
  }

  const apiKey = import.meta.env.RESEND_API_KEY;
  if (apiKey) {
    const html = `<div style="font-family:sans-serif;max-width:560px;color:#211f18">
      <h2 style="font-size:20px;margin:0 0 20px">🧵 Nueva solicitud — Foto Bordado</h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#666;width:140px">Nombre</td><td style="padding:8px 0;font-weight:500">${nombre}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td style="padding:8px 0;color:#666">Tamaño</td><td style="padding:8px 0">${tamano || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#666">Madera</td><td style="padding:8px 0">${madera || '—'}</td></tr>
      </table>
      ${mensaje ? `<p style="margin-top:16px"><strong>Mensaje:</strong><br>${mensaje.replace(/\n/g,'<br>')}</p>` : ''}
      <hr style="border:none;border-top:1px solid #ddd;margin:24px 0"/>
      <p style="font-size:12px;color:#999">Enviado desde lumaarte.com/colecciones — Foto Bordado</p>
    </div>`;
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Luma Arte <contacto@lumaarte.com>',
          to: ['contacto@lumaarte.com'],
          reply_to: email,
          subject: `🧵 Foto Bordado — solicitud de ${nombre}`,
          html,
        }),
      });
      if (!res.ok) console.error('Resend error (foto-bordado):', res.status, await res.text());
    } catch (e) {
      console.error('Resend fetch failed (foto-bordado):', e);
    }
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
