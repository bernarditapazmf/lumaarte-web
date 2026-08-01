import { initDb } from '../../../lib/db.js';
import { isAuthenticated } from '../../../lib/auth.js';
export const prerender = false;

const ALLOWED_KEYS = [
  'costo_impresion_A4',
  'costo_enmarcado_A4',
  'costo_impresion_30x40',
  'costo_enmarcado_30x40',
  'costo_impresion_40x50',
  'costo_enmarcado_40x50',
  'costo_impresion_50x70',
  'costo_enmarcado_50x70',
];

export async function POST({ request }) {
  if (!isAuthenticated(request)) return new Response(JSON.stringify({ ok: false }), { status: 401 });

  const body = await request.json();
  const db = await initDb();

  for (const clave of ALLOWED_KEYS) {
    if (clave in body) {
      await db.execute({
        sql: `INSERT INTO configuracion (clave, valor, updated_at) VALUES (?,?,CURRENT_TIMESTAMP)
              ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor, updated_at=CURRENT_TIMESTAMP`,
        args: [clave, body[clave] || null],
      });
    }
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
