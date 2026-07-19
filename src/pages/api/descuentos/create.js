import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';
export const prerender = false;
export async function POST({ request, redirect }) {
  if (!isAuthenticated(request)) return redirect('/admin/login');
  const form = await request.formData();
  const codigo = form.get('codigo')?.toString().toUpperCase();
  if (!codigo) return redirect('/admin/descuentos');
  try {
    const db = await initDb();
    await db.execute({ sql: 'INSERT INTO codigos_descuento (codigo,tipo,valor,usos_max,expira_en) VALUES (?,?,?,?,?)', args:[codigo, form.get('tipo')||'porcentaje', Number(form.get('valor'))||0, Number(form.get('usos_max'))||100, form.get('expira_en')||null] });
  } catch {}
  return redirect('/admin/descuentos?ok=1');
}
