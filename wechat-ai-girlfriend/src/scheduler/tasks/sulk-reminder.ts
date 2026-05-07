import dayjs from 'dayjs';
import { chat } from '../../ai/client.js';
import { buildSulkPrompt } from '../../ai/prompt-builder.js';
import { sendMessageToContact } from '../../bot.js';
import {
  saveMessage,
  getLastUserMessageTime,
  getRecentMessages,
} from '../../memory/conversation-store.js';
import { createLogger } from '../../utils/logger.js';
import type { AppConfig, ScheduledTask } from '../../types/index.js';

const logger = createLogger('sulk-reminder');

/**
 * 判断当前沉默时长对应的牢骚等级
 * 返回 null 表示沉默时间不够，不需要发
 */
function getSilenceLevel(
  silenceHours: number,
  mildThreshold: number,
  angryThreshold: number,
  heartbrokenThreshold: number,
): 'mild' | 'angry' | 'heartbroken' | null {
  if (silenceHours >= heartbrokenThreshold) return 'heartbroken';
  if (silenceHours >= angryThreshold) return 'angry';
  if (silenceHours >= mildThreshold) return 'mild';
  return null;
}

/**
 * 创建"长时间不回信息就发牢骚"任务。
 *
 * 逻辑：
 * 1. 每次检查距离用户最后一条消息过了多少小时
 * 2. 根据阈值判断是轻微抱怨、明显生气还是委屈哭泣
 * 3. 防止重复发：记录上次已发过牢骚的 silenceLevel，同一等级不重复发
 */
export function createSulkReminderTask(config: AppConfig): ScheduledTask | null {
  const sulkConfig = config.persona.scheduled_messages?.sulk_reminder;
  if (!sulkConfig?.enabled || !config.proactiveContactId) return null;

  const mildThreshold = sulkConfig.mild_threshold_hours ?? 3;
  const angryThreshold = sulkConfig.angry_threshold_hours ?? 6;
  const heartbrokenThreshold = sulkConfig.heartbroken_threshold_hours ?? 12;

  // 用于防止同一等级重复发，内存状态足够（重启后重置也无妨）
  let lastSentLevel: 'mild' | 'angry' | 'heartbroken' | null = null;
  let lastSentAt: dayjs.Dayjs | null = null;

  return {
    name: 'sulk-reminder',
    cron: sulkConfig.cron,
    task: async () => {
      const lastUserTime = getLastUserMessageTime(config.proactiveContactId);

      // 如果从没收到过用户消息，不发牢骚
      if (!lastUserTime) {
        logger.debug('No user messages yet, skipping sulk reminder');
        return;
      }

      const silenceHours = dayjs().diff(dayjs(lastUserTime), 'hour', true);
      const level = getSilenceLevel(
        silenceHours,
        mildThreshold,
        angryThreshold,
        heartbrokenThreshold,
      );

      if (!level) {
        logger.debug('Silence not long enough for sulk', { silenceHours });
        // 用户回复了，重置状态
        lastSentLevel = null;
        lastSentAt = null;
        return;
      }

      // 同一等级不重复发（升级时才再发）
      const levelOrder = { mild: 1, angry: 2, heartbroken: 3 };
      if (
        lastSentLevel !== null &&
        levelOrder[level] <= levelOrder[lastSentLevel] &&
        lastSentAt &&
        dayjs().diff(lastSentAt, 'hour') < 1
      ) {
        logger.debug('Already sent sulk at this level recently', { level, lastSentLevel });
        return;
      }

      const recentMessages = getRecentMessages(config.proactiveContactId, 5);
      const lastContext = recentMessages.length
        ? recentMessages.map((m) => `${m.role === 'user' ? '对方' : '你'}：${m.content}`).join('\n')
        : undefined;

      const silenceHoursInt = Math.floor(silenceHours);
      logger.info('Sending sulk reminder', { level, silenceHours: silenceHoursInt });

      const prompt = buildSulkPrompt(config.persona, silenceHoursInt, level, lastContext);
      const response = await chat(prompt, []);
      const sent = await sendMessageToContact(config.proactiveContactId, response);

      if (sent) {
        saveMessage(config.proactiveContactId, 'assistant', response);
        lastSentLevel = level;
        lastSentAt = dayjs();
        logger.info('Sulk reminder sent', { level, response });
      }
    },
  };
}
