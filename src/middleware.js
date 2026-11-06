import { revisarTandas } from './lib/newsletter.js';
import { reintentarBienvenidasRetiro } from './lib/emailsRetiro.js';

// Cada 5 minutos: tandas diarias de newsletter y bienvenidas del retiro que quedaron sin enviar.
// Arranca con la primera visita real al servidor (no durante el build) y queda corriendo mientras viva.
function iniciarTandas() {
  if (globalThis.__tandasNewsletter) return;
  const revisar = async () => {
    await reintentarBienvenidasRetiro().catch(e => console.error('Reintento bienvenidas:', e));
    await revisarTandas().catch(e => console.error('Tandas newsletter:', e));
  };
  globalThis.__tandasNewsletter = setInterval(revisar, 5 * 60 * 1000);
  globalThis.__tandasNewsletter.unref?.();
  setTimeout(revisar, 60 * 1000).unref?.();
}

export const onRequest = (context, next) => {
  if (!context.isPrerendered && !import.meta.env.DEV) iniciarTandas();
  return next();
};
