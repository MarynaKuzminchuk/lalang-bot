import dotenv from 'dotenv';
import { TelegramBotController } from './telegramBotController';
import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';
import { ChatGPTService } from './chatgptService';
import Database from 'better-sqlite3';
import { TranslationRepository } from './translationRepository';
import { readFileSync } from 'fs';
import { TelegramBotClient } from './telegramBotClient';
import { ChatStateRepository } from './chatStateRepository';
import { GrammarTopic, TopicsRepository, VocabularyTopic } from './topicsRepository';
import { ExerciseRepository } from './exerciseRepository';
import { ExerciseService } from './exerciseService';

dotenv.config();

const openAiApiKey = process.env.OPENAI_API_KEY;
if (!openAiApiKey) {
  throw new Error('OPENAI_API_KEY is missing in .env');
}
const openai = new OpenAI({
  apiKey: openAiApiKey,
});
const chatGptService = new ChatGPTService(openai);

const db = new Database('database.sqlite');
const createDbSchemaScript = readFileSync('db/lalang.db.sql', 'utf-8');
db.exec(createDbSchemaScript);

const topicsRepository = new TopicsRepository(db);
const grammarJsonData = readFileSync('db/grammar.json', 'utf-8');
const grammarTopics = JSON.parse(grammarJsonData) as GrammarTopic[];
topicsRepository.saveGrammarTopics(grammarTopics);
const vocabularyJsonData = readFileSync('db/vocabulary.json', 'utf-8');
const vocabularyTopics = JSON.parse(vocabularyJsonData) as VocabularyTopic[];
topicsRepository.saveVocabularyTopics(vocabularyTopics);

const translationRepository = new TranslationRepository(db);
const chatStateRepository = new ChatStateRepository(db);
const exerciseRepository = new ExerciseRepository(db);

const exerciseService = new ExerciseService(chatGptService, topicsRepository, exerciseRepository);

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
if (!telegramBotToken) {
  throw new Error('TELEGRAM_BOT_TOKEN is missing in .env');
}
const bot = new TelegramBot(telegramBotToken, { polling: true });
const telegramBotClient = new TelegramBotClient(bot);

const telegramBotController = new TelegramBotController(telegramBotClient, chatGptService, translationRepository, chatStateRepository, topicsRepository, exerciseService);
bot.onText(/\/start/, (msg) => {
  telegramBotController.start(msg);
});
bot.on('callback_query', async (query) => {
  telegramBotController.handleCallbackQuery(query);
});
bot.on('message', async (msg) => {
  telegramBotController.handleIncomingMessage(msg);
});
console.log('Telegram bot has been started via Long Polling');

exerciseService.createExercise(1).then(result => {
  console.log(JSON.stringify(result));
});
