import { initDb } from '../../../lib/db.js';
import { isAuthenticated } from '../../../lib/auth.js';
export const prerender = false;

// Pausar o reanudar una campaña que se envía por tandas diarias
export async function POST({ request }) {
  if (!isAuthenticated(request)) return new Response(JSON.stringify({ ok: false }), { status: 401 });
  const { id, accion } = await request.json();
  const [desde, hasta] = accion === 'pausar' ? ['enviando', 'pausado'] : accion === 'reanudar' ? ['pausado', 'enviando'] : [];
  if (!desde) return new Response(JSON.stringify({ ok: false, error: 'acción inválida' }), { status: 422 });
  const db = await initDb();
  const r = await db.execute({ sql: 'UPDATE campanas SET estado=? WHERE id=? AND estado=?', args: [hasta, id, desde] });
  return new Response(JSON.stringify({ ok: r.rowsAffected === 1 }), { headers: { 'Content-Type': 'application/json' } });
}
