import { loadConfig } from './config/index.js';
import { initLogger, createLogger } from './utils/logger.js';
import { initDatabase, closeDatabase } from './memory/database.js';
import { initAIClient } from './ai/client.js';
import { createBot, startBot, stopBot } from './bot.js';
import { createMessageHandler } from './handlers/message-handler.js';
import { registerTask, startAll as startScheduler, stopAll as stopScheduler } from './scheduler/scheduler.js';
import { createGoodMorningTask } from './scheduler/tasks/good-morning.js';
import { createGoodNightTask } from './scheduler/tasks/good-night.js';
import { createCaringReminderTask } from './scheduler/tasks/caring-reminder.js';
import { createDailyLifeTasks } from './scheduler/tasks/daily-life.js';
import { createSulkReminderTask } from './scheduler/tasks/sulk-reminder.js';

async function main(): Promise<void> {
  // 1. Load configuration
  const config = loadConfig();

  // 2. Initialize logger
  initLogger(config.logLevel);
  const logger = createLogger('main');
  logger.info('Starting AI Girlfriend Bot...');

  // 3. Initialize database
  initDatabase(config.dbPath);

  // 4. Initialize AI client
  initAIClient(config.openaiApiKey, config.openaiBaseUrl, config.openaiModel);

  // 5. Create message handler
  const messageHandler = createMessageHandler(config);

  // 6. Create and start bot
  createBot(config, messageHandler);
  await startBot();

  // 7. Register scheduled tasks
  const tasks = [
    createGoodMorningTask(config),
    createGoodNightTask(config),
    createCaringReminderTask(config),
    createSulkReminderTask(config),
    ...createDailyLifeTasks(config),
  ];

  for (const task of tasks) {
    if (task) registerTask(task, config.timezone);
  }

  startScheduler();
  logger.info('All scheduled tasks started');

  // 8. Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down...`);

    stopScheduler();
    logger.info('Scheduler stopped');

    await stopBot();
    logger.info('Bot stopped');

    closeDatabase();
    logger.info('Database closed');

    logger.info('Goodbye!');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  logger.info('AI Girlfriend Bot is running! Waiting for messages...');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
