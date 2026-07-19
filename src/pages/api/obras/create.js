import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';

export const prerender = false;

export async function POST({ request, redirect }) {
  if (!isAuthenticated(request)) return redirect('/admin/login');

  const form = await request.formData();
  const nombre = form.get('nombre');
  if (!nombre) return redirect('/admin/nueva?error=1');

  try {
    const db = await initDb();
    await db.execute({
      sql: `INSERT INTO obras (nombre, serie, tecnica, dimensiones, precio, disponible, imagen, notas, orden)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ],
    });
    return redirect('/admin');
  } catch {
    return redirect('/admin/nueva?error=1');
  }
}
