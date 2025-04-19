import TelegramBot from 'node-telegram-bot-api';
import { TelegramBotClient } from './telegramBotClient';
import { ChatStateRepository } from './chatStateRepository';
import { ExerciseService } from './exerciseService';

export class TelegramBotController {

  constructor(
    private telegramBotClient: TelegramBotClient,
    private chatStateRepository: ChatStateRepository,
    private exerciseService: ExerciseService
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
      await this.handleExerciseRequest(chatId);
      this.telegramBotClient.answerCallbackQuery(query);
    }
  }

  private async handleExerciseRequest(chatId: number): Promise<void> {
    const exercise = await this.exerciseService.createExercise(chatId);
    this.chatStateRepository.saveChatState({
      chat_id: chatId,
      exercise_id: exercise.id
    });
    this.telegramBotClient.sendMessage(
      chatId,
      `Translate to ${exercise.studied_language}: ${exercise.sentence}`
    );
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

    const chatState = this.chatStateRepository.getChatState(chatId);
    if (chatState && chatState.exercise_id) {
      const evaluation = await this.exerciseService.evaluateExercise(chatState.exercise_id, text);
      this.chatStateRepository.saveChatState({
        ...chatState,
        exercise_id: undefined
      });
      await this.telegramBotClient.sendMessage(chatId, `Correct translation: ${evaluation.correct_translation}\nExplanation: ${evaluation.explanation}`);
      this.telegramBotClient.sendTaskButton(chatId);
    }
  }
}
