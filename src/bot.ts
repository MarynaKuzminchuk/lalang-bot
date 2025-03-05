import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { generateTranslationTask, checkTranslation } from './chatgptService';

dotenv.config();

export function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is missing in .env');
  }

  const bot = new TelegramBot(token, { polling: true });
  const userStates: Record<number, { sentence: string; isWaitingForTranslation: boolean }> = {};

  function sendTaskButton(chatId: number) {
    const keyboard = {
      reply_markup: {
        inline_keyboard: [[{ text: 'Give assignment', callback_data: 'give_task' }]],
      },
    };
    bot.sendMessage(chatId, 'Click “Give assignment” to get a new exercise.', keyboard);
  }

  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Welcome to Lalang, a chatbot for learning a foreign language. You will be given tasks to translate and after you will get a breakdown of your answer. Have fun!');
    sendTaskButton(msg.chat.id);
  });

  bot.on('callback_query', async (query) => {
    if (!query.data) return;
    const chatId = query.message?.chat.id;
    if (!chatId) return;

    if (query.data === 'give_task') {
      await handleAssignmentRequest(chatId);
      bot.answerCallbackQuery(query.id);
    }
  });

  async function handleAssignmentRequest(chatId: number) {
    try {
      const sentence = await generateTranslationTask();

      if (!sentence) {
        bot.sendMessage(chatId, 'Assignment generation error.');
        return;
      }

      // Save the task in memory
      userStates[chatId] = { sentence, isWaitingForTranslation: true };

      bot.sendMessage(chatId, `Translate into German:\n\n"${sentence}"\n\n(Enter the translation below.)`);

    } catch (error) {
      console.error('Assignment generation error:', error);
      bot.sendMessage(chatId, 'Assignment generation error.');
    }
  }

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text || '';

    const userState = userStates[chatId];
    if (userState && userState.isWaitingForTranslation) {
      userState.isWaitingForTranslation = false;

      try {
        // Check the translation
        const checkResult = await checkTranslation(userState.sentence, text);

        // Sending the translation analysis
        await bot.sendMessage(chatId, checkResult);

        sendTaskButton(chatId);

      } catch (error) {
        console.error('Check result error:', error);
        bot.sendMessage(chatId, 'Check result error.');
        
        sendTaskButton(chatId);
      }
    }
  });

  console.log('Telegram bot has been started via Long Polling');
}