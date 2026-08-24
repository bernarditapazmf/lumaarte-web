import crypto from 'crypto';
import { initDb } from '../../lib/db.js';

function sign(params, secretKey) {
  const keys = Object.keys(params).sort();
  const str = keys.map(k => k + params[k]).join('');
  return crypto.createHmac('sha256', secretKey).update(str).digest('hex');
}

export async function POST({ request }) {
  const body = await request.json();
  const { items, total, nombre, email, telefono, direccion, ciudad, region, mensaje } = body;

  const apiKey = import.meta.env.FLOW_API_KEY;
  const secretKey = import.meta.env.FLOW_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return new Response(JSON.stringify({ error: 'Credenciales Flow no configuradas' }), { status: 500 });
  }

  const commerceOrder = 'LUMA-' + Date.now();
  const subject = 'Pedido Luma Arte';
  const urlBase = 'https://www.lumaarte.com';

  // Guardamos el pedido en la base de datos ANTES de ir a pagar. Flow limita
  // fuertemente el largo del parámetro "optional", así que ya no dependemos
  // de que nos devuelva el detalle completo — lo recuperamos por flow_order.
  try {
    const db = await initDb();
    const fechaPedido = new Date().toISOString().slice(0, 10);
    for (const item of (items || [])) {
      await db.execute({
        sql: `INSERT INTO pedidos
              (obra_nombre, talla, mat, marco, cliente_nombre, cliente_email, cliente_telefono,
               cliente_direccion, cliente_ciudad, cliente_region, monto, estado, fecha_pedido, flow_order, notas)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          item.title || null, item.size || null, item.mat || null, item.marco || null,
          nombre || null, email || null, telefono || null,
          direccion || null, ciudad || null, region || null,
          item.precio || 0, 'pendiente_pago', fechaPedido, commerceOrder, mensaje || null,
        ],
      });
    }
  } catch (e) {
    console.error('Error guardando pedido:', e);
    return new Response(JSON.stringify({ error: 'No se pudo registrar el pedido' }), { status: 500 });
  }

  const params = {
    apiKey,
    commerceOrder,
    subject,
    currency: 'CLP',
    amount: total,
    email,
    urlConfirmation: `${urlBase}/api/payment-confirm`,
    urlReturn: `${urlBase}/pago-resultado`,
  };

  params.s = sign(params, secretKey);

  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) form.append(k, v);

  const res = await fetch('https://www.flow.cl/api/payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  const json = await res.json();

  if (json.url && json.token) {
    return new Response(JSON.stringify({ redirectUrl: json.url + '?token=' + json.token }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: json.message || 'Error al crear pago' }), { status: 400 });
}
