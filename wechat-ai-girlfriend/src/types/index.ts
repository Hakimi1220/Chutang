export type EmotionCategory =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'anxious'
  | 'lonely'
  | 'neutral'
  | 'excited'
  | 'tired';

export interface EmotionResult {
  emotion: EmotionCategory;
  confidence: number;
  trigger?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StoredMessage {
  id: number;
  contact_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  emotion: EmotionCategory | null;
  emotion_confidence: number | null;
  token_count: number | null;
  created_at: string;
}

export interface ContactRecord {
  contact_id: string;
  display_name: string | null;
  first_seen_at: string;
  last_message_at: string | null;
  message_count: number;
}

export interface PersonaIdentity {
  name: string;
  age: number;
  occupation: string;
  location?: string;
  gender?: string;
}

export interface PersonaPersonality {
  traits: string[];
  mbti?: string;
  mood_baseline: string;
}

export interface PersonaStyle {
  tone: 'soft' | 'playful' | 'cool' | 'energetic';
  language: string;
  message_length: 'short' | 'medium' | 'long';
  emoji_frequency: 'none' | 'low' | 'moderate' | 'high';
  favorite_emojis?: string[];
  speech_patterns: string[];
  forbidden_patterns?: string[];
}

export interface PersonaBackground {
  story: string;
  relationship: string;
  relationship_duration?: string;
  shared_memories?: string[];
}

export interface ScheduledMessageConfig {
  enabled: boolean;
  cron: string;
  style?: string;
  idle_threshold_hours?: number;
}

export interface DailyLifeConfig {
  enabled: boolean;
  /** 多个 cron 时间点，每天随机挑选日常话题发送 */
  crons: string[];
  /** 话题候选列表，AI 会从中随机选一个展开 */
  topics?: string[];
  /** 每次触发时实际发送的概率 (0-1)，默认 0.7 */
  send_probability?: number;
}

export interface SulkReminderConfig {
  enabled: boolean;
  /** 检查频率 */
  cron: string;
  /** 触发轻微抱怨的沉默时长（小时） */
  mild_threshold_hours?: number;
  /** 触发明显生气的沉默时长（小时） */
  angry_threshold_hours?: number;
  /** 触发委屈哭泣的沉默时长（小时） */
  heartbroken_threshold_hours?: number;
}

export interface PersonaRules {
  boundaries: string[];
  response_guidelines?: Record<string, string>;
}

export interface PersonaConfig {
  identity: PersonaIdentity;
  personality: PersonaPersonality;
  style: PersonaStyle;
  background: PersonaBackground;
  rules: PersonaRules;
  scheduled_messages?: {
    good_morning?: ScheduledMessageConfig;
    good_night?: ScheduledMessageConfig;
    caring_checkin?: ScheduledMessageConfig;
    daily_life?: DailyLifeConfig;
    sulk_reminder?: SulkReminderConfig;
  };
}

export interface AppConfig {
  wechatyPuppet: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  contextWindowSize: number;
  dbPath: string;
  logLevel: string;
  timezone: string;
  proactiveContactId: string;
  personaConfigPath: string;
  persona: PersonaConfig;
}

export interface ScheduledTask {
  name: string;
  cron: string;
  task: () => Promise<void>;
}
