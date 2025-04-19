import TelegramBot from 'node-telegram-bot-api';
import { TelegramBotClient } from './telegramBotClient';
import { ChatStateRepository } from './chatStateRepository';
import { ExerciseService } from './exerciseService';
import { User, UserRepository } from './userRepository';

const WELCOME_MESSAGE = 'Добро пожаловать в чат для изучения иностранных языков!';
const CHOOSE_STUDIED_LANGUAGE_MESSAGE = 'Какой язык вас интересует?';
const CHOOSE_LANGUAGE_LEVEL = 'На каком уровне хотите попрактиковаться?';
const FIRST_EXERCISE = 'Я буду предлагать вам предложения для перевода. Как только отправите перевод, я оценю его и помогу разобраться в ошибках.';

export class TelegramBotController {
  constructor(
    private telegramBotClient: TelegramBotClient,
    private userRepository: UserRepository,
    private chatStateRepository: ChatStateRepository,
    private exerciseService: ExerciseService
  ) { }

  // Handle /start command
  public start(msg: TelegramBot.Message) {
    console.log("Received start");
    const username = msg.chat.username ?? `${msg.chat.first_name}_${msg.chat.last_name}` ?? `${msg.chat.id}`;
    if (username === undefined) {
      return;
    }
    const user = this.userRepository.getUser(username);
    const chatId = msg.chat.id;
    if (user === undefined) {
      console.log("Create new user");
      this.userRepository.saveUser({ username, native_language: "Russian" });
      this.telegramBotClient.sendMessageWithOptions(chatId, `${WELCOME_MESSAGE}\n${CHOOSE_STUDIED_LANGUAGE_MESSAGE}`, [
        { text: 'Английский', callback_data: JSON.stringify({studied_language: "English"}) },
        { text: 'Немецкий', callback_data: JSON.stringify({studied_language: "German"}) },
        { text: 'Голландский', callback_data: JSON.stringify({studied_language: "Dutch"}) }
      ]);
    } else {
      console.log("Interact with existing user");
      this.telegramBotClient.sendMessageWithOptions(chatId, `С возвращеньем!`, [
        { text: 'Получить задание', callback_data: JSON.stringify({request_exercise: true}) }
      ]);
    }
  }

  public selectStudiedLanguage(chatId: number) {
    this.telegramBotClient.sendMessageWithOptions(chatId, CHOOSE_STUDIED_LANGUAGE_MESSAGE, [
      { text: 'Английский', callback_data: JSON.stringify({studied_language: "English"}) },
      { text: 'Немецкий', callback_data: JSON.stringify({studied_language: "German"}) },
      { text: 'Голландский', callback_data: JSON.stringify({studied_language: "Dutch"}) }
    ]);
  }

  public selectLanguageLevel(chatId: number) {
    this.telegramBotClient.sendMessageWithOptions(chatId, CHOOSE_LANGUAGE_LEVEL, [
      { text: 'A1.1', callback_data: JSON.stringify({level_number: 1}) },
      { text: 'A1.2', callback_data: JSON.stringify({level_number: 2}) },
      { text: 'A2.1', callback_data: JSON.stringify({level_number: 3}) },
      { text: 'A2.2', callback_data: JSON.stringify({level_number: 4}) },
      { text: 'B1.1', callback_data: JSON.stringify({level_number: 5}) },
      { text: 'B1.2', callback_data: JSON.stringify({level_number: 6}) },
      { text: 'B2.1', callback_data: JSON.stringify({level_number: 7}) },
      { text: 'B2.2', callback_data: JSON.stringify({level_number: 8}) },
      { text: 'C1.1', callback_data: JSON.stringify({level_number: 9}) },
      { text: 'C1.2', callback_data: JSON.stringify({level_number: 10}) },
      { text: 'C2.1', callback_data: JSON.stringify({level_number: 11}) },
      { text: 'C2.2', callback_data: JSON.stringify({level_number: 12}) },
    ]);
  }

  // Handle callback queries (e.g., button clicks)
  public async handleCallbackQuery(query: TelegramBot.CallbackQuery) {
    const chatId = query.message?.chat.id;
    const username = query.message?.chat.username ?? `${query.message?.chat.first_name}_${query.message?.chat.last_name}` ?? `${query.message?.chat.id}`;
    if (!chatId || !username || !query.data) return;
    const queryData = JSON.parse(query.data);
    const user = this.userRepository.getUser(username);
    if (!user) return;
    if (queryData.studied_language) {
      this.userRepository.saveUser({...user, studied_language: queryData.studied_language});
      this.selectLanguageLevel(chatId);
    } else if (queryData.level_number) {
      const previousLevelNumber = user.level_number;
      this.userRepository.saveUser({...user, level_number: queryData.level_number});
      if (previousLevelNumber) {
        this.handleExerciseRequest(user, chatId);
      } else {
        this.telegramBotClient.sendMessageWithOptions(chatId, FIRST_EXERCISE, [
          { text: 'Получить первое задание', callback_data: JSON.stringify({request_exercise: true}) }
        ]);
      }
    } else if (queryData.request_exercise) {
      await this.handleExerciseRequest(user, chatId);
      this.telegramBotClient.answerCallbackQuery(query);
    }
  }

  private async handleExerciseRequest(user: User, chatId: number): Promise<void> {
    const exercise = await this.exerciseService.createExercise(user);
    this.chatStateRepository.saveChatState({
      chat_id: chatId,
      exercise_id: exercise.id
    });
    this.telegramBotClient.sendMessageWithOptions(chatId, `${exercise.sentence}`, [
      { text: 'Хочу другое задание', callback_data: JSON.stringify({request_exercise: true}) }
    ]);
  }

  // Handle incoming messages (user translations)
  public async handleIncomingMessage(msg: TelegramBot.Message) {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text || text.startsWith("/")) return;
    const chatState = this.chatStateRepository.getChatState(chatId);
    if (chatState && chatState.exercise_id) {
      const evaluation = await this.exerciseService.evaluateExercise(chatState.exercise_id, text);
      this.chatStateRepository.saveChatState({
        ...chatState,
        exercise_id: undefined
      });
      await this.telegramBotClient.sendMessageWithOptions(chatId, `Правильный перевод: ${evaluation.correct_translation}\n\nРазбор: ${evaluation.explanation}\n\nГрамматика: ${evaluation.graded_grammar_topics[0].grade}/5\nСловарный запас: ${evaluation.graded_vocabulary_topics[0].grade}/5`, [
        { text: 'Следующее задание', callback_data: JSON.stringify({request_exercise: true}) }
      ]);
    }
  }
}
