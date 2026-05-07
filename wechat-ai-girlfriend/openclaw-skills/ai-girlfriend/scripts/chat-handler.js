#!/usr/bin/env node

/**
 * AI Girlfriend Chat Handler for OpenClaw
 * 
 * This script handles chat messages and generates responses using the AI girlfriend logic.
 * It can be called from OpenClaw skills to provide conversational capabilities.
 * 
 * Usage:
 *   node chat-handler.js --message "Hello" --user-id "user123"
 */

import { parseArgs } from 'node:util';
import { loadConfig } from '../src/config/index.js';
import { initLogger, createLogger } from '../src/utils/logger.js';
import { initDatabase, closeDatabase } from '../src/memory/database.js';
import { initAIClient } from '../src/ai/client.js';
import { createMessageHandler } from '../src/handlers/message-handler.js';

const logger = createLogger('openclaw-handler');

async function handleMessage(message, userId) {
  try {
    // Load configuration
    const config = loadConfig();
    
    // Initialize logger
    initLogger(config.logLevel);
    
    // Initialize database
    initDatabase(config.dbPath);
    
    // Initialize AI client
    initAIClient(config.openaiApiKey, config.openaiBaseUrl, config.openaiModel);
    
    // Create message handler
    const messageHandler = createMessageHandler(config);
    
    // Create a mock message object similar to Wechaty's Message interface
    const mockMessage = {
      text: () => message,
      from: () => ({
        id: userId,
        name: () => `User ${userId}`,
      }),
      room: () => null,
    };
    
    // Process the message and get response
    logger.info(`Processing message from user ${userId}: ${message}`);
    await messageHandler(mockMessage);
    
    // For OpenClaw integration, we need to capture the response
    // The actual response would be sent through OpenClaw's messaging system
    logger.info('Message processed successfully');
    
    return {
      success: true,
      message: 'Response generated and would be sent via OpenClaw',
    };
  } catch (error) {
    logger.error('Error handling message', { error: String(error) });
    return {
      success: false,
      error: String(error),
    };
  } finally {
    closeDatabase();
  }
}

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
AI Girlfriend Chat Handler for OpenClaw

Usage:
  node chat-handler.js --message <message> --user-id <user-id>

Options:
  -m, --message    The message to process
  -u, --user-id    The user ID
  -h, --help       Show this help message

Example:
  node chat-handler.js --message "你好" --user-id "user123"
      `);
      process.exit(0);
    }
    
    if (!values.message || !values['user-id']) {
      console.error('Error: Both --message and --user-id are required');
      process.exit(1);
    }
    
    const result = await handleMessage(values.message, values['user-id']);
    
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
