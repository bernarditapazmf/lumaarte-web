import { createClient } from '@libsql/client';

export function getDb() {
  return createClient({
    url: import.meta.env.TURSO_URL,
    authToken: import.meta.env.TURSO_TOKEN,
  });
}

export async function initDb() {
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS obras (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre      TEXT    NOT NULL,
      serie       TEXT,
      tecnica     TEXT,
      dimensiones TEXT,
      precio      INTEGER DEFAULT 0,
      disponible  INTEGER DEFAULT 1,
      imagen      TEXT,
      notas       TEXT,
      orden       INTEGER DEFAULT 0,
      created_at  TEXT    DEFAULT CURRENT_TIMESTAMP
    )
  `);
  return db;
}
