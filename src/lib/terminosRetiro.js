// Términos y condiciones del Retiro de mujeres 2027.
// Fuente única: la usa la página /experiencias/retiro-de-mujeres-frutillar-2027/terminos
// y el script que genera el PDF adjunto al correo de bienvenida (scripts/generar-pdf-terminos.mjs).
// Si cambias algo aquí, vuelve a generar el PDF.

export const TERMINOS_TITULO = 'Términos y condiciones — Retiro de mujeres';
export const TERMINOS_SUBTITULO = 'Frutillar · Sábado 23 de enero de 2027 · Organiza Luma Arte';
export const TERMINOS_VERSION = 'Versión del 8 de octubre de 2026';

export const TABLA_CANCELACION = [
  { plazo: 'Hasta el 24 de diciembre de 2026 (30 días o más antes)', devolucion: '100% de lo pagado, descontando la comisión de la pasarela de pago (Flow)' },
  { plazo: 'Entre el 25 de diciembre de 2026 y el 2 de enero de 2027 (hasta 3 semanas antes)', devolucion: '60% del monto pagado' },
  { plazo: 'Entre el 3 y el 9 de enero de 2027 (hasta 2 semanas antes)', devolucion: '40% del monto pagado' },
  { plazo: 'Entre el 10 y el 15 de enero de 2027 (hasta 1 semana antes)', devolucion: '20% del monto pagado' },
  { plazo: 'Desde el 16 de enero de 2027 (7 días o menos antes)', devolucion: 'Sin devolución' },
];

export const SECCIONES_TERMINOS = [
  {
    titulo: '1. La experiencia',
    parrafos: [
      'El Retiro de mujeres se realiza el sábado 23 de enero de 2027, desde las 10:00 hrs, en Frutillar, Región de Los Lagos. La ubicación exacta y las indicaciones de llegada se envían por correo a cada participante antes del retiro. Es guiado por Andrea Ortúzar y Bernardita Mir.',
      'Incluye: círculo de mujeres de apertura; prácticas de movimiento somático y Alba Emoting; espacio de conversación y reflexión; almuerzo (plato de fondo y bebestible); taller de arte terapia con todos los materiales y el "tesoro" o vision board que cada participante se lleva; cierre en biopiscinas de agua caliente (36 a 40 °C); y meditaciones y prácticas de preparación enviadas por correo desde el 26 de diciembre de 2026, o desde la inscripción si esta ocurre después de esa fecha.',
      'No incluye: traslados, alojamiento ni consumos adicionales a los señalados.',
    ],
  },
  {
    titulo: '2. Inscripción, precio y pago',
    parrafos: [
      'El cupo queda confirmado una vez recibido el pago completo a través de Flow. Al confirmarse, la participante recibe un correo de bienvenida con estos términos adjuntos.',
      'El precio depende del tramo vigente al momento de pagar: los cupos se venden en tramos y el valor sube a medida que se completan, partiendo en $98.000 (early bird) hasta un valor final de $150.000. El precio pagado no cambia aunque luego se abran tramos de mayor valor. Los cupos son limitados.',
      'Al iniciar el pago, el cupo queda reservado por 30 minutos. Si el pago no se completa en ese plazo, el cupo se libera.',
    ],
  },
  {
    titulo: '3. Política de cancelación y devoluciones',
    parrafos: [
      'Si no puedes asistir, escríbenos a contacto@lumaarte.com. El plazo se cuenta según la fecha en que recibimos tu solicitud por escrito:',
    ],
    tabla: true,
    parrafosDespues: [
      'Los porcentajes decrecientes responden a que, a medida que se acerca la fecha, ya se han reservado y/o comprado alimentos, materiales e insumos para cada participante.',
      'Las devoluciones se realizan al mismo medio de pago o por transferencia bancaria.',
    ],
  },
  {
    titulo: '4. Cancelación o cambios por parte de la organización',
    parrafos: [
      'Si por cualquier motivo la organización debe cancelar el retiro, se devuelve el 100% de lo pagado. Si fuera necesario cambiar la fecha, cada participante podrá elegir entre mantener su cupo en la nueva fecha o recibir la devolución total.',
    ],
  },
  {
    titulo: '5. Salud y bienestar',
    parrafos: [
      'Las biopiscinas tienen agua caliente entre 36 y 40 °C. No se recomiendan durante el embarazo ni para personas con presión arterial alta o baja u otras condiciones de salud que puedan verse afectadas por el calor; ante cualquier duda, consulta a tu médico antes de inscribirte. Participar en las biopiscinas es opcional.',
      'Las prácticas de movimiento se adaptan a cada cuerpo. Te pedimos informarnos en el formulario de inscripción cualquier condición de salud que debamos considerar.',
      'Las actividades del retiro son espacios de bienestar y autoconocimiento; no reemplazan tratamientos médicos ni psicológicos.',
    ],
  },
  {
    titulo: '6. Regalos',
    parrafos: [
      'El retiro se puede regalar. Al inscribir, se registran los datos de la persona que asistirá, quien recibe el correo de bienvenida y las prácticas de preparación. La política de cancelación aplica igual.',
    ],
  },
  {
    titulo: '7. Datos personales',
    parrafos: [
      'Los datos entregados en la inscripción se usan solo para organizar el retiro, contactarte y enviarte las prácticas de preparación. No se comparten con terceros.',
    ],
  },
  {
    titulo: '8. Contacto',
    parrafos: [
      'Luma Arte · contacto@lumaarte.com · www.lumaarte.com',
    ],
  },
];
