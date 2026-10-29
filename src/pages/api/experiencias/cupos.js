import { initDb } from '../../../lib/db.js';
import { RETIRO_MUJERES as R, contarOcupados, tramoVigente } from '../../../lib/experiencias.js';
export const prerender = false;

// Estado público de cupos del retiro, para mostrarlo en páginas estáticas (ej. la home).
export async function GET() {
  try {
    const db = await initDb();
    const ocupados = await contarOcupados(db, R);
    const t = tramoVigente(R, ocupados);
    const body = t
      ? { agotado: false, tramo: t.nombre, precio: t.precio, quedanEnTramo: t.quedan, quedanTotal: R.cuposTotales - ocupados }
      : { agotado: true };
    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('Error leyendo cupos:', e);
    return new Response(JSON.stringify({ error: 'no disponible' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }
}
