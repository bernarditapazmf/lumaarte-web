import { initDb } from '../../../lib/db.js';
import { isAuthenticated } from '../../../lib/auth.js';
import { AUDIENCIAS, armarCorreo, enviarUno, enviarTanda } from '../../../lib/newsletter.js';
export const prerender = false;

const TEST_EMAIL = 'bernimirf@gmail.com';
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

export async function POST({ request }) {
  if (!isAuthenticated(request)) return json({ ok: false, error: 'unauthorized' }, 401);

  const { test, asunto, html, campanaId, audiencia = 'suscriptores', porDia = 0 } = await request.json();
  if (!import.meta.env.RESEND_API_KEY) return json({ ok: false, error: 'RESEND_API_KEY no configurado' }, 500);

  const db = await initDb();

  if (test) {
    // Enviar solo a bernimirf@gmail.com, personalizado con su nombre en la base
    const { rows } = await db.execute({ sql: 'SELECT nombre FROM contactos WHERE lower(email)=? LIMIT 1', args: [TEST_EMAIL] });
    const err = await enviarUno(armarCorreo({ email: TEST_EMAIL, nombre: rows[0]?.nombre ?? 'Berni' }, asunto, html, '[PRUEBA] '));
    return json({ ok: !err, error: err?.message });
  }

  if (!AUDIENCIAS[audiencia]) return json({ ok: false, error: 'audiencia inválida' }, 422);
  if (!campanaId) return json({ ok: false, error: 'guarda la campaña antes de enviarla' }, 422);

  // Reservar la campaña: solo se puede lanzar una vez (las tandas siguientes las envía el servidor cada 24 h)
  const por_dia = Math.max(0, Math.floor(Number(porDia) || 0));
  const claim = await db.execute({
    sql: "UPDATE campanas SET asunto=?, html=?, audiencia=?, por_dia=?, estado='enviando', ultima_tanda=datetime('now') WHERE id=? AND estado NOT IN ('enviando','enviado')",
    args: [asunto, html, audiencia, por_dia, campanaId],
  });
  if (claim.rowsAffected !== 1) return json({ ok: false, error: 'Esta campaña ya fue enviada o está en envío diario.' }, 409);

  const { rows: [campana] } = await db.execute({ sql: 'SELECT * FROM campanas WHERE id=?', args: [campanaId] });
  const r = await enviarTanda(db, campana);
  return json({ ok: true, ...r });
}
