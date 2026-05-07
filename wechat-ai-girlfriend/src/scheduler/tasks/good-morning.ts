import { chat } from '../../ai/client.js';
import { buildProactivePrompt } from '../../ai/prompt-builder.js';
import { sendMessageToContact } from '../../bot.js';
import { saveMessage } from '../../memory/conversation-store.js';
import { createLogger } from '../../utils/logger.js';
import type { AppConfig, ScheduledTask } from '../../types/index.js';

const logger = createLogger('good-morning');

export function createGoodMorningTask(config: AppConfig): ScheduledTask | null {
  const morningConfig = config.persona.scheduled_messages?.good_morning;
  if (!morningConfig?.enabled || !config.proactiveContactId) return null;

  return {
    name: 'good-morning',
    cron: morningConfig.cron,
    task: async () => {
      const style = morningConfig.style ?? '温柔的早安问候';
      const prompt = buildProactivePrompt(config.persona, style);

      const response = await chat(prompt, []);
      const sent = await sendMessageToContact(config.proactiveContactId, response);

      if (sent) {
        saveMessage(config.proactiveContactId, 'assistant', response);
        logger.info('Good morning message sent', { response });
      }
    },
  };
}
