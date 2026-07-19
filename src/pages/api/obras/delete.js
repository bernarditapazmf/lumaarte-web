import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';

export const prerender = false;

export async function POST({ request, redirect }) {
  if (!isAuthenticated(request)) return redirect('/admin/login');

  const form = await request.formData();
  const id = form.get('id');
  if (!id) return redirect('/admin');

  const db = await initDb();
  await db.execute({ sql: 'DELETE FROM obras WHERE id = ?', args: [id] });
  return redirect('/admin');
}
