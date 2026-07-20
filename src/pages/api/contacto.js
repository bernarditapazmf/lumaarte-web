import { initDb } from '../../lib/db.js';
export const prerender = false;

export async function POST({ request }) {
  let nombre = '', email = '', mensaje = '';
  try {
    const body = await request.json();
    nombre  = String(body.nombre  || '').trim();
    email   = String(body.email   || '').trim();
    mensaje = String(body.mensaje || '').trim();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'bad_request' }), { status: 400 });
  }

  if (!nombre || !email) {
    return new Response(JSON.stringify({ ok: false, error: 'missing_fields' }), { status: 422 });
  }

  // Save to contactos DB (ignore duplicate email)
  try {
    const db = await initDb();
    await db.execute({
      sql: `INSERT OR IGNORE INTO contactos (nombre, email, origen, tags) VALUES (?, ?, ?, ?)`,
      args: [nombre, email, 'colaboracion', mensaje ? `mensaje: ${mensaje.slice(0, 500)}` : null],
    });
  } catch {}

  // Send notification email via Resend
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (apiKey) {
    const htmlBody = `
      <div style="font-family:sans-serif;max-width:560px;color:#211f18">
        <h2 style="font-size:20px;margin:0 0 20px">Nuevo mensaje — Colaboremos</h2>
        <p><strong>Nombre:</strong> ${nombre}</p>
        <p><strong>Correo:</strong> <a href="mailto:${email}">${email}</a></p>
        ${mensaje ? `<p><strong>Mensaje:</strong><br>${mensaje.replace(/\n/g,'<br>')}</p>` : ''}
        <hr style="border:none;border-top:1px solid #ddd;margin:24px 0"/>
        <p style="font-size:12px;color:#999">Enviado desde lumaarte.com — formulario Colaboremos</p>
      </div>`;
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Luma Arte <hola@lumaarte.com>',
          to: ['contacto@lumaproducciones.cl'],
          reply_to: email,
          subject: `✉️ Nuevo mensaje de ${nombre} — Luma Arte`,
          html: htmlBody,
        }),
      });
    } catch {}
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
