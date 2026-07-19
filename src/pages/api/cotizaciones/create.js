import { isAuthenticated } from '../../../lib/auth.js';
import { initDb } from '../../../lib/db.js';
export const prerender = false;
export async function POST({ request, redirect }) {
  if (!isAuthenticated(request)) return redirect('/admin/login');
  const form = await request.formData();
  const descs = form.getAll('item_desc[]');
  const qtys = form.getAll('item_qty[]');
  const precios = form.getAll('item_precio[]');
  const items = descs.map((d, i) => ({ desc: d, qty: Number(qtys[i])||1, precio: Number(precios[i])||0 })).filter(i => i.desc);
  const total = Number(form.get('total')) || 0;
  const db = await initDb();
  const result = await db.execute({ sql: 'INSERT INTO cotizaciones (cliente_nombre,cliente_email,cliente_empresa,items,total,notas) VALUES (?,?,?,?,?,?)', args:[form.get('cliente_nombre')||null, form.get('cliente_email')||null, form.get('cliente_empresa')||null, JSON.stringify(items), total, form.get('notas')||null] });
  return redirect(`/admin/cotizaciones/${result.lastInsertRowid}`);
}
