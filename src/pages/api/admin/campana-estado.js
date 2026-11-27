import { initDb } from '../../../lib/db.js';
import { isAuthenticated } from '../../../lib/auth.js';
export const prerender = false;

const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });

// Pausar o reanudar una campaña que se envía por tandas diarias, o cambiar cuántos correos salen por día
export async function POST({ request }) {
  if (!isAuthenticated(request)) return json({ ok: false }, 401);
  const { id, accion, porDia } = await request.json();
  const db = await initDb();

  if (accion === 'ritmo') {
    const n = Math.floor(Number(porDia));
    if (!(n >= 1 && n <= 5000)) return json({ ok: false, error: 'el envío diario debe ser entre 1 y 5000' }, 422);
    // Solo campañas por tandas en curso; el cambio corre desde la próxima tanda
    const r = await db.execute({ sql: "UPDATE campanas SET por_dia=? WHERE id=? AND estado IN ('enviando','pausado') AND por_dia > 0", args: [n, id] });
    return json({ ok: r.rowsAffected === 1 });
  }

  const [desde, hasta] = accion === 'pausar' ? ['enviando', 'pausado'] : accion === 'reanudar' ? ['pausado', 'enviando'] : [];
  if (!desde) return json({ ok: false, error: 'acción inválida' }, 422);
  const r = await db.execute({ sql: 'UPDATE campanas SET estado=? WHERE id=? AND estado=?', args: [hasta, id, desde] });
  return json({ ok: r.rowsAffected === 1 });
}
