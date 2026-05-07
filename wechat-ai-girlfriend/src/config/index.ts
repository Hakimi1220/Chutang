import 'dotenv/config';
import { envConfigSchema } from './schema.js';
import { loadPersonaConfig } from './persona.js';
import type { AppConfig } from '../types/index.js';

export function loadConfig(): AppConfig {
  const env = envConfigSchema.parse(process.env);
  const persona = loadPersonaConfig(env.PERSONA_CONFIG_PATH);

  return Object.freeze({
    wechatyPuppet: env.WECHATY_PUPPET,
    openaiApiKey: env.OPENAI_API_KEY,
    openaiBaseUrl: env.OPENAI_BASE_URL,
    openaiModel: env.OPENAI_MODEL,
    contextWindowSize: env.CONTEXT_WINDOW_SIZE,
    dbPath: env.DB_PATH,
    logLevel: env.LOG_LEVEL,
    timezone: env.TIMEZONE,
    proactiveContactId: env.PROACTIVE_CONTACT_ID,
    personaConfigPath: env.PERSONA_CONFIG_PATH,
    persona,
  });
}
