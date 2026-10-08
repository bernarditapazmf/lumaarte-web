import { initDb } from '../../lib/db.js';
import { estadoPagoFlow } from '../../lib/flow.js';
import { RETIRO_MUJERES } from '../../lib/experiencias.js';
import { enviarBienvenidaRetiro, avisarInscripcionRetiro } from '../../lib/emailsRetiro.js';

function matLabel(mat) {
  return mat === 'black' ? 'Paspartú negro' : 'Paspartú blanco';
}

async function confirmarPedidoTienda(db, payment) {
  const { rows: pedidos } = await db.execute({
    sql: `SELECT * FROM pedidos WHERE flow_order = ?`,
    args: [payment.commerceOrder],
  });

  await db.execute({
    sql: `UPDATE pedidos SET estado = 'pagado' WHERE flow_order = ?`,
    args: [payment.commerceOrder],
  });

  const web3key = import.meta.env.PUBLIC_WEB3FORMS_KEY;
  if (!web3key || !pedidos.length) return;

  const first = pedidos[0];
  const detalleTexto = pedidos.map(p => {
    const partes = [p.talla, p.talla ? matLabel(p.mat) : null, p.marco ? `Marco ${p.marco}` : null].filter(Boolean).join(' · ');
    return `• ${p.obra_nombre}${partes ? ' | ' + partes : ''} | $${Number(p.monto || 0).toLocaleString('es-CL')}${p.notas ? '\n  ' + p.notas.replace(/\n/g, '\n  ') : ''}`;
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
  form.append('detalle_pedido', detalleTexto);
  form.append('total', `$${payment.amount?.toLocaleString('es-CL')} CLP`);
  form.append('orden_flow', String(payment.flowOrder));

  await fetch('https://api.web3forms.com/submit', { method: 'POST', body: form });
}

async function confirmarInscripcionRetiro(db, payment) {
  const { rows } = await db.execute({
    sql: `SELECT * FROM inscripciones WHERE flow_order = ?`,
    args: [payment.commerceOrder],
  });
  const inscripcion = rows[0];
  if (!inscripcion) return;

  await db.execute({
    sql: `UPDATE inscripciones SET estado = 'pagado', paid_at = COALESCE(paid_at, CURRENT_TIMESTAMP) WHERE id = ?`,
    args: [inscripcion.id],
  });

  // Flow puede llamar a esta URL más de una vez: la bienvenida se envía una sola vez.
  if (Number(inscripcion.bienvenida_enviada)) return;
  const enviada = await enviarBienvenidaRetiro(inscripcion);
  await avisarInscripcionRetiro(inscripcion, payment);
  if (enviada) {
    await db.execute({ sql: `UPDATE inscripciones SET bienvenida_enviada = 1 WHERE id = ?`, args: [inscripcion.id] });
  }
}

export async function POST({ request }) {
  const formData = await request.formData();
  const token = formData.get('token');

  const payment = await estadoPagoFlow(token);

  if (payment.status === 2) {
    const db = await initDb();
    if (String(payment.commerceOrder).startsWith(RETIRO_MUJERES.prefijoOrden)) {
      await confirmarInscripcionRetiro(db, payment);
    } else {
      await confirmarPedidoTienda(db, payment);
    }
  }

  return new Response('OK', { status: 200 });
}
