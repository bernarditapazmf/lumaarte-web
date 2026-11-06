import { revisarTandas } from './lib/newsletter.js';

// Newsletters por tandas: cada 5 minutos se revisa si a alguna campaña le toca su envío diario.
// Arranca con la primera visita real al servidor (no durante el build) y queda corriendo mientras viva.
function iniciarTandas() {
  if (globalThis.__tandasNewsletter) return;
  const revisar = () => revisarTandas().catch(e => console.error('Tandas newsletter:', e));
  globalThis.__tandasNewsletter = setInterval(revisar, 5 * 60 * 1000);
  globalThis.__tandasNewsletter.unref?.();
  setTimeout(revisar, 60 * 1000).unref?.();
}

export const onRequest = (context, next) => {
  if (!context.isPrerendered && !import.meta.env.DEV) iniciarTandas();
  return next();
};
