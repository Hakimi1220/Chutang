import { chat } from '../../ai/client.js';
import { buildProactivePrompt } from '../../ai/prompt-builder.js';
import { sendMessageToContact } from '../../bot.js';
import { saveMessage } from '../../memory/conversation-store.js';
import { createLogger } from '../../utils/logger.js';
import type { AppConfig, ScheduledTask } from '../../types/index.js';

const logger = createLogger('good-night');

export function createGoodNightTask(config: AppConfig): ScheduledTask | null {
  const nightConfig = config.persona.scheduled_messages?.good_night;
  if (!nightConfig?.enabled || !config.proactiveContactId) return null;

  return {
    name: 'good-night',
    cron: nightConfig.cron,
    task: async () => {
      const style = nightConfig.style ?? '温馨的晚安问候，提醒早点休息';
      const prompt = buildProactivePrompt(config.persona, style);

      const response = await chat(prompt, []);
      const sent = await sendMessageToContact(config.proactiveContactId, response);

      if (sent) {
        saveMessage(config.proactiveContactId, 'assistant', response);
        logger.info('Good night message sent', { response });
      }
    },
  };
}
