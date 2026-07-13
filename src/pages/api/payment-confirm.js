import crypto from 'crypto';

function sign(params, secretKey) {
  const keys = Object.keys(params).sort();
  const str = keys.map(k => k + params[k]).join('');
  return crypto.createHmac('sha256', secretKey).update(str).digest('hex');
}

export async function POST({ request }) {
  const formData = await request.formData();
  const token = formData.get('token');

  const apiKey = import.meta.env.FLOW_API_KEY;
  const secretKey = import.meta.env.FLOW_SECRET_KEY;

  const params = { apiKey, token };
  const s = sign(params, secretKey);
  const qs = new URLSearchParams({ ...params, s }).toString();

  const res = await fetch(`https://www.flow.cl/api/payment/getStatus?${qs}`);
  const payment = await res.json();

  if (payment.status === 2) {
    // Pago exitoso — enviar email de notificación
    const optional = payment.optional ? JSON.parse(payment.optional) : {};
    const web3key = import.meta.env.PUBLIC_WEB3FORMS_KEY;

    if (web3key) {
      const items = optional.items ? JSON.parse(optional.items) : [];
      const detalleTexto = items.map(c => `• ${c.title} | ${c.detail} | $${c.precio?.toLocaleString('es-CL')}`).join('\n');

      const form = new FormData();
      form.append('access_key', web3key);
      form.append('subject', `✅ Pago recibido Luma Arte — Orden ${payment.commerceOrder}`);
      form.append('from_name', 'Luma Arte — Pago confirmado');
      form.append('nombre', optional.nombre || '');
      form.append('email', payment.payer || '');
      form.append('telefono', optional.telefono || '');
      form.append('direccion', optional.direccion || '');
      form.append('ciudad', optional.ciudad || '');
      form.append('region', optional.region || '');
      form.append('mensaje', optional.mensaje || '');
      form.append('detalle_pedido', detalleTexto);
      form.append('total', `$${payment.amount?.toLocaleString('es-CL')} CLP`);
      form.append('orden_flow', String(payment.flowOrder));

      await fetch('https://api.web3forms.com/submit', { method: 'POST', body: form });
    }
  }

  return new Response('OK', { status: 200 });
}
