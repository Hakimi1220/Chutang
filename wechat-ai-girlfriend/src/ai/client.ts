import OpenAI from 'openai';
import { createLogger } from '../utils/logger.js';
import { withRetry } from '../utils/retry.js';
import type { ChatMessage } from '../types/index.js';

const logger = createLogger('ai-client');

let client: OpenAI | null = null;
let modelName = 'deepseek-chat';

export function initAIClient(apiKey: string, baseUrl: string, model: string): void {
  client = new OpenAI({
    apiKey,
    baseURL: baseUrl,
    timeout: 30000,
  });
  modelName = model;
  logger.info('AI client initialized', { baseUrl, model });
}

export async function chat(
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<string> {
  if (!client) {
    throw new Error('AI client not initialized. Call initAIClient() first.');
  }

  const allMessages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const response = await withRetry(
    async () => {
      const completion = await client!.chat.completions.create({
        model: modelName,
        messages: allMessages,
        temperature: 0.85,
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from AI');
      }

      const usage = completion.usage;
      if (usage) {
        logger.debug('Token usage', {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        });
      }

      return content;
    },
    { maxAttempts: 3, baseDelay: 1000 },
  );

  return response;
}

export async function quickClassify(prompt: string): Promise<string> {
  if (!client) {
    throw new Error('AI client not initialized.');
  }

  const completion = await client.chat.completions.create({
    model: modelName,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    max_tokens: 20,
  });

  return completion.choices[0]?.message?.content?.trim() ?? 'neutral';
}
