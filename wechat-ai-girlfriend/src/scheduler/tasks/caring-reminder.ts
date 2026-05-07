import dayjs from 'dayjs';
import { chat } from '../../ai/client.js';
import { buildProactivePrompt } from '../../ai/prompt-builder.js';
import { sendMessageToContact } from '../../bot.js';
import { saveMessage, getLastMessageTime, getRecentMessages } from '../../memory/conversation-store.js';
import { createLogger } from '../../utils/logger.js';
import type { AppConfig, ScheduledTask } from '../../types/index.js';

const logger = createLogger('caring-reminder');

export function createCaringReminderTask(config: AppConfig): ScheduledTask | null {
  const caringConfig = config.persona.scheduled_messages?.caring_checkin;
  if (!caringConfig?.enabled || !config.proactiveContactId) return null;

  const thresholdHours = caringConfig.idle_threshold_hours ?? 6;

  return {
    name: 'caring-reminder',
    cron: caringConfig.cron,
    task: async () => {
      const lastTime = getLastMessageTime(config.proactiveContactId);
      if (lastTime) {
        const hoursSince = dayjs().diff(dayjs(lastTime), 'hour');
        if (hoursSince < thresholdHours) {
          logger.debug('Skipping caring reminder, last message was recent', { hoursSince });
          return;
        }
      }

      // Get recent context for a more natural message
      const recentMessages = getRecentMessages(config.proactiveContactId, 5);
      const lastContext = recentMessages
        .map((m) => `${m.role === 'user' ? '对方' : '你'}：${m.content}`)
        .join('\n');

      const style = caringConfig.style ?? '自然的关心消息';
      const prompt = buildProactivePrompt(config.persona, style, lastContext || undefined);

      const response = await chat(prompt, []);
      const sent = await sendMessageToContact(config.proactiveContactId, response);

      if (sent) {
        saveMessage(config.proactiveContactId, 'assistant', response);
        logger.info('Caring reminder sent', { response });
      }
    },
  };
}
