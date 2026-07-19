import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';
export const prerender = false;
export async function POST({ request, redirect }) {
  if (!isAuthenticated(request)) return redirect('/admin/login');
  const db = await initDb();
  const { rows } = await db.execute('SELECT DISTINCT cliente_email, cliente_nombre FROM pedidos WHERE cliente_email IS NOT NULL');
  for (const p of rows) {
    await db.execute({ sql: 'INSERT OR IGNORE INTO contactos (nombre,email,origen) VALUES (?,?,?)', args:[p.cliente_nombre||null,p.cliente_email,'compra'] });
  }
  return redirect('/admin/contactos');
}
