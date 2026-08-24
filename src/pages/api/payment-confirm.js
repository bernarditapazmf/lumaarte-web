import crypto from 'crypto';
import { initDb } from '../../lib/db.js';

function sign(params, secretKey) {
  const keys = Object.keys(params).sort();
  const str = keys.map(k => k + params[k]).join('');
  return crypto.createHmac('sha256', secretKey).update(str).digest('hex');
}

function matLabel(mat) {
  return mat === 'black' ? 'Paspartú negro' : 'Paspartú blanco';
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
    const db = await initDb();
    const { rows: pedidos } = await db.execute({
      sql: `SELECT * FROM pedidos WHERE flow_order = ?`,
      args: [payment.commerceOrder],
    });

    await db.execute({
      sql: `UPDATE pedidos SET estado = 'pagado' WHERE flow_order = ?`,
      args: [payment.commerceOrder],
    });

    const web3key = import.meta.env.PUBLIC_WEB3FORMS_KEY;
    if (web3key && pedidos.length) {
      const first = pedidos[0];
      const detalleTexto = pedidos.map(p => {
        const partes = [p.talla, p.talla ? matLabel(p.mat) : null, p.marco ? `Marco ${p.marco}` : null].filter(Boolean).join(' · ');
        return `• ${p.obra_nombre}${partes ? ' | ' + partes : ''} | $${Number(p.monto || 0).toLocaleString('es-CL')}`;
      }).join('\n');

      const form = new FormData();
      form.append('access_key', web3key);
      form.append('subject', `✅ Pago recibido Luma Arte — Orden ${payment.commerceOrder}`);
      form.append('from_name', 'Luma Arte — Pago confirmado');
      form.append('nombre', first.cliente_nombre || '');
      form.append('email', payment.payer || first.cliente_email || '');
      form.append('telefono', first.cliente_telefono || '');
      form.append('direccion', first.cliente_direccion || '');
      form.append('ciudad', first.cliente_ciudad || '');
      form.append('region', first.cliente_region || '');
      form.append('mensaje', first.notas || '');
      form.append('detalle_pedido', detalleTexto);
      form.append('total', `$${payment.amount?.toLocaleString('es-CL')} CLP`);
      form.append('orden_flow', String(payment.flowOrder));

      await fetch('https://api.web3forms.com/submit', { method: 'POST', body: form });
    }
  }

  return new Response('OK', { status: 200 });
}
