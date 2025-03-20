import express from 'express';
import dotenv from 'dotenv';
import { generateGPTRequest } from './chatgptService';
import { initTelegramBot } from './bot';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is missing in .env');
}

const bot = new TelegramBot(token, { polling: true });

initTelegramBot(bot);
