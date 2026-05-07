import { quickClassify } from './client.js';
import { createLogger } from '../utils/logger.js';
import type { EmotionCategory, EmotionResult } from '../types/index.js';

const logger = createLogger('emotion-analyzer');

const EMOTION_KEYWORDS: Record<EmotionCategory, string[]> = {
  happy: [
    '开心', '高兴', '快乐', '哈哈', '嘻嘻', '太好了', '好棒', '耶',
    '哇', '好开心', '真好', '太棒了', '好高兴', '笑死', '乐', '爽',
    '好幸福', '幸福', '美滋滋', '嘿嘿', '好耶',
  ],
  sad: [
    '难过', '伤心', '哭了', '想哭', '呜呜', '好难过', '心痛', '心酸',
    '委屈', '不开心', '郁闷', '难受', '失落', '低落', '丧', '抑郁',
    '崩溃', '受不了', '好惨', '惨',
  ],
  angry: [
    '生气', '气死', '烦死', '讨厌', '恨', '去死', '滚', '真烦',
    '受够了', '忍不了', '火大', '暴怒', '可恶', '混蛋', '什么鬼',
    '无语', '服了',
  ],
  anxious: [
    '焦虑', '紧张', '担心', '害怕', '不安', '慌', '心慌', '忐忑',
    '压力', '压力大', '焦', '急', '怎么办', '来不及', '赶不上',
  ],
  lonely: [
    '孤独', '寂寞', '一个人', '好无聊', '没人', '想你', '好想你',
    '想念', '好孤单', '孤单', '冷清', '空虚',
  ],
  excited: [
    '兴奋', '激动', '期待', '迫不及待', '好期待', '太兴奋', '天呐',
    '不敢相信', '绝了', '牛', '太牛了', '厉害', '卧槽',
  ],
  tired: [
    '累', '好累', '累死', '困', '好困', '困死', '疲惫', '没力气',
    '不想动', '躺平', '好困啊', '犯困', '加班', '熬夜', '没睡好',
    '睡不着', '失眠', '辛苦',
  ],
  neutral: [],
};

function analyzeByKeywords(text: string): EmotionResult {
  const scores: Partial<Record<EmotionCategory, number>> = {};
  let bestEmotion: EmotionCategory = 'neutral';
  let bestScore = 0;
  let trigger: string | undefined;

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS) as [EmotionCategory, string[]][]) {
    if (emotion === 'neutral') continue;

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        const current = (scores[emotion] ?? 0) + 1;
        scores[emotion] = current;
        if (current > bestScore) {
          bestScore = current;
          bestEmotion = emotion;
          trigger = keyword;
        }
      }
    }
  }

  const confidence = bestScore === 0 ? 0.5 : Math.min(0.5 + bestScore * 0.15, 0.95);

  return { emotion: bestEmotion, confidence, trigger };
}

export async function analyzeEmotion(
  text: string,
  useLLMFallback: boolean = true,
): Promise<EmotionResult> {
  const keywordResult = analyzeByKeywords(text);

  if (keywordResult.confidence >= 0.6 || !useLLMFallback) {
    logger.debug('Emotion detected by keywords', keywordResult);
    return keywordResult;
  }

  try {
    const categories: EmotionCategory[] = [
      'happy', 'sad', 'angry', 'anxious', 'lonely', 'excited', 'tired', 'neutral',
    ];
    const prompt = `请判断以下消息表达的情绪，只回复一个词：${categories.join('、')}\n\n消息：${text}`;
    const result = await quickClassify(prompt);

    const emotion = categories.find((c) => result.toLowerCase().includes(c)) ?? 'neutral';
    logger.debug('Emotion detected by LLM', { emotion, rawResult: result });

    return { emotion, confidence: 0.8 };
  } catch (error) {
    logger.warn('LLM emotion fallback failed, using keyword result', { error: String(error) });
    return keywordResult;
  }
}
