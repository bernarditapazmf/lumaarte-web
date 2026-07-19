import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';
export const prerender = false;
export async function POST({ request, redirect }) {
  if (!isAuthenticated(request)) return redirect('/admin/login');
  const form = await request.formData();
  const asunto = form.get('asunto');
  const cuerpo = form.get('cuerpo');
  const apiKey = import.meta.env.RESEND_API_KEY;

  const db = await initDb();
  const { rows: contactos } = await db.execute("SELECT * FROM contactos WHERE email IS NOT NULL");

  if (!apiKey) {
    await db.execute({ sql: 'INSERT INTO campanas (asunto,cuerpo,estado) VALUES (?,?,?)', args:[asunto,cuerpo,'sin_api_key'] });
    return redirect('/admin/contactos?error=no_api_key');
  }

  let enviados = 0;
  for (const c of contactos) {
    const html = cuerpo.replace('{nombre}', c.nombre || 'amig@');
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'Luma Arte <hola@lumaarte.com>', to: [c.email], subject: asunto, html }),
      });
      if (res.ok) enviados++;
    } catch {}
  }

  await db.execute({ sql: 'INSERT INTO campanas (asunto,cuerpo,estado,enviados) VALUES (?,?,?,?)', args:[asunto,cuerpo,'enviada',enviados] });
  return redirect('/admin/contactos?ok=campana');
}
