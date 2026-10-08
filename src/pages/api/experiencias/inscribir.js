import { initDb } from '../../../lib/db.js';
import { crearPagoFlow } from '../../../lib/flow.js';
import { isAuthenticated } from '../../../lib/auth.js';
import { RETIRO_MUJERES as R, contarOcupados, tramoVigente } from '../../../lib/experiencias.js';
export const prerender = false;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const emailValido = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const txt = (v, max = 500) => String(v ?? '').trim().slice(0, max);

export async function POST({ request }) {
  let d;
  try { d = await request.json(); } catch { return json({ error: 'Solicitud inválida' }, 400); }

  const nombre   = txt(d.nombre, 120);
  const email    = txt(d.email, 160).toLowerCase();
  const telefono = txt(d.telefono, 40);
  const esRegalo = !!d.esRegalo;
  const compradorNombre = esRegalo ? txt(d.compradorNombre, 120) : '';
  const compradorEmail  = esRegalo ? txt(d.compradorEmail, 160).toLowerCase() : '';

  if (!nombre || !emailValido(email) || !telefono) return json({ error: 'Completa nombre, correo y teléfono de quien asistirá.' }, 422);
  if (esRegalo && (!compradorNombre || !emailValido(compradorEmail))) return json({ error: 'Completa tu nombre y correo (quien regala).' }, 422);
  if (!d.aceptaTerminos) return json({ error: 'Debes aceptar los términos y la política de cancelación.' }, 422);

  // Inscripción de prueba: solo con sesión de administración. Cobra el mínimo de Flow y no ocupa cupo.
  const esPrueba = !!d.prueba && isAuthenticated(request);

  let db;
  try { db = await initDb(); } catch (e) {
    console.error('DB no disponible:', e);
    return json({ error: 'No pudimos procesar tu inscripción. Intenta en unos minutos.' }, 500);
  }

  let precio, tramo;
  if (esPrueba) {
    precio = 350; tramo = 'prueba';
  } else {
    const ocupados = await contarOcupados(db, R);
    const vigente = tramoVigente(R, ocupados);
    if (!vigente) return json({ error: 'Los cupos de este retiro están agotados. Escríbenos a contacto@lumaarte.com para quedar en lista de espera.' }, 409);
    precio = vigente.precio; tramo = vigente.nombre;
  }

  const commerceOrder = R.prefijoOrden + Date.now();

  await db.execute({
    sql: `INSERT INTO inscripciones
          (experiencia, nombre, email, telefono, ciudad_origen, restricciones_alimentarias, salud, como_se_entero,
           es_regalo, comprador_nombre, comprador_email, precio, tramo, estado, flow_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente_pago', ?)`,
    args: [R.codigo, nombre, email, telefono, txt(d.ciudadOrigen, 120) || null, txt(d.restricciones) || null,
           txt(d.salud) || null, txt(d.comoSeEntero, 120) || null, esRegalo ? 1 : 0,
           compradorNombre || null, compradorEmail || null, precio, tramo, commerceOrder],
  });

  try {
    const { redirectUrl } = await crearPagoFlow({
      commerceOrder,
      subject: `${R.nombre} — ${R.lugar}, 23 ene 2027`,
      amount: precio,
      email: esRegalo ? compradorEmail : email,
    });
    return json({ redirectUrl, precio, tramo });
  } catch (e) {
    console.error('Flow error inscripción:', e);
    await db.execute({ sql: `UPDATE inscripciones SET estado = 'error_pago' WHERE flow_order = ?`, args: [commerceOrder] });
    return json({ error: 'No pudimos iniciar el pago. Intenta nuevamente.' }, 502);
  }
}
