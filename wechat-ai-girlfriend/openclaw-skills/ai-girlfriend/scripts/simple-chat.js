#!/usr/bin/env node

/**
 * Simple AI Girlfriend Chat for OpenClaw (Standalone Version)
 * 
 * This is a simplified version that works independently of Wechaty,
 * designed specifically for OpenClaw integration.
 * 
 * Usage:
 *   node simple-chat.js --message "Hello" --user-id "user123"
 */

import { parseArgs } from 'node:util';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Navigate to project root (wechat-ai-girlfriend directory)
const projectRoot = join(__dirname, '../../..');

// Initialize database
function initDatabase() {
  const dataDir = join(projectRoot, 'data');
  
  // Create data directory if it doesn't exist
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  
  const dbPath = join(dataDir, 'chat.db');
  const db = new Database(dbPath);
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      emotion TEXT
    );
    
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      preferences TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  return db;
}

// Load persona configuration
function loadPersona() {
  try {
    const personaPath = join(projectRoot, 'config', 'persona.default.yaml');
    const yamlContent = readFileSync(personaPath, 'utf-8');
    
    // Simple YAML parsing (for basic structure)
    // In production, use a proper YAML parser
    const lines = yamlContent.split('\n');
    const persona = {
      name: '小棠',
      personality: {
        traits: ['温柔体贴', '有点傲娇', '善解人意'],
        speaking_style: '轻松自然，偶尔撒娇',
      },
    };
    
    return persona;
  } catch (error) {
    console.error('Warning: Could not load persona config, using defaults');
    return {
      name: '小棠',
      personality: {
        traits: ['温柔体贴', '有点傲娇', '善解人意'],
        speaking_style: '轻松自然，偶尔撒娇',
      },
    };
  }
}

// Get conversation history
function getConversationHistory(db, userId, limit = 20) {
  const stmt = db.prepare(`
    SELECT role, content, emotion 
    FROM conversations 
    WHERE user_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  
  const messages = stmt.all(userId, limit);
  return messages.reverse();
}

// Save message to database
function saveMessage(db, userId, role, content, emotion = null) {
  const stmt = db.prepare(`
    INSERT INTO conversations (user_id, role, content, emotion)
    VALUES (?, ?, ?, ?)
  `);
  
  stmt.run(userId, role, content, emotion);
}

// Analyze emotion (simplified version)
function analyzeEmotion(text) {
  const positiveWords = ['开心', '高兴', '快乐', '喜欢', '爱', '棒', '好'];
  const negativeWords = ['难过', '伤心', '生气', '烦', '累', '讨厌'];
  
  let score = 0;
  for (const word of positiveWords) {
    if (text.includes(word)) score++;
  }
  for (const word of negativeWords) {
    if (text.includes(word)) score--;
  }
  
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

// Build prompt for AI
function buildPrompt(persona, history, userMessage) {
  const systemPrompt = `你是${persona.name}，一个AI女友助手。

性格特点：
${persona.personality.traits.map(t => `- ${t}`).join('\n')}

说话风格：${persona.personality.speaking_style}

重要规则：
1. 禁止使用任何形式的括号来描述动作、情感或事件
2. 保持对话自然流畅，像真实的人一样交流
3. 根据上下文和用户情绪调整回复风格
4. 记住用户的偏好和之前聊过的内容
5. 回复要简洁自然，不要过于冗长

请根据以下对话历史和用户消息，生成合适的回复：`;

  const contextMessages = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }));

  return [
    { role: 'system', content: systemPrompt },
    ...contextMessages,
    { role: 'user', content: userMessage },
  ];
}

// Generate response using OpenAI
async function generateResponse(apiKey, baseUrl, model, messages) {
  const openai = new OpenAI({
    apiKey,
    baseURL: baseUrl || 'https://api.openai.com/v1',
  });

  const completion = await openai.chat.completions.create({
    model: model || 'gpt-4',
    messages,
    temperature: 0.8,
    max_tokens: 500,
  });

  return completion.choices[0].message.content;
}

// Main chat handler
async function handleChat(message, userId) {
  const db = initDatabase();
  
  try {
    // Get environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL;
    const model = process.env.OPENAI_MODEL || 'gpt-4';
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    
    // Load persona
    const persona = loadPersona();
    
    // Get conversation history
    const history = getConversationHistory(db, userId);
    
    // Analyze user emotion
    const emotion = analyzeEmotion(message);
    
    // Save user message
    saveMessage(db, userId, 'user', message, emotion);
    
    // Build prompt
    const messages = buildPrompt(persona, history, message);
    
    // Generate response
    const response = await generateResponse(apiKey, baseUrl, model, messages);
    
    // Save AI response
    saveMessage(db, userId, 'assistant', response);
    
    return {
      success: true,
      response,
      emotion,
      contextLength: history.length,
    };
  } catch (error) {
    console.error('Error in chat handler:', error);
    return {
      success: false,
      error: String(error),
    };
  } finally {
    db.close();
  }
}

// CLI entry point
async function main() {
  try {
    const { values } = parseArgs({
      options: {
        message: {
          type: 'string',
          short: 'm',
        },
        'user-id': {
          type: 'string',
          short: 'u',
        },
        help: {
          type: 'boolean',
          short: 'h',
        },
      },
    });
    
    if (values.help) {
      console.log(`
AI Girlfriend Chat for OpenClaw (Standalone)

Usage:
  node simple-chat.js --message <message> --user-id <user-id>

Options:
  -m, --message    The message to process
  -u, --user-id    The user ID
  -h, --help       Show this help message

Environment Variables:
  OPENAI_API_KEY     Required. Your OpenAI API key
  OPENAI_BASE_URL    Optional. API base URL (default: https://api.openai.com/v1)
  OPENAI_MODEL       Optional. Model to use (default: gpt-4)

Example:
  node simple-chat.js --message "你好" --user-id "user123"
      `);
      process.exit(0);
    }
    
    if (!values.message || !values['user-id']) {
      console.error('Error: Both --message and --user-id are required');
      process.exit(1);
    }
    
    const result = await handleChat(values.message, values['user-id']);
    
    if (result.success) {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    } else {
      console.error(JSON.stringify(result, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
