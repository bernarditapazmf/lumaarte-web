import { initDb } from '../../../lib/db.js';
import { isAuthenticated } from '../../../lib/auth.js';
export const prerender = false;

export async function POST({ request }) {
  if (!isAuthenticated(request)) return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), { status: 401 });

  const { test, asunto, html, campanaId } = await request.json();
  const apiKey = import.meta.env.RESEND_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ ok: false, error: 'RESEND_API_KEY no configurado' }), { status: 500 });

  if (test) {
    // Enviar solo a bernimirf@gmail.com
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Luma Arte <contacto@lumaproducciones.cl>',
        to: ['bernimirf@gmail.com'],
        subject: `[PRUEBA] ${asunto}`,
        html,
      }),
    });
    const data = await res.json();
    return new Response(JSON.stringify({ ok: res.ok, error: data.message }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Envío masivo — obtener todos los suscriptores
  const db = await initDb();
  const { rows: subs } = await db.execute(
    "SELECT email FROM contactos WHERE (origen='newsletter' OR tags LIKE '%suscriptor%') AND email IS NOT NULL"
  );

  let enviados = 0;
  const errors = [];

  for (const sub of subs) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Luma Arte <contacto@lumaproducciones.cl>',
          to: [sub.email],
          subject: asunto,
          html,
        }),
      });
      if (res.ok) enviados++;
      else {
        const d = await res.json();
        errors.push({ email: sub.email, error: d.message });
      }
    } catch (e) {
      errors.push({ email: sub.email, error: String(e) });
    }
  }

  // Actualizar campaña como enviada
  if (campanaId) {
    await db.execute({
      sql: "UPDATE campanas SET estado='enviado', enviados=? WHERE id=?",
      args: [enviados, campanaId],
    });
  }

  return new Response(JSON.stringify({ ok: true, enviados, errors }), { headers: { 'Content-Type': 'application/json' } });
}
