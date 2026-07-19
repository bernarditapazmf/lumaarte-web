import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';
export const prerender = false;
export async function POST({ request, redirect }) {
  if (!isAuthenticated(request)) return redirect('/admin/login');
  const form = await request.formData();
  const db = await initDb();
  await db.execute({ sql: 'UPDATE cotizaciones SET estado=? WHERE id=?', args:[form.get('estado'), form.get('id')] });
  return redirect(`/admin/cotizaciones/${form.get('id')}`);
}
