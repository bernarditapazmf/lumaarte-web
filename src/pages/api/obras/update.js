import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';

export const prerender = false;

export async function POST({ request, redirect }) {
  if (!isAuthenticated(request)) return redirect('/admin/login');

  const form = await request.formData();
  const id = form.get('id');
  const nombre = form.get('nombre');
  if (!id || !nombre) return redirect('/admin');

  try {
    const db = await initDb();
    await db.execute({
      sql: `UPDATE obras SET
              nombre=?, serie=?, tecnica=?, dimensiones=?,
              precio=?, disponible=?, imagen=?, notas=?, orden=?
            WHERE id=?`,
      args: [
        nombre,
        form.get('serie') || null,
        form.get('tecnica') || null,
        form.get('dimensiones') || null,
        Number(form.get('precio')) || 0,
        form.get('disponible') === 'on' ? 1 : 0,
        form.get('imagen') || null,
        form.get('notas') || null,
        Number(form.get('orden')) || 0,
        id,
      ],
    });
    return redirect('/admin');
  } catch {
    return redirect(`/admin/editar/${id}?error=1`);
  }
}
