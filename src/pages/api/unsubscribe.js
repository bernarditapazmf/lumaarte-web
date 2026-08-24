import { initDb } from '../../lib/db.js';
import { unsubscribeToken } from '../../lib/unsubscribe.js';
export const prerender = false;

export async function GET({ url }) {
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();
  const token = url.searchParams.get('token') || '';
  const valid = email && token && token === unsubscribeToken(email);

  if (valid) {
    const db = await initDb();
    await db.execute({
      sql: `UPDATE contactos SET unsubscribed_at = CURRENT_TIMESTAMP WHERE email = ?`,
      args: [email],
    });
  }

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Luma Arte</title>
<style>
  body{font-family:'CoFo Sans',system-ui,sans-serif;background:#f3f0e9;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:0}
  .card{background:#fdfcf8;border:.5px solid rgba(33,31,24,.12);border-radius:12px;padding:48px 40px;max-width:420px;text-align:center;color:#211f18}
  a{color:#54582f}
</style>
</head>
<body>
  <div class="card">
    ${valid
      ? `<h2>Listo, te diste de baja</h2><p>No vas a recibir más correos de Luma Arte en <strong>${email}</strong>.</p>`
      : `<h2>No pudimos procesar tu solicitud</h2><p>El enlace no es válido o ya expiró. Escríbenos a <a href="mailto:contacto@lumaarte.com">contacto@lumaarte.com</a> y te sacamos de la lista manualmente.</p>`}
    <p style="margin-top:24px"><a href="https://www.lumaarte.com">Volver al sitio</a></p>
  </div>
</body>
</html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
