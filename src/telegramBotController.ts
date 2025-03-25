import TelegramBot from 'node-telegram-bot-api';
import { TranslationRepository } from './translationRepository';
import { ChatGPTService } from './chatgptService';
import { TelegramBotClient } from './telegramBotClient';

export class TelegramBotController {
  private userStates: Record<number, { sentence: string; topic?: string; isWaitingForTranslation: boolean }> = {};

  constructor(
    private telegramBotClient: TelegramBotClient,
    private chatGptService: ChatGPTService,
    private translationRepository: TranslationRepository
  ) {}

  // Handle /start command
  public start(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    this.telegramBotClient.sendMessage(chatId,
      'Welcome to Lalang, a chatbot for learning a foreign language.\n\n' +
        'You will be given tasks to translate and after you will get a breakdown of your answer.\n\nHave fun!'
    );
    this.telegramBotClient.sendTaskButton(chatId);
  }

  // Handle callback queries (e.g., button clicks)
  public async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    if (!query.data) return;
    const chatId = query.message?.chat.id;
    if (!chatId) return;

    if (query.data === 'give_task') {
      await this.handleAssignmentRequest(chatId);
      this.telegramBotClient.answerCallbackQuery(query);
    }
  }

  // Handle incoming messages (user translations)
  public async handleIncomingMessage(msg: TelegramBot.Message) {
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
        await this.telegramBotClient.sendMessage(chatId, messageToStudent);

        const translationId = this.translationRepository.saveTranslation(
          chatId,
          userState.sentence,
          text,
          correctedVersion,
          taskId
        );

        this.translationRepository.saveTranslationAnalysis(
          translationId,
          correctGrammar,
          incorrectGrammar,
          correctVocabulary,
          incorrectVocabulary
        );

        const grammarErrors = incorrectGrammar.trim() ? 1 : 0;
        const vocabularyErrors = incorrectVocabulary.trim() ? 1 : 0;
        const grammarSuccess = incorrectGrammar.trim() ? 0 : 1;
        const vocabularySuccess = incorrectVocabulary.trim() ? 0 : 1;

        const topic = userState.topic || 'default_topic';

        this.translationRepository.updateStudentTopicProgress(
          chatId,
          topic,
          grammarErrors,
          vocabularyErrors,
          grammarSuccess,
          vocabularySuccess
        );

          console.log(analysis);

          // Optional: Handle student progress logic here

        this.telegramBotClient.sendTaskButton(chatId);
      } catch (error) {
        console.error('Check result error:', error);
        this.telegramBotClient.sendMessage(chatId, 'Check result error.');
        this.telegramBotClient.sendTaskButton(chatId);
      }
    }
  }

  private async handleAssignmentRequest(chatId: number): Promise<void> {
    try {
      const sentence = await this.chatGptService.generateTranslationTask();

      if (!sentence) {
        this.telegramBotClient.sendMessage(chatId, 'Assignment generation error.');
        return;
      }

      this.userStates[chatId] = { sentence, topic: 'default_topic', isWaitingForTranslation: true };
      this.telegramBotClient.sendMessage(
        chatId,
        `Translate into German:\n\n"${sentence}"\n\n(Enter the translation below.)`
      );
    } catch (error) {
      console.error('Assignment generation error:', error);
      this.telegramBotClient.sendMessage(chatId, 'Assignment generation error.');
    }
  }
}
