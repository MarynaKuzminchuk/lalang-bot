import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateTranslationTask(): Promise<string> {
  return await generateGPTRequest('Come up with and give me a sentence in Russian for further translation.');
}

export async function checkTranslation(original: string, userTranslation: string): Promise<string> {
  const prompt = `
  You are a German language teacher.  
  Your task is to check the translation from Russian to German.  
  If there are mistakes, explain them and suggest the correct version.  
  Provide the feedback in this format:
  
  Original (RU): "${original}"  
  User's Translation (DE): "${userTranslation}"  
  
  Translation analysis: ...  
  Corrected version (if needed): ...
  `;

  return await generateGPTRequest(prompt);
}

export async function generateGPTRequest(question: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    store: true,
    messages: [
      { role: 'user', content: question },
    ],
  });
  return completion.choices[0].message?.content || 'Error: failed to get a response.';
}
