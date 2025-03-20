import TelegramBot from 'node-telegram-bot-api';
import { TranslationRepository } from './translationRepository';
import { ChatGPTService } from './chatgptService';

export class TelegramBotController {
  private userStates: Record<number, { sentence: string; isWaitingForTranslation: boolean }> = {};

  constructor(
    private bot: TelegramBot,
    private chatGptService: ChatGPTService,
    private translationRepository: TranslationRepository
  ) {
    this.initializeBot();
  }

  private sendTaskButton(chatId: number): void {
    const keyboard = {
      reply_markup: {
        inline_keyboard: [[{ text: 'Give assignment', callback_data: 'give_task' }]],
      },
    };
    this.bot.sendMessage(chatId, 'Click “Give assignment” to get a new exercise.', keyboard);
  }

  private initializeBot(): void {
    // Handle /start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(
        chatId,
        'Welcome to Lalang, a chatbot for learning a foreign language.\n\n' +
          'You will be given tasks to translate and after you will get a breakdown of your answer.\n\nHave fun!'
      );
      this.sendTaskButton(chatId);
    });

    // Handle callback queries (e.g., button clicks)
    this.bot.on('callback_query', async (query) => {
      if (!query.data) return;
      const chatId = query.message?.chat.id;
      if (!chatId) return;

      if (query.data === 'give_task') {
        await this.handleAssignmentRequest(chatId);
        this.bot.answerCallbackQuery(query.id);
      }
    });

    // Handle incoming messages (user translations)
    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text || '';
      const taskId = msg.message_id ?? -1;

      if (taskId === -1) {
        console.warn("⚠️ Missing save: no taskId!");
        return;
      }

      const userState = this.userStates[chatId];
      if (userState && userState.isWaitingForTranslation) {
        userState.isWaitingForTranslation = false;

        try {
          const analysis = await this.chatGptService.checkTranslation(userState.sentence, text);
          const [
            messageToStudent,
            correctedVersion,
            correctGrammar,
            incorrectGrammar,
            correctVocabulary,
            incorrectVocabulary
          ] = analysis.split('---');
          await this.bot.sendMessage(chatId, messageToStudent);

          this.translationRepository.saveTranslation(
            chatId,
            userState.sentence,
            text,
            correctedVersion,
            taskId
          );

          console.log(analysis);

          // Optional: Handle student progress logic here

          this.sendTaskButton(chatId);
        } catch (error) {
          console.error('Check result error:', error);
          this.bot.sendMessage(chatId, 'Check result error.');
          this.sendTaskButton(chatId);
        }
      }
    });

    console.log('Telegram bot has been started via Long Polling');
  }

  private async handleAssignmentRequest(chatId: number): Promise<void> {
    try {
      const sentence = await this.chatGptService.generateTranslationTask();

      if (!sentence) {
        this.bot.sendMessage(chatId, 'Assignment generation error.');
        return;
      }

      this.userStates[chatId] = { sentence, isWaitingForTranslation: true };
      this.bot.sendMessage(
        chatId,
        `Translate into German:\n\n"${sentence}"\n\n(Enter the translation below.)`
      );
    } catch (error) {
      console.error('Assignment generation error:', error);
      this.bot.sendMessage(chatId, 'Assignment generation error.');
    }
  }
}
