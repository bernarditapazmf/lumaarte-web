import { createClient } from '@libsql/client';

export function getDb() {
  return createClient({
    url: import.meta.env.TURSO_URL,
    authToken: import.meta.env.TURSO_TOKEN,
  });
}

async function migrate(db) {
  // Agrega columnas nuevas a obras si no existen
  const { rows: cols } = await db.execute('PRAGMA table_info(obras)');
  const existing = cols.map(r => r.name);

  const newCols = [
    ['precio_A4',                 'INTEGER DEFAULT 0'],
    ['precio_30x40',              'INTEGER DEFAULT 0'],    ['precio_40x50',              'INTEGER DEFAULT 0'],
    ['precio_50x70',              'INTEGER DEFAULT 0'],
    ['costo_produccion',          'INTEGER DEFAULT 0'],
    ['costo_enmarcado',           'INTEGER DEFAULT 0'],
    ['pago_enmarcador_pendiente', 'INTEGER DEFAULT 0'],
  ];

  for (const [col, def] of newCols) {
    if (!existing.includes(col)) {
      await db.execute(`ALTER TABLE obras ADD COLUMN ${col} ${def}`);
    }
  }
}

export async function initDb() {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS obras (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre                    TEXT    NOT NULL,
      serie                     TEXT,
      tecnica                   TEXT,
      dimensiones               TEXT,
      precio_A4                 INTEGER DEFAULT 0,
      precio_30x40              INTEGER DEFAULT 0,
      precio_40x50              INTEGER DEFAULT 0,
      precio_50x70              INTEGER DEFAULT 0,
      costo_produccion          INTEGER DEFAULT 0,
      costo_enmarcado           INTEGER DEFAULT 0,
      pago_enmarcador_pendiente INTEGER DEFAULT 0,
      disponible                INTEGER DEFAULT 1,
      imagen                    TEXT,
      notas                     TEXT,
      orden                     INTEGER DEFAULT 0,
      created_at                TEXT    DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await migrate(db);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS pedidos (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      obra_id                 INTEGER REFERENCES obras(id),
      obra_nombre             TEXT,
      talla                   TEXT,
      mat                     TEXT,
      cliente_nombre          TEXT,
      cliente_email           TEXT,
      cliente_telefono        TEXT,
      monto                   INTEGER DEFAULT 0,
      estado                  TEXT    DEFAULT 'pagado',
      fecha_pedido            TEXT,
      fecha_entrega_estimada  TEXT,
      fecha_entrega_real      TEXT,
      flow_order              TEXT,
      notas                   TEXT,
      created_at              TEXT    DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contactos (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre     TEXT,
      email      TEXT UNIQUE,
      telefono   TEXT,
      origen     TEXT DEFAULT 'manual',
      tags       TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS codigos_descuento (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo      TEXT UNIQUE NOT NULL,
      tipo        TEXT DEFAULT 'porcentaje',
      valor       INTEGER DEFAULT 0,
      usos_max    INTEGER DEFAULT 1,
      usos_actual INTEGER DEFAULT 0,
      activo      INTEGER DEFAULT 1,
      expira_en   TEXT,
      created_at  TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cotizaciones (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_nombre   TEXT,
      cliente_email    TEXT,
      cliente_empresa  TEXT,
      items            TEXT DEFAULT '[]',
      subtotal         INTEGER DEFAULT 0,
      descuento        INTEGER DEFAULT 0,
      total            INTEGER DEFAULT 0,
      estado           TEXT DEFAULT 'borrador',
      notas            TEXT,
      created_at       TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS campanas (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      asunto       TEXT NOT NULL,
      preheader    TEXT,
      cuerpo       TEXT,
      html         TEXT,
      header_img   TEXT,
      estado       TEXT DEFAULT 'borrador',
      enviados     INTEGER DEFAULT 0,
      created_at   TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migrar campanas si faltan columnas
  const { rows: campCols } = await db.execute('PRAGMA table_info(campanas)');
  const campExisting = campCols.map(r => r.name);
  for (const [col, def] of [['preheader','TEXT'],['html','TEXT'],['header_img','TEXT']]) {
    if (!campExisting.includes(col)) await db.execute(`ALTER TABLE campanas ADD COLUMN ${col} ${def}`);
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      slug        TEXT UNIQUE NOT NULL,
      titulo      TEXT NOT NULL,
      descripcion TEXT,
      contenido   TEXT,
      hero_image  TEXT,
      pub_date    TEXT DEFAULT CURRENT_TIMESTAMP,
      estado      TEXT DEFAULT 'borrador',
      created_at  TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS configuracion (
      clave       TEXT PRIMARY KEY,
      valor       TEXT,
      descripcion TEXT,
      updated_at  TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migración puntual: actualizar costo_enmarcado_A4 si aún está vacío
  await db.execute(`UPDATE configuracion SET valor='33900', descripcion='Enmarcado A4 con paspartú 3cm (Maderarte Frutillar)' WHERE clave='costo_enmarcado_A4' AND (valor IS NULL OR valor='')`);

  // Seed costos de enmarcado e impresión si no existen
  const costosSeed = [
    // Talla A4 (impresión 22×15 cm, marco A4 con paspartú 3cm)
    ['costo_impresion_A4',    '3117',  'Impresión obra 22×15 cm — talla A4 con paspartú 3cm'],
    ['costo_enmarcado_A4',    '33900', 'Enmarcado A4 con paspartú 3cm (Maderarte Frutillar)'],
    // Talla 30×40 (impresión 30×21 cm, marco 30×35 + paspartú 3cm Maderarte)
    ['costo_impresion_30x40', '7000',  'Impresión obra 30×21 cm — talla 30×40 con paspartú 3cm'],
    ['costo_enmarcado_30x40', '39900', 'Enmarcado 30×35 con paspartú 3cm — talla 30×40 (Maderarte Frutillar)'],
    // Talla 40×50
    ['costo_impresion_40x50', '',      'Impresión obra para talla 40×50 cm (pendiente)'],
    ['costo_enmarcado_40x50', '54900', 'Enmarcado 40×50 con paspartú 3cm — talla 40×50 (Maderarte Frutillar)'],
    // Talla 50×70
    ['costo_impresion_50x70', '',      'Impresión obra para talla 50×70 cm (pendiente)'],
    ['costo_enmarcado_50x70', '',      'Enmarcado 50×70 con paspartú 3cm (pendiente de proveedor)'],
  ];
  for (const [clave, valor, descripcion] of costosSeed) {
    await db.execute({
      sql: 'INSERT OR IGNORE INTO configuracion (clave, valor, descripcion) VALUES (?,?,?)',
      args: [clave, valor, descripcion],
    });
  }

  return db;
}
