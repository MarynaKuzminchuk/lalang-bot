import TelegramBot from 'node-telegram-bot-api';
import { TranslationRepository } from './translationRepository';
import { ChatGPTService } from './chatgptService';
import { TelegramBotClient } from './telegramBotClient';
import { ChatStateRepository } from './chatStateRepository';
import { TopicsRepository } from './topicsRepository';

export class TelegramBotController {

  constructor(
    private telegramBotClient: TelegramBotClient,
    private chatGptService: ChatGPTService,
    private translationRepository: TranslationRepository,
    private chatStateRepository: ChatStateRepository,
    private topicsRepository: TopicsRepository
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

    const chatState = this.chatStateRepository.getChatState(chatId);
    if (chatState && chatState.is_waiting_for_translation) {
      chatState.is_waiting_for_translation = false;

      try {
        const analysis = await this.chatGptService.checkTranslation(chatState.sentence, text);
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
          chatState.sentence,
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
        const topic = chatState.topic || 'default_topic';

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
      const grammarTopics = this.topicsRepository.getGrammarTopics("DE");
      const vocabularyTopics = this.topicsRepository.getVocabularyTopics("DE");
      const selectedGrammarTopic = grammarTopics[Math.floor(Math.random() * grammarTopics.length)];
      const selectedVocabularyTopic = vocabularyTopics[Math.floor(Math.random() * vocabularyTopics.length)];
      
      const sentence = await this.chatGptService.generateTranslationTask(selectedGrammarTopic, selectedVocabularyTopic);
      if (!sentence) {
        this.telegramBotClient.sendMessage(chatId, 'Assignment generation error.');
        return;
      }

      this.chatStateRepository.saveChatState({
        chat_id: chatId,
        sentence: sentence,
        topic: selectedGrammarTopic.topic,
        is_waiting_for_translation: true
      });
      this.telegramBotClient.sendMessage(
        chatId,
        `Translate into German (Topic: ${selectedGrammarTopic.topic}):\n\n"${sentence}"\n\n(Enter your translation below.)`
      );
    } catch (error) {
      console.error('Assignment generation error:', error);
      this.telegramBotClient.sendMessage(chatId, 'Assignment generation error.');
    }
  }
}
