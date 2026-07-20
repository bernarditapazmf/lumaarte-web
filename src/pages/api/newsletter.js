import { initDb } from '../../lib/db.js';
export const prerender = false;

export async function POST({ request }) {
  let email = '';
  try {
    const body = await request.json();
    email = String(body.email || '').trim().toLowerCase();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'bad_request' }), { status: 400 });
  }

  if (!email || !email.includes('@') || !email.includes('.')) {
    return new Response(JSON.stringify({ ok: false, error: 'invalid_email' }), { status: 422 });
  }

  try {
    const db = await initDb();
    // INSERT OR IGNORE respeta el UNIQUE en email — sin error si ya existe
    await db.execute({
      sql: `INSERT OR IGNORE INTO contactos (email, origen, tags) VALUES (?, ?, ?)`,
      args: [email, 'newsletter', 'suscriptor'],
    });
  } catch {
    // Cualquier otro error de DB igualmente respondemos ok para no revelar internals
  }

  // Si hay RESEND_API_KEY, enviamos un correo de bienvenida
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Luma Arte <hola@lumaarte.com>',
          to: [email],
          subject: 'Bienvenida a Cartas desde el Sur — Luma Arte',
          html: `
            <div style="font-family:Georgia,serif;max-width:520px;color:#211f18;padding:40px 24px">
              <p style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#54582f;margin:0 0 24px">Luma Arte · Newsletter</p>
              <h1 style="font-size:28px;font-weight:400;line-height:1.2;margin:0 0 20px">Bienvenida a <em>Cartas desde el Sur</em>.</h1>
              <p style="font-size:16px;line-height:1.75;color:rgba(33,31,24,.8);margin:0 0 16px">
                Gracias por suscribirte. De vez en cuando te escribiremos con novedades de nuevas obras, reflexiones sobre arte y naturaleza, y algo de la vida en el sur de Chile.
              </p>
              <p style="font-size:16px;line-height:1.75;color:rgba(33,31,24,.8);margin:0 0 32px">
                Sin ruido. Solo lo que vale la pena.
              </p>
              <a href="https://www.lumaarte.com" style="display:inline-block;padding:14px 28px;border-radius:60px;background:#211f18;color:#fdfcf8;font-family:monospace;font-size:12px;letter-spacing:.12em;text-transform:uppercase;text-decoration:none">Ver obras →</a>
              <p style="margin-top:40px;font-size:12px;color:rgba(33,31,24,.4);line-height:1.6">
                Luma Arte · Puerto Varas, Región de Los Lagos<br>
                <a href="https://www.lumaarte.com" style="color:rgba(33,31,24,.4)">lumaarte.com</a>
              </p>
            </div>`,
        }),
      });
    } catch {}
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
