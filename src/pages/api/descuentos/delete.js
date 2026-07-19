import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';
export const prerender = false;
export async function POST({ request, redirect }) {
  if (!isAuthenticated(request)) return redirect('/admin/login');
  const form = await request.formData();
  const db = await initDb();
  await db.execute({ sql: 'DELETE FROM codigos_descuento WHERE id=?', args:[form.get('id')] });
  return redirect('/admin/descuentos');
}
