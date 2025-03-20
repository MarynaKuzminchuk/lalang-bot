import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { generateTranslationTask, checkTranslation } from './chatgptService';
import { saveTranslation, getLastTranslations, saveStudentProgress, getStudentProgress } from './database';

dotenv.config();

export function initTelegramBot(bot: TelegramBot) {
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
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      'Welcome to Lalang, a chatbot for learning a foreign language.\n\n' +
      'You will be given tasks to translate and after you will get a breakdown of your answer.\n\nHave fun!'
    );
    sendTaskButton(chatId);
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
    const taskId = msg.message_id ?? -1;

    if (taskId === -1) {
      console.warn("⚠️ Missing save: no taskId!");
      return;
    }

    const userState = userStates[chatId];
    if (userState && userState.isWaitingForTranslation) {
      userState.isWaitingForTranslation = false;

      try {
        const analysis = await checkTranslation(userState.sentence, text);
        const [messageToStudent, correctedVersion, correctGrammar, incorrectGrammar, correctVocabulary, incorrectVocabulary] = analysis.split("---");
        await bot.sendMessage(chatId, messageToStudent);

        saveTranslation(chatId, userState.sentence, text, correctedVersion, taskId);

        console.log(analysis);

        // let errorType: "grammar" | "vocabulary" | null = null;

        // if (checkResult.toLowerCase().includes("ошибка")) {
        //   errorType = checkResult.toLowerCase().includes("грамматика") ? "grammar" : "vocabulary";
        //   saveStudentProgress(chatId, errorType, userState.sentence, false, taskId);
        // } else {
        //   saveStudentProgress(chatId, "grammar", userState.sentence, true, taskId);
        // }

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