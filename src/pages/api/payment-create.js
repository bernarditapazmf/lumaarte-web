import crypto from 'crypto';

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

  const params = {
    apiKey,
    commerceOrder,
    subject,
    currency: 'CLP',
    amount: total,
    email,
    urlConfirmation: `${urlBase}/api/payment-confirm`,
    urlReturn: `${urlBase}/pago-resultado`,
    optional: JSON.stringify({ nombre, telefono, direccion, ciudad, region, mensaje, items: JSON.stringify(items) }),
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
