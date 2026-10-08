// Lista de precios oficial. El servidor SIEMPRE recalcula el monto con esta tabla:
// nunca se cobra el precio que envía el navegador.

export const PRECIOS_OBRA = {
  '21 × 30 cm': 75000,
  '30 × 40 cm': 95000,
  '40 × 50 cm': 145000,
  '50 × 70 cm': 220000,
};

export const OBRAS_DISPONIBLES = [
  'Dúo Lilium y Volcanes I',
  'Dúo Lilium y Volcanes II',
  'Rostro de Chilcos',
  'Mujer Hortensia',
  'Bosque de Arrayanes',
];

export const MARCOS = ['Mañío', 'Laurel', 'Coihue', 'Roble'];

export const GIFTCARD_MINIMO = 1000;

// Devuelve el precio que corresponde a un ítem del carrito, o null si el ítem no es válido.
export function precioItem(item) {
  if (!item || typeof item.title !== 'string') return null;

  if (item.title.startsWith('Giftcard')) {
    const monto = Math.round(Number(item.monto ?? item.precio));
    return Number.isFinite(monto) && monto >= GIFTCARD_MINIMO ? monto : null;
  }

  if (!OBRAS_DISPONIBLES.includes(item.title)) return null;
  return PRECIOS_OBRA[item.size] ?? null;
}
