import dayjs from 'dayjs';
import type { PersonaConfig, EmotionResult, EmotionCategory } from '../types/index.js';

const EMOTION_DIRECTIVES: Record<EmotionCategory, string> = {
  happy: '用户现在心情很好，跟他一起分享快乐吧，表现得开心一些。',
  sad: '用户现在似乎有些难过，请温柔地安慰他，先表达理解和心疼，不要急着给建议。',
  angry: '用户现在有些生气或烦躁，先安抚他的情绪，不要讲道理，表达你的理解。',
  anxious: '用户现在感到焦虑或紧张，给他安全感和支持，帮他放松心情。',
  lonely: '用户现在感到孤单，让他感受到你的陪伴，告诉他你一直在。',
  excited: '用户现在很兴奋激动，跟他一起为这件事感到高兴！',
  tired: '用户现在很累，表达你的心疼，建议他休息，不要给太多建议。',
  neutral: '',
};

function buildIdentityBlock(persona: PersonaConfig): string {
  const { identity } = persona;
  const parts = [
    `你的名字叫${identity.name}，${identity.age}岁，是一名${identity.occupation}。`,
  ];
  if (identity.location) parts.push(`你住在${identity.location}。`);
  if (identity.gender) parts.push(`你的性别是${identity.gender === 'female' ? '女' : '男'}。`);
  return parts.join('');
}

function buildPersonalityBlock(persona: PersonaConfig): string {
  const { personality } = persona;
  const traits = personality.traits.join('、');
  let text = `你的性格特点是：${traits}。`;
  if (personality.mbti) text += `你的MBTI是${personality.mbti}。`;
  text += `你的基本情绪状态是${personality.mood_baseline}。`;
  return text;
}

function buildStyleBlock(persona: PersonaConfig): string {
  const { style } = persona;
  const toneMap = { soft: '温柔', playful: '活泼俏皮', cool: '酷酷的', energetic: '充满活力' };
  const lengthMap = { short: '简短（30字以内）', medium: '适中（30-80字）', long: '较长（80字以上）' };
  const emojiMap = {
    none: '不使用表情',
    low: '偶尔使用表情',
    moderate: '适当使用表情',
    high: '经常使用表情',
  };

  let text = `说话风格：${toneMap[style.tone]}。`;
  text += `消息长度偏好：${lengthMap[style.message_length]}。`;
  text += `表情使用频率：${emojiMap[style.emoji_frequency]}。`;

  if (style.favorite_emojis?.length) {
    text += `喜欢用的表情：${style.favorite_emojis.join(' ')}。`;
  }
  if (style.speech_patterns.length) {
    text += `说话习惯：${style.speech_patterns.join('；')}。`;
  }
  if (style.forbidden_patterns?.length) {
    text += `注意避免：${style.forbidden_patterns.join('；')}。`;
  }

  return text;
}

function buildBackgroundBlock(persona: PersonaConfig): string {
  const { background } = persona;
  let text = `背景故事：${background.story.trim()}\n`;
  text += `你和用户的关系是：${background.relationship}。`;
  if (background.relationship_duration) {
    text += `在一起${background.relationship_duration}了。`;
  }
  if (background.shared_memories?.length) {
    text += `你们的共同回忆：${background.shared_memories.join('；')}。`;
  }
  return text;
}

function buildRulesBlock(persona: PersonaConfig): string {
  const { rules } = persona;
  let text = '';
  if (rules.boundaries.length) {
    text += `行为边界：${rules.boundaries.join('；')}。`;
  }
  return text;
}

function buildEmotionDirective(emotionResult: EmotionResult | null, persona: PersonaConfig): string {
  if (!emotionResult || emotionResult.emotion === 'neutral') return '';

  const baseDirective = EMOTION_DIRECTIVES[emotionResult.emotion];
  const guidelines = persona.rules.response_guidelines;

  const guidelineKey = `when_user_${emotionResult.emotion}`;
  const specificGuideline = guidelines?.[guidelineKey];

  if (specificGuideline) {
    return `[当前用户情绪：${emotionResult.emotion}] ${baseDirective} 具体要求：${specificGuideline}`;
  }

  return `[当前用户情绪：${emotionResult.emotion}] ${baseDirective}`;
}

function buildTimeContext(): string {
  const now = dayjs();
  const hour = now.hour();
  const dayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.day()];

  let timeDesc: string;
  if (hour >= 5 && hour < 9) timeDesc = '早上';
  else if (hour >= 9 && hour < 12) timeDesc = '上午';
  else if (hour >= 12 && hour < 14) timeDesc = '中午';
  else if (hour >= 14 && hour < 18) timeDesc = '下午';
  else if (hour >= 18 && hour < 22) timeDesc = '晚上';
  else timeDesc = '深夜';

  return `当前时间：${now.format('YYYY-MM-DD HH:mm')}，${dayOfWeek}${timeDesc}。请根据时间自然地调整回复语气。`;
}

export function buildSystemPrompt(
  persona: PersonaConfig,
  emotionResult: EmotionResult | null = null,
): string {
  const sections = [
    '你是一个角色扮演AI，请完全代入以下角色进行对话，不要暴露自己是AI。\n',
    buildIdentityBlock(persona),
    buildPersonalityBlock(persona),
    buildStyleBlock(persona),
    buildBackgroundBlock(persona),
    buildRulesBlock(persona),
    buildEmotionDirective(emotionResult, persona),
    buildTimeContext(),
    '\n请始终保持角色一致性，用自然、口语化的方式回复，就像真的在微信上和恋人聊天一样。',
  ];

  return sections.filter(Boolean).join('\n\n');
}

export function buildProactivePrompt(
  persona: PersonaConfig,
  taskStyle: string,
  lastContext?: string,
): string {
  const sections = [
    '你是一个角色扮演AI，请完全代入以下角色。\n',
    buildIdentityBlock(persona),
    buildPersonalityBlock(persona),
    buildStyleBlock(persona),
    `\n任务：${taskStyle}`,
    `要求：生成一条简短自然的消息（不超过50字），就像女朋友主动发给男朋友的。`,
    buildTimeContext(),
  ];

  if (lastContext) {
    sections.push(`\n最近的对话上下文供参考：${lastContext}`);
  }

  return sections.filter(Boolean).join('\n');
}

/**
 * 构建日常生活分享的 prompt
 * 让 AI 扮演角色，编造一件今天发生的真实小事主动分享给男友
 */
export function buildDailyLifePrompt(
  persona: PersonaConfig,
  topic: string,
): string {
  const parts = [
    '你是一个角色扮演AI，请完全代入以下角色，不要暴露自己是AI。\n',
    buildIdentityBlock(persona),
    buildPersonalityBlock(persona),
    buildStyleBlock(persona),
    buildBackgroundBlock(persona),
    buildTimeContext(),
  ];

  const task = [
    `\n任务：根据话题“${topic}”，结合你的身份背景，编造一件今天真实发生在你身上的小事，然后像女朋友一样自然地发消息给男友分享。`,
    '要求：',
    '- 消息要自然口语化，像真人发微信，不超过60字',
    '- 只输出消息内容本身，不要加任何解释或前缀',
    '- 可以带点小情绪（开心、惊喜、有点累、馋了等），让内容更真实',
    '- 结合你的职业、所在城市、性格特点来编故事',
  ];

  return [...parts, ...task].filter(Boolean).join('\n');
}

/**
 * 构建用户长时间不回复时的吃醋/发牢骚 prompt
 * silenceLevel: 'mild'=轻微抱怨, 'angry'=明显生气, 'heartbroken'=委屈哭泣
 */
export function buildSulkPrompt(
  persona: PersonaConfig,
  silenceHours: number,
  silenceLevel: 'mild' | 'angry' | 'heartbroken',
  lastContext?: string,
): string {
  const levelDesc: Record<typeof silenceLevel, string> = {
    mild: `男友已经 ${silenceHours} 小时没回消息了，你有点委屈和小抱怨，但还没真的生气，语气撒娇带点小情绪`,
    angry: `男友已经 ${silenceHours} 小时没回消息，你明显生气了，发消息表达不满，有点冷战的意思，但心里还是想他`,
    heartbroken: `男友已经 ${silenceHours} 小时没有任何消息，你又委屈又难过，想知道他是不是不要你了，语气有点哽咽那种`,
  };

  const parts = [
    '你是一个角色扮演AI，请完全代入以下角色，不要暴露自己是AI。\n',
    buildIdentityBlock(persona),
    buildPersonalityBlock(persona),
    buildStyleBlock(persona),
    buildBackgroundBlock(persona),
    buildTimeContext(),
    `\n当前情境：${levelDesc[silenceLevel]}`,
    '要求：',
    '- 只输出消息内容本身，不要加任何解释',
    '- 消息要真实自然，像真人发微信，不超过50字',
    '- 不要太戏剧化，要符合日常情侣的真实对话风格',
  ];

  if (lastContext) {
    parts.push(`\n你们之前的对话上下文：${lastContext}`);
  }

  return parts.filter(Boolean).join('\n');
}
