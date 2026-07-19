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
              nombre=?, serie=?, tecnica=?, imagen=?,
              precio_30x40=?, precio_40x50=?, precio_50x70=?,
              costo_produccion=?, costo_enmarcado=?, pago_enmarcador_pendiente=?,
              disponible=?, notas=?, orden=?
            WHERE id=?`,
      args: [
        nombre,
        form.get('serie') || null,
        form.get('tecnica') || null,
        form.get('imagen') || null,
        Number(form.get('precio_30x40')) || 0,
        Number(form.get('precio_40x50')) || 0,
        Number(form.get('precio_50x70')) || 0,
        Number(form.get('costo_produccion')) || 0,
        Number(form.get('costo_enmarcado')) || 0,
        Number(form.get('pago_enmarcador_pendiente')) || 0,
        form.get('disponible') === 'on' ? 1 : 0,
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
