import express from 'express';
import dotenv from 'dotenv';
import { generateGPTRequest } from './chatgptService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    const answer = await generateGPTRequest();
    res.send(answer || 'No response from ChatGPT API');
  } catch (error) {
    console.error('ChatGPT API request error:', error);
    res.status(500).send('ChatGPT API responce error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
