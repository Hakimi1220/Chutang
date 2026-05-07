import { getDatabase } from './database.js';
import { createLogger } from '../utils/logger.js';
import type { StoredMessage, EmotionCategory } from '../types/index.js';

const logger = createLogger('conversation-store');

export function ensureContact(contactId: string, displayName?: string): void {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO contacts (contact_id, display_name, first_seen_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(contact_id) DO UPDATE SET
      display_name = COALESCE(?, contacts.display_name)
  `).run(contactId, displayName ?? null, displayName ?? null);
}

export function saveMessage(
  contactId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  emotion?: EmotionCategory | null,
  emotionConfidence?: number | null,
  tokenCount?: number | null,
): void {
  const db = getDatabase();

  ensureContact(contactId);

  db.prepare(`
    INSERT INTO messages (contact_id, role, content, emotion, emotion_confidence, token_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(contactId, role, content, emotion ?? null, emotionConfidence ?? null, tokenCount ?? null);

  db.prepare(`
    UPDATE contacts SET
      last_message_at = datetime('now'),
      message_count = message_count + 1
    WHERE contact_id = ?
  `).run(contactId);

  logger.debug('Message saved', { contactId, role, contentLength: content.length });
}

export function getRecentMessages(contactId: string, limit: number): StoredMessage[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT * FROM messages
    WHERE contact_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(contactId, limit) as StoredMessage[];

  return rows.reverse();
}

export function getLastUserMessageTime(contactId: string): string | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT created_at FROM messages
    WHERE contact_id = ? AND role = 'user'
    ORDER BY created_at DESC
    LIMIT 1
  `).get(contactId) as { created_at: string } | undefined;

  return row?.created_at ?? null;
}

export function getLastMessageTime(contactId: string): string | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT last_message_at FROM contacts WHERE contact_id = ?
  `).get(contactId) as { last_message_at: string | null } | undefined;

  return row?.last_message_at ?? null;
}

export function getMessageCount(contactId: string): number {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT message_count FROM contacts WHERE contact_id = ?
  `).get(contactId) as { message_count: number } | undefined;

  return row?.message_count ?? 0;
}

export function pruneOldMessages(contactId: string, keepLast: number): number {
  const db = getDatabase();
  const result = db.prepare(`
    DELETE FROM messages
    WHERE contact_id = ? AND id NOT IN (
      SELECT id FROM messages
      WHERE contact_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    )
  `).run(contactId, contactId, keepLast);

  if (result.changes > 0) {
    logger.info('Pruned old messages', { contactId, deleted: result.changes });
  }
  return result.changes;
}
