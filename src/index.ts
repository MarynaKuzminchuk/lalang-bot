import express from 'express';
import dotenv from 'dotenv';
import { initTelegramBot } from './bot';
import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';
import { ChatGPTService } from './chatgptService';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is missing in .env');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const chatGptService = new ChatGPTService(openai);

const bot = new TelegramBot(token, { polling: true });
initTelegramBot(bot, chatGptService);
