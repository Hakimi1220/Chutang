import cron from 'node-cron';
import { createLogger } from '../utils/logger.js';
import type { ScheduledTask } from '../types/index.js';

const logger = createLogger('scheduler');

const jobs: Map<string, cron.ScheduledTask> = new Map();

export function registerTask(task: ScheduledTask, timezone: string): void {
  if (!cron.validate(task.cron)) {
    logger.error('Invalid cron expression', { name: task.name, cron: task.cron });
    return;
  }

  const job = cron.schedule(
    task.cron,
    async () => {
      logger.info(`Running scheduled task: ${task.name}`);
      try {
        await task.task();
        logger.info(`Scheduled task completed: ${task.name}`);
      } catch (error) {
        logger.error(`Scheduled task failed: ${task.name}`, { error: String(error) });
      }
    },
    { timezone, name: task.name },
  );

  // node-cron v4 auto-starts tasks, stop it first so we can control when to start
  job.stop();

  jobs.set(task.name, job);
  logger.info('Task registered', { name: task.name, cron: task.cron, timezone });
}

export function startAll(): void {
  for (const [name, job] of jobs) {
    job.start();
    logger.info(`Task started: ${name}`);
  }
}

export function stopAll(): void {
  for (const [name, job] of jobs) {
    job.stop();
    logger.info(`Task stopped: ${name}`);
  }
  jobs.clear();
}
