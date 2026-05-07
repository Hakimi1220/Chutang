import { WechatyBuilder, type Wechaty, type Contact } from 'wechaty';
import { createLogger } from './utils/logger.js';
import type { AppConfig } from './types/index.js';

const logger = createLogger('bot');

let bot: Wechaty | null = null;
let selfContact: Contact | null = null;

export function createBot(
  config: AppConfig,
  onMessage: (message: any) => Promise<void>,
): Wechaty {
  bot = WechatyBuilder.build({
    name: 'ai-girlfriend',
    puppet: config.wechatyPuppet as any,
  });

  bot.on('scan', (qrcode, status) => {
    const qrcodeUrl = `https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`;
    logger.info(`Scan QR Code to login: Status ${status}`);
    logger.info(`QR Code URL: ${qrcodeUrl}`);
    console.log(`\n请扫描二维码登录微信：\n${qrcodeUrl}\n`);
  });

  bot.on('login', (user) => {
    selfContact = user;
    logger.info(`Logged in as: ${user.name()}`);
    console.log(`\n登录成功！当前用户：${user.name()}\n`);
  });

  bot.on('logout', (user) => {
    selfContact = null;
    logger.info(`Logged out: ${user.name()}`);
  });

  bot.on('message', onMessage);

  bot.on('error', (error) => {
    logger.error('Bot error', { error: String(error) });
  });

  return bot;
}

export async function startBot(): Promise<void> {
  if (!bot) throw new Error('Bot not created. Call createBot() first.');
  await bot.start();
  logger.info('Bot started');
}

export async function stopBot(): Promise<void> {
  if (bot) {
    await bot.stop();
    bot = null;
    selfContact = null;
    logger.info('Bot stopped');
  }
}

export async function sendMessageToContact(
  contactId: string,
  text: string,
): Promise<boolean> {
  if (!bot) {
    logger.error('Cannot send message: bot not running');
    return false;
  }

  try {
    const contact = await bot.Contact.find({ id: contactId });
    if (!contact) {
      logger.error('Contact not found', { contactId });
      return false;
    }
    await contact.say(text);
    logger.info('Proactive message sent', { contactId, textLength: text.length });
    return true;
  } catch (error) {
    logger.error('Failed to send proactive message', { contactId, error: String(error) });
    return false;
  }
}
