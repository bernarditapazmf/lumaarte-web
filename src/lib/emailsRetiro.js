import { RETIRO_MUJERES as R, clp } from './experiencias.js';

const FROM = 'Luma Arte <contacto@lumaarte.com>';
const PDF_TERMINOS = 'https://www.lumaarte.com/docs/terminos-retiro-de-mujeres-2027.pdf';

function escapar(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

async function enviarResend(payload, etiqueta) {
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(`RESEND_API_KEY no configurada (${etiqueta})`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`Resend error (${etiqueta}):`, res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error(`Resend fetch failed (${etiqueta}):`, e);
    return false;
  }
}

export function bienvenidaHtml(insc) {
  const nombre = escapar(String(insc.nombre || '').split(' ')[0] || '');
  const yaComenzaron = new Date() >= new Date(`${R.practicasDesdeISO}T00:00:00-03:00`);
  const preparacion = yaComenzaron
    ? `Como te inscribiste cerca de la fecha, en los próximos días comenzarás a recibir las meditaciones y prácticas corporales de preparación.`
    : `Desde el <strong>${R.practicasDesdeTexto}</strong> comenzaremos con los preparativos: te iremos enviando meditaciones y prácticas corporales que te ayudarán a llegar presente y a profundizar el día de la experiencia.`;
  const regalo = Number(insc.es_regalo) && insc.comprador_nombre
    ? `<p style="font-size:16px;line-height:1.75;color:rgba(33,31,24,.8);margin:0 0 16px">Este cupo es un regalo de <strong>${escapar(insc.comprador_nombre)}</strong>. Alguien pensó en ti para este día. 🌿</p>`
    : '';

  return `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#211f18;padding:40px 24px;background:#fdfcf8">
    <p style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#54582f;margin:0 0 24px">Luma Arte · Experiencias</p>
    <h1 style="font-size:28px;font-weight:400;line-height:1.25;margin:0 0 24px">Bienvenida al <em>${R.nombre}</em>${nombre ? `, ${nombre}` : ''}.</h1>
    <p style="font-size:16px;line-height:1.75;color:rgba(33,31,24,.8);margin:0 0 16px">
      Qué alegría que seas parte de este encuentro. Tu cupo está confirmado y ya estamos preparando con cariño cada detalle para recibirte.
    </p>
    ${regalo}
    <div style="border-top:1px solid rgba(33,31,24,.15);border-bottom:1px solid rgba(33,31,24,.15);padding:20px 0;margin:28px 0">
      <p style="margin:0 0 8px;font-size:15px"><strong>Cuándo:</strong> ${R.fechaTexto}, desde las ${R.horaInicio} hrs.</p>
      <p style="margin:0 0 8px;font-size:15px"><strong>Dónde:</strong> ${R.lugar}, ${R.region}. Te enviaremos la ubicación exacta y cómo llegar antes del retiro.</p>
      <p style="margin:0;font-size:15px"><strong>Tu inscripción:</strong> ${clp(insc.precio)} (${escapar(insc.tramo)}).</p>
    </div>
    <h2 style="font-size:20px;font-weight:400;margin:0 0 12px">Antes del retiro</h2>
    <p style="font-size:16px;line-height:1.75;color:rgba(33,31,24,.8);margin:0 0 28px">${preparacion}</p>
    <h2 style="font-size:20px;font-weight:400;margin:0 0 12px">Qué llevar ese día</h2>
    <p style="font-size:16px;line-height:1.75;color:rgba(33,31,24,.8);margin:0 0 28px">Ropa cómoda, traje de baño, sandalias, toalla y agua.</p>
    <p style="font-size:14px;line-height:1.7;color:rgba(33,31,24,.65);margin:0 0 28px">
      Adjuntamos los <strong>términos y condiciones</strong> del retiro, con la política de cancelación. También puedes leerlos en
      <a href="https://www.lumaarte.com${R.url}/terminos" style="color:#54582f">lumaarte.com</a>.
      Si tienes cualquier duda, responde este correo.
    </p>
    <p style="font-size:16px;line-height:1.75;margin:0">Con cariño,<br><em>Andrea Ortúzar y Bernardita Mir</em></p>
  </div>`;
}

export async function enviarBienvenidaRetiro(insc) {
  const cc = Number(insc.es_regalo) && insc.comprador_email && insc.comprador_email !== insc.email ? [insc.comprador_email] : undefined;
  return enviarResend({
    from: FROM,
    to: [insc.email],
    ...(cc ? { cc } : {}),
    reply_to: 'contacto@lumaarte.com',
    subject: `Bienvenida al ${R.nombre} 🌿 · ${R.fechaTexto} — términos y condiciones`,
    html: bienvenidaHtml(insc),
    attachments: [{ filename: 'Terminos-y-condiciones-Retiro-de-mujeres-2027.pdf', path: PDF_TERMINOS }],
  }, 'bienvenida retiro');
}

export async function avisarInscripcionRetiro(insc, payment) {
  const fila = (k, v) => `<tr><td style="padding:6px 0;color:#666;width:180px">${k}</td><td style="padding:6px 0">${escapar(v) || '—'}</td></tr>`;
  const html = `<div style="font-family:sans-serif;max-width:600px;color:#211f18">
    <h2 style="font-size:20px;margin:0 0 16px">🌿 Nueva inscripción — ${R.nombre}</h2>
    <table style="width:100%;border-collapse:collapse">
      ${fila('Participante', insc.nombre)}
      ${fila('Email', insc.email)}
      ${fila('Teléfono', insc.telefono)}
      ${fila('Viene desde', insc.ciudad_origen)}
      ${fila('Restricciones alimentarias', insc.restricciones_alimentarias)}
      ${fila('Salud', insc.salud)}
      ${fila('Cómo se enteró', insc.como_se_entero)}
      ${Number(insc.es_regalo) ? fila('Regalo de', `${insc.comprador_nombre || ''} (${insc.comprador_email || ''})`) : ''}
      ${fila('Monto', `${clp(insc.precio)} — ${insc.tramo}`)}
      ${fila('Orden Flow', String(payment?.flowOrder ?? ''))}
    </table>
    <p style="font-size:12px;color:#999;margin-top:20px">Ver todas en lumaarte.com/admin/inscripciones</p>
  </div>`;
  return enviarResend({
    from: FROM,
    to: ['contacto@lumaarte.com'],
    reply_to: insc.email,
    subject: `🌿 Inscripción ${R.nombre}: ${insc.nombre} (${clp(insc.precio)})`,
    html,
  }, 'aviso inscripción retiro');
}
