import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateGPTRequest() {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    store: true,
    messages: [
      { role: 'user', content: 'What is the weather in berlin today?' },
    ],
  });
  return completion.choices[0].message?.content;
}
