import dotenv from 'dotenv';
import { TelegramBotController } from './telegramBotController';
import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';
import { ChatGPTService } from './chatgptService';
import Database from 'better-sqlite3';
import { TranslationRepository } from './translationRepository';
import { readFileSync } from 'fs';

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
const translationRepository = new TranslationRepository(db);

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
if (!telegramBotToken) {
  throw new Error('TELEGRAM_BOT_TOKEN is missing in .env');
}
const bot = new TelegramBot(telegramBotToken, { polling: true });
const telegramBotController = new TelegramBotController(bot, chatGptService, translationRepository);
