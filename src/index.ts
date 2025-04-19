import dotenv from 'dotenv';
import { TelegramBotController } from './telegramBotController';
import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';
import { ChatGPTService } from './chatgptService';
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { TelegramBotClient } from './telegramBotClient';
import { ChatStateRepository } from './chatStateRepository';
import { Topic, TopicsRepository, TopicType } from './topicsRepository';
import { ExerciseRepository } from './exerciseRepository';
import { ExerciseService } from './exerciseService';
import { UserRepository } from './userRepository';

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

const userRepository = new UserRepository(db);
const topicsRepository = new TopicsRepository(db);
const grammarJsonData = readFileSync('db/data/grammar.json', 'utf-8');
const grammarTopics = (JSON.parse(grammarJsonData) as Topic[]).map(topic => {return {...topic, type: TopicType.GRAMMAR}});
topicsRepository.saveTopics(grammarTopics);
const vocabularyJsonData = readFileSync('db/data/vocabulary.json', 'utf-8');
const vocabularyTopics = (JSON.parse(vocabularyJsonData) as Topic[]).map(topic => {return {...topic, type: TopicType.VOCABULARY}});;
topicsRepository.saveTopics(vocabularyTopics);

const chatStateRepository = new ChatStateRepository(db);
const exerciseRepository = new ExerciseRepository(db);

const exerciseService = new ExerciseService(chatGptService, exerciseRepository);

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
if (!telegramBotToken) {
  throw new Error('TELEGRAM_BOT_TOKEN is missing in .env');
}
const bot = new TelegramBot(telegramBotToken, { polling: true });
const telegramBotClient = new TelegramBotClient(bot);

const telegramBotController = new TelegramBotController(telegramBotClient, userRepository, chatStateRepository, exerciseService);
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

userRepository.saveUser({username: "test"});
const user = userRepository.getUser("test");
if (user) {
  exerciseService.createExercise(user).then(result => {
    console.log(JSON.stringify(result));
    exerciseService.evaluateExercise(result.id, "bla").then(evaluationResult => {
      console.log(evaluationResult);
    })
  });
}
