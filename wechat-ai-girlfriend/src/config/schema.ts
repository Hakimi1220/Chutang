import { z } from 'zod';

export const envConfigSchema = z.object({
  WECHATY_PUPPET: z.string().default('wechaty-puppet-wechat4u'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_BASE_URL: z.string().url().default('https://api.deepseek.com/v1'),
  OPENAI_MODEL: z.string().default('deepseek-chat'),
  CONTEXT_WINDOW_SIZE: z.coerce.number().int().min(1).max(100).default(20),
  DB_PATH: z.string().default('./data/chat.db'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  TIMEZONE: z.string().default('Asia/Shanghai'),
  PROACTIVE_CONTACT_ID: z.string().default(''),
  PERSONA_CONFIG_PATH: z.string().default('./config/persona.default.yaml'),
});

export type EnvConfig = z.infer<typeof envConfigSchema>;

const scheduledMessageConfigSchema = z.object({
  enabled: z.boolean().default(false),
  cron: z.string().default('0 8 * * *'),
  style: z.string().optional(),
  idle_threshold_hours: z.number().optional(),
});

export const personaConfigSchema = z.object({
  identity: z.object({
    name: z.string(),
    age: z.number().int().min(1),
    occupation: z.string(),
    location: z.string().optional(),
    gender: z.string().optional(),
  }),
  personality: z.object({
    traits: z.array(z.string()).min(1),
    mbti: z.string().optional(),
    mood_baseline: z.string().default('cheerful'),
  }),
  style: z.object({
    tone: z.enum(['soft', 'playful', 'cool', 'energetic']).default('soft'),
    language: z.string().default('zh-CN'),
    message_length: z.enum(['short', 'medium', 'long']).default('short'),
    emoji_frequency: z.enum(['none', 'low', 'moderate', 'high']).default('moderate'),
    favorite_emojis: z.array(z.string()).optional(),
    speech_patterns: z.array(z.string()).default([]),
    forbidden_patterns: z.array(z.string()).optional(),
  }),
  background: z.object({
    story: z.string(),
    relationship: z.string().default('girlfriend'),
    relationship_duration: z.string().optional(),
    shared_memories: z.array(z.string()).optional(),
  }),
  rules: z.object({
    boundaries: z.array(z.string()).default([]),
    response_guidelines: z.record(z.string(), z.string()).optional(),
  }),
  scheduled_messages: z.object({
    good_morning: scheduledMessageConfigSchema.optional(),
    good_night: scheduledMessageConfigSchema.optional(),
    caring_checkin: scheduledMessageConfigSchema.optional(),
    daily_life: z.object({
      enabled: z.boolean().default(false),
      crons: z.array(z.string()).default(['0 10 * * *', '0 15 * * *', '0 20 * * *']),
      topics: z.array(z.string()).optional(),
      send_probability: z.number().min(0).max(1).default(0.7),
    }).optional(),
    sulk_reminder: z.object({
      enabled: z.boolean().default(false),
      cron: z.string().default('0 * * * *'),
      mild_threshold_hours: z.number().default(3),
      angry_threshold_hours: z.number().default(6),
      heartbroken_threshold_hours: z.number().default(12),
    }).optional(),
  }).optional(),
});
