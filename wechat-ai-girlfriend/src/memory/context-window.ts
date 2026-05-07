import { getRecentMessages } from './conversation-store.js';
import type { ChatMessage } from '../types/index.js';

export function buildContextWindow(
  contactId: string,
  windowSize: number,
): ChatMessage[] {
  const messages = getRecentMessages(contactId, windowSize);

  return messages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));
}
