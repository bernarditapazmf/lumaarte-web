import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';
export const prerender = false;
export async function POST({ request, redirect }) {
  if (!isAuthenticated(request)) return redirect('/admin/login');
  const form = await request.formData();
  const email = form.get('email');
  if (!email) return redirect('/admin/contactos');
  try {
    const db = await initDb();
    await db.execute({ sql: 'INSERT OR IGNORE INTO contactos (nombre,email,telefono,origen) VALUES (?,?,?,?)', args:[form.get('nombre')||null,email,form.get('telefono')||null,'manual'] });
  } catch {}
  return redirect('/admin/contactos?ok=1');
}
