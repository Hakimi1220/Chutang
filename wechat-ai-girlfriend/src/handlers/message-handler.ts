import type { Message } from 'wechaty';
import { types } from 'wechaty-puppet';
import { analyzeEmotion } from '../ai/emotion-analyzer.js';
import { chat } from '../ai/client.js';
import { buildSystemPrompt } from '../ai/prompt-builder.js';
import { saveMessage } from '../memory/conversation-store.js';
import { buildContextWindow } from '../memory/context-window.js';
import { createLogger } from '../utils/logger.js';
import type { AppConfig } from '../types/index.js';

const logger = createLogger('message-handler');

const FALLBACK_MESSAGES = [
  '我刚走神了，再说一次好不好？',
  '抱歉呀，刚才没听清，你说什么来着？',
  '哎呀，我刚刚在想别的事情，你再说一遍嘛~',
];

const contactLocks = new Map<string, Promise<void>>();

function getFallbackMessage(): string {
  return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
}

async function processMessage(message: Message, config: AppConfig): Promise<void> {
  const contact = message.talker();
  const contactId = contact.id;
  const contactName = contact.name();
  const text = message.text().trim();

  if (!text) return;

  logger.info('Processing message', { contactId, contactName, textLength: text.length });

  try {
    // 1. Emotion analysis
    const emotionResult = await analyzeEmotion(text);
    logger.debug('Emotion result', emotionResult);

    // 2. Save user message
    saveMessage(
      contactId,
      'user',
      text,
      emotionResult.emotion,
      emotionResult.confidence,
    );

    // 3. Build context window
    const contextMessages = buildContextWindow(contactId, config.contextWindowSize);

    // 4. Build system prompt
    const systemPrompt = buildSystemPrompt(config.persona, emotionResult);

    // 5. Call AI
    const response = await chat(systemPrompt, contextMessages);

    // 6. Save AI response
    saveMessage(contactId, 'assistant', response);

    // 7. Reply
    await message.say(response);
    logger.info('Reply sent', { contactId, responseLength: response.length });
  } catch (error) {
    logger.error('Failed to process message', { contactId, error: String(error) });
    const fallback = getFallbackMessage();
    try {
      await message.say(fallback);
    } catch (sendError) {
      logger.error('Failed to send fallback message', { error: String(sendError) });
    }
  }
}

export function createMessageHandler(config: AppConfig) {
  return async (message: Message): Promise<void> => {
    // Filter: ignore self messages
    if (message.self()) return;

    // Filter: ignore group messages
    const room = message.room();
    if (room) return;

    // Filter: only handle text messages
    const msgType = message.type();
    if (msgType !== types.Message.Text) return;

    const contactId = message.talker().id;

    // Per-contact concurrency lock
    const previousLock = contactLocks.get(contactId) ?? Promise.resolve();
    const currentLock = previousLock.then(() => processMessage(message, config));
    contactLocks.set(contactId, currentLock.catch(() => {}));

    await currentLock;
  };
}
