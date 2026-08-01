import { initDb } from '../../../lib/db.js';
import { isAuthenticated } from '../../../lib/auth.js';
export const prerender = false;

export async function POST({ request }) {
  if (!isAuthenticated(request)) return new Response(JSON.stringify({ ok: false }), { status: 401 });
  const { id } = await request.json();
  const db = await initDb();
  await db.execute({ sql: 'DELETE FROM blog_posts WHERE id=?', args: [id] });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
