import { initDb } from '../../../lib/db.js';
import { isAuthenticated } from '../../../lib/auth.js';
export const prerender = false;

export async function POST({ request }) {
  if (!isAuthenticated(request)) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401 });

  const { id, titulo, slug, descripcion, contenido, hero_image, pub_date, estado } = await request.json();
  if (!titulo || !slug) return new Response(JSON.stringify({ ok: false, error: 'titulo y slug requeridos' }), { status: 422 });

  const db = await initDb();
  if (id) {
    await db.execute({
      sql: 'UPDATE blog_posts SET titulo=?,slug=?,descripcion=?,contenido=?,hero_image=?,pub_date=?,estado=? WHERE id=?',
      args: [titulo, slug, descripcion||null, contenido||null, hero_image||null, pub_date||null, estado||'borrador', id],
    });
    return new Response(JSON.stringify({ ok: true, id }), { headers: { 'Content-Type': 'application/json' } });
  } else {
    try {
      const r = await db.execute({
        sql: 'INSERT INTO blog_posts (titulo,slug,descripcion,contenido,hero_image,pub_date,estado) VALUES (?,?,?,?,?,?,?)',
        args: [titulo, slug, descripcion||null, contenido||null, hero_image||null, pub_date||null, estado||'borrador'],
      });
      return new Response(JSON.stringify({ ok: true, id: Number(r.lastInsertRowid) }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: 'El slug ya existe. Usa uno diferente.' }), { headers: { 'Content-Type': 'application/json' } });
    }
  }
}
