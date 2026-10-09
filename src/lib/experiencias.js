// Configuración de las experiencias que se venden en /experiencias.
// Los precios suben por tramos a medida que se ocupan los cupos.

export const RETIRO_MUJERES = {
  codigo: 'retiro-mujeres-2027',
  prefijoOrden: 'RETIRO-',
  slug: 'retiro-de-mujeres-frutillar-2027',
  url: '/experiencias/retiro-de-mujeres-frutillar-2027',
  nombre: 'Retiro de mujeres',
  lugar: 'Frutillar',
  region: 'Región de Los Lagos',
  fechaInicioISO: '2027-01-23T10:00:00-03:00',
  fechaTexto: 'sábado 23 de enero de 2027',
  horaInicio: '10:00',
  practicasDesdeISO: '2026-12-26',
  practicasDesdeTexto: '26 de diciembre',
  cuposTotales: 20,
  tramos: [
    { nombre: 'Early bird', precio: 98000,  cupos: 2 },
    { nombre: 'Tramo 2',    precio: 105000, cupos: 3 },
    { nombre: 'Tramo 3',    precio: 115000, cupos: 3 },
    { nombre: 'Tramo 4',    precio: 125000, cupos: 3 },
    { nombre: 'Tramo 5',    precio: 135000, cupos: 3 },
    { nombre: 'Valor final', precio: 150000, cupos: null }, // null = los cupos que queden
  ],
  minutosReserva: 30,
};

// Tramos con su capacidad concreta y si ya están agotados, según cupos ocupados.
export function tramosConEstado(exp, ocupados) {
  let acumulado = 0;
  return exp.tramos.map((t, indice) => {
    const capacidad = t.cupos ?? Math.max(exp.cuposTotales - acumulado, 0);
    const desde = acumulado;
    acumulado += capacidad;
    const quedan = Math.max(Math.min(acumulado, exp.cuposTotales) - Math.max(ocupados, desde), 0);
    return { ...t, indice, capacidad, quedan, agotado: ocupados >= acumulado, vigente: ocupados >= desde && ocupados < acumulado };
  });
}

export function tramoVigente(exp, ocupados) {
  if (ocupados >= exp.cuposTotales) return null;
  return tramosConEstado(exp, ocupados).find(t => t.vigente) ?? null;
}

// Cupos ocupados = pagados + reservas en curso (pago iniciado hace menos de N minutos).
export async function contarOcupados(db, exp) {
  const { rows } = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM inscripciones
          WHERE experiencia = ? AND tramo != 'prueba'
            AND (estado = 'pagado'
                 OR (estado = 'pendiente_pago' AND created_at > datetime('now', ?)))`,
    args: [exp.codigo, `-${exp.minutosReserva} minutes`],
  });
  return Number(rows[0]?.n) || 0;
}

export function clp(n) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}
