import { chat } from '../../ai/client.js';
import { buildDailyLifePrompt } from '../../ai/prompt-builder.js';
import { sendMessageToContact } from '../../bot.js';
import { saveMessage } from '../../memory/conversation-store.js';
import { createLogger } from '../../utils/logger.js';
import type { AppConfig, ScheduledTask } from '../../types/index.js';

const logger = createLogger('daily-life');

/** 默认话题池，当 config 未配置 topics 时使用 */
const DEFAULT_TOPICS = [
  '今天工作室发生的趣事',
  '路上看到的有趣场景',
  '今天吃到了好吃的东西',
  '逛街或者咖啡馆',
  '天气或者窗外的风景',
  '今天画的画或创作灵感',
  '看到了一只可爱的猫',
  '刷到了有意思的视频或书',
  '今天身体感受（有点累、心情好、突然想你了）',
  '和朋友聊天或者出去玩',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 创建"日常生活分享"任务列表。
 * 每个 cron 时间点注册一个独立任务，触发时有概率随机发送一条生活分享消息。
 */
export function createDailyLifeTasks(config: AppConfig): ScheduledTask[] {
  const dailyLifeConfig = config.persona.scheduled_messages?.daily_life;
  if (!dailyLifeConfig?.enabled || !config.proactiveContactId) return [];

  const topics = dailyLifeConfig.topics?.length ? dailyLifeConfig.topics : DEFAULT_TOPICS;
  const sendProbability = dailyLifeConfig.send_probability ?? 0.7;

  return dailyLifeConfig.crons.map((cron, index) => ({
    name: `daily-life-${index}`,
    cron,
    task: async () => {
      // 随机概率决定本次是否真的发送，模拟"不是每次都发"的真实感
      if (Math.random() > sendProbability) {
        logger.debug('Daily life task skipped by probability', { cron });
        return;
      }

      const topic = pickRandom(topics);
      logger.info('Generating daily life message', { topic });

      const prompt = buildDailyLifePrompt(config.persona, topic);
      const response = await chat(prompt, []);
      const sent = await sendMessageToContact(config.proactiveContactId, response);

      if (sent) {
        saveMessage(config.proactiveContactId, 'assistant', response);
        logger.info('Daily life message sent', { topic, response });
      }
    },
  }));
}
