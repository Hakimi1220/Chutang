import { createLogger } from './logger.js';

const logger = createLogger('retry');

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000 } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        logger.error(`All ${maxAttempts} attempts failed`, { error: String(error) });
        throw error;
      }
      const jitter = Math.random() * 0.3 + 0.85;
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1) * jitter, maxDelay);
      logger.warn(`Attempt ${attempt}/${maxAttempts} failed, retrying in ${Math.round(delay)}ms`, {
        error: String(error),
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable');
}
