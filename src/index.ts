import express from 'express';
import dotenv from 'dotenv';
import { generateGPTRequest } from './chatgptService';
import { initTelegramBot } from './bot';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

initTelegramBot();

app.get('/', async (req, res) => {
  try {
    const answer = await generateGPTRequest('What is the weather in Berlin today?');
    res.send(answer || 'No response from GPT');
  } catch (error) {
    console.error('ChatGPT API request error:', error);
    res.status(500).send('ChatGPT API response error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
