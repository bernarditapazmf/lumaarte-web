import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';
export const prerender = false;

// Importación masiva desde una planilla: [{ nombre, email, telefono }], sin pisar contactos existentes
export async function POST({ request }) {
  if (!isAuthenticated(request)) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401 });
  const { contactos, origen = 'importado' } = await request.json();
  if (!Array.isArray(contactos) || !contactos.length || contactos.length > 1000) {
    return new Response(JSON.stringify({ ok: false, error: 'envía entre 1 y 1000 contactos por llamada' }), { status: 422 });
  }

  const validos = contactos
    .map(c => ({ nombre: String(c.nombre ?? '').trim() || null, email: String(c.email ?? '').trim().toLowerCase(), telefono: String(c.telefono ?? '').trim() || null }))
    .filter(c => /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(c.email));

  const db = await initDb();
  const res = await db.batch(validos.map(c => ({
    sql: 'INSERT OR IGNORE INTO contactos (nombre,email,telefono,origen) VALUES (?,?,?,?)',
    args: [c.nombre, c.email, c.telefono, origen],
  })), 'write');
  const nuevos = res.reduce((n, r) => n + r.rowsAffected, 0);

  return new Response(JSON.stringify({ ok: true, recibidos: contactos.length, nuevos }), { headers: { 'Content-Type': 'application/json' } });
}
