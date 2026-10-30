const Database = require('better-sqlite3');
const path = require('node:path');

function abrirDb(ruta = path.join(__dirname, '..', 'data.db')) {
  const db = new Database(ruta);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      hash TEXT NOT NULL,
      sal TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tareas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descripcion TEXT NOT NULL DEFAULT '',
      estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente','en_progreso','completada')),
      version INTEGER NOT NULL DEFAULT 1,
      archivo TEXT,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
      creada_en TEXT NOT NULL DEFAULT (datetime('now')),
      actualizada_en TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

module.exports = { abrirDb };