import crypto from 'crypto';

const FLOW_API = 'https://www.flow.cl/api';

export function signFlow(params, secretKey) {
  const keys = Object.keys(params).sort();
  const str = keys.map(k => k + params[k]).join('');
  return crypto.createHmac('sha256', secretKey).update(str).digest('hex');
}

function credenciales() {
  const apiKey = import.meta.env.FLOW_API_KEY;
  const secretKey = import.meta.env.FLOW_SECRET_KEY;
  if (!apiKey || !secretKey) throw new Error('Credenciales Flow no configuradas');
  return { apiKey, secretKey };
}

// Crea un pago en Flow y devuelve la URL a la que hay que redirigir a quien paga.
export async function crearPagoFlow({ commerceOrder, subject, amount, email }) {
  const { apiKey, secretKey } = credenciales();
  const urlBase = 'https://www.lumaarte.com';
  const params = {
    apiKey,
    commerceOrder,
    subject,
    currency: 'CLP',
    amount,
    email,
    urlConfirmation: `${urlBase}/api/payment-confirm`,
    urlReturn: `${urlBase}/pago-resultado`,
  };
  params.s = signFlow(params, secretKey);

  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) form.append(k, v);

  const res = await fetch(`${FLOW_API}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const json = await res.json();
  if (json.url && json.token) return { redirectUrl: `${json.url}?token=${json.token}` };
  throw new Error(json.message || 'Error al crear pago');
}

export async function estadoPagoFlow(token) {
  const { apiKey, secretKey } = credenciales();
  const params = { apiKey, token };
  const s = signFlow(params, secretKey);
  const qs = new URLSearchParams({ ...params, s }).toString();
  const res = await fetch(`${FLOW_API}/payment/getStatus?${qs}`);
  return res.json(); // status: 1=pendiente, 2=pagado, 3=rechazado, 4=anulado
}
