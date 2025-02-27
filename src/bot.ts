import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { generateGPTRequest } from './chatgptService';

dotenv.config();

export function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is missing in .env');
  }

  const bot = new TelegramBot(token, { polling: true });

  // Asynchronous message handler
  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    try {
      const answer = await generateGPTRequest(text);
      bot.sendMessage(chatId, `GPT-4o-mini replied:\n${answer}`);
    } catch (error) {
      console.error('Error on GPT request:', error);
      bot.sendMessage(chatId, 'Error on GPT request');
    }
  });

  console.log('Telegram bot has been started via Long Polling');
}
