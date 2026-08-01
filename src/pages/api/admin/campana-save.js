import { initDb } from '../../../lib/db.js';
import { isAuthenticated } from '../../../lib/auth.js';
export const prerender = false;

export async function POST({ request }) {
  if (!isAuthenticated(request)) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401 });
  const { id, asunto, preheader, header_img, cuerpo, html } = await request.json();
  if (!asunto) return new Response(JSON.stringify({ ok: false, error: 'asunto requerido' }), { status: 422 });
  const db = await initDb();
  if (id) {
    await db.execute({
      sql: 'UPDATE campanas SET asunto=?, preheader=?, header_img=?, cuerpo=?, html=? WHERE id=?',
      args: [asunto, preheader || null, header_img || null, cuerpo, html, id],
    });
    return new Response(JSON.stringify({ ok: true, id }), { headers: { 'Content-Type': 'application/json' } });
  } else {
    const r = await db.execute({
      sql: 'INSERT INTO campanas (asunto, preheader, header_img, cuerpo, html) VALUES (?,?,?,?,?)',
      args: [asunto, preheader || null, header_img || null, cuerpo, html],
    });
    return new Response(JSON.stringify({ ok: true, id: Number(r.lastInsertRowid) }), { headers: { 'Content-Type': 'application/json' } });
  }
}
