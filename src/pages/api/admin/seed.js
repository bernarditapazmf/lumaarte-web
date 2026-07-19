import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';

export const prerender = false;

const OBRAS_INICIALES = [
  { nombre: 'Dúo Lilium y Volcanes I',  serie: 'Volcanes', tecnica: 'Técnica mixta', imagen: 'obra1.png', orden: 1 },
  { nombre: 'Dúo Lilium y Volcanes II', serie: 'Volcanes', tecnica: 'Técnica mixta', imagen: 'obra2.png', orden: 2 },
  { nombre: 'Rostro de Chilcos',         serie: null,        tecnica: 'Técnica mixta', imagen: 'obra3.png', orden: 3 },
  { nombre: 'Mujer Hortensia',           serie: null,        tecnica: 'Técnica mixta', imagen: 'obra4.png', orden: 4 },
  { nombre: 'Bosque de Arrayanes',       serie: null,        tecnica: 'Técnica mixta', imagen: 'obra5.png', orden: 5 },
];

export async function POST({ request, redirect }) {
  if (!isAuthenticated(request)) return redirect('/admin/login');

  const db = await initDb();
  const { rows } = await db.execute('SELECT COUNT(*) as n FROM obras');
  if (rows[0].n > 0) {
    return new Response(JSON.stringify({ ok: false, msg: 'Ya hay obras en la base de datos' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  for (const o of OBRAS_INICIALES) {
    await db.execute({
      sql: `INSERT INTO obras (nombre, serie, tecnica, imagen, precio_30x40, precio_40x50, precio_50x70, disponible, orden)
            VALUES (?, ?, ?, ?, 95000, 145000, 220000, 1, ?)`,
      args: [o.nombre, o.serie, o.tecnica, o.imagen, o.orden],
    });
  }

  return redirect('/admin');
}
