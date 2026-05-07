import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('database');

const MIGRATIONS: string[] = [
  // Migration 1: Initial schema
  `
  CREATE TABLE IF NOT EXISTS contacts (
    contact_id TEXT PRIMARY KEY,
    display_name TEXT,
    first_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_message_at TEXT,
    message_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    emotion TEXT,
    emotion_confidence REAL,
    token_count INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contact_id) REFERENCES contacts(contact_id)
  );

  CREATE INDEX IF NOT EXISTS idx_messages_contact_created
    ON messages(contact_id, created_at DESC);

  CREATE INDEX IF NOT EXISTS idx_messages_contact_role
    ON messages(contact_id, role);
  `,
];

let db: Database.Database | null = null;

export function initDatabase(dbPath: string): Database.Database {
  mkdirSync(dirname(dbPath), { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);
  logger.info('Database initialized', { path: dbPath });
  return db;
}

function runMigrations(db: Database.Database): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number;

  if (currentVersion >= MIGRATIONS.length) {
    logger.debug('Database schema is up to date', { version: currentVersion });
    return;
  }

  const migrate = db.transaction(() => {
    for (let i = currentVersion; i < MIGRATIONS.length; i++) {
      logger.info(`Running migration ${i + 1}/${MIGRATIONS.length}`);
      db.exec(MIGRATIONS[i]);
    }
    db.pragma(`user_version = ${MIGRATIONS.length}`);
  });

  migrate();
  logger.info('Migrations complete', { version: MIGRATIONS.length });
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    logger.info('Database closed');
  }
}
