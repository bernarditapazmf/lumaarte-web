import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';

export const prerender = false;

export async function POST({ request, redirect }) {
  if (!isAuthenticated(request)) return redirect('/admin/login');
  const form = await request.formData();
  const id = form.get('id');
  const estado = form.get('estado');
  if (!id || !estado) return redirect('/admin/pedidos');
  const db = await initDb();
  await db.execute({ sql: 'UPDATE pedidos SET estado=? WHERE id=?', args: [estado, id] });
  return redirect('/admin/pedidos');
}
