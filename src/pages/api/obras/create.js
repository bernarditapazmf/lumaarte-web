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
      sql: `INSERT INTO obras (nombre, serie, tecnica, imagen, precio_A4, precio_30x40, precio_40x50, precio_50x70, disponible, notas, orden)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        nombre,
        form.get('serie') || null,
        form.get('tecnica') || null,
        form.get('imagen') || null,
        Number(form.get('precio_A4')) || 0,
        Number(form.get('precio_30x40')) || 0,
        Number(form.get('precio_40x50')) || 0,
        Number(form.get('precio_50x70')) || 0,
        form.get('disponible') === 'on' ? 1 : 0,
        form.get('notas') || null,
        Number(form.get('orden')) || 0,
      ],
    });
    return redirect('/admin');
  } catch {
    return redirect('/admin/nueva?error=1');
  }
}
