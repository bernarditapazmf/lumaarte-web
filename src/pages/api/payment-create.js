import { initDb } from '../../lib/db.js';
import { crearPagoFlow } from '../../lib/flow.js';
import { precioItem, MARCOS } from '../../lib/precios.js';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export async function POST({ request }) {
  const body = await request.json();
  const { items, nombre, email, telefono, direccion, ciudad, region, mensaje } = body;

  if (!Array.isArray(items) || items.length === 0) return json({ error: 'El carrito está vacío' }, 400);
  if (!nombre || !email) return json({ error: 'Faltan nombre o correo' }, 422);

  // El monto se calcula en el servidor con la lista de precios oficial.
  // Se ignora cualquier precio o total que venga desde el navegador.
  const lineas = [];
  for (const item of items) {
    const precio = precioItem(item);
    if (precio === null) return json({ error: `Producto no válido: ${item?.title || 'desconocido'}` }, 400);
    const esGiftcard = item.title.startsWith('Giftcard');
    lineas.push({
      titulo: item.title,
      talla: esGiftcard ? null : item.size,
      mat: esGiftcard ? null : (item.mat === 'black' ? 'black' : 'white'),
      marco: esGiftcard ? null : (MARCOS.includes(item.marco) ? item.marco : MARCOS[0]),
      precio,
      notasItem: esGiftcard
        ? [`Giftcard para: ${item.para || '—'} (${item.paraEmail || '—'})`, `De: ${item.de || '—'}`, item.dedicatoria ? `Dedicatoria: ${item.dedicatoria}` : null].filter(Boolean).join('\n')
        : null,
    });
  }
  const total = lineas.reduce((s, l) => s + l.precio, 0);

  const commerceOrder = 'LUMA-' + Date.now();

  // Guardamos el pedido en la base de datos ANTES de ir a pagar. Flow limita
  // fuertemente el largo del parámetro "optional", así que no dependemos
  // de que nos devuelva el detalle — lo recuperamos por flow_order.
  try {
    const db = await initDb();
    const fechaPedido = new Date().toISOString().slice(0, 10);
    for (const l of lineas) {
      const notas = [mensaje ? `Mensaje: ${mensaje}` : null, l.notasItem].filter(Boolean).join('\n') || null;
      await db.execute({
        sql: `INSERT INTO pedidos
              (obra_nombre, talla, mat, marco, cliente_nombre, cliente_email, cliente_telefono,
               cliente_direccion, cliente_ciudad, cliente_region, monto, estado, fecha_pedido, flow_order, notas)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          l.titulo, l.talla, l.mat, l.marco,
          nombre, email, telefono || null,
          direccion || null, ciudad || null, region || null,
          l.precio, 'pendiente_pago', fechaPedido, commerceOrder, notas,
        ],
      });
    }
  } catch (e) {
    console.error('Error guardando pedido:', e);
    return json({ error: 'No se pudo registrar el pedido' }, 500);
  }

  try {
    const { redirectUrl } = await crearPagoFlow({ commerceOrder, subject: 'Pedido Luma Arte', amount: total, email });
    return json({ redirectUrl });
  } catch (e) {
    return json({ error: e.message }, 400);
  }
}
