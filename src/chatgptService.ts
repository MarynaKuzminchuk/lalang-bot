import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateTranslationTask(): Promise<string> {
  return await generateGPTRequest('Come up with and give me a sentence on any topic in Russian for further translation. Just output the sentence directly.');
}

export async function checkTranslation(original: string, userTranslation: string): Promise<string> {
  const prompt = `
  You are a German language teacher.  
  Your task is to check the translation from Russian to German.  
  If there are mistakes, explain them in Russian and suggest the correct version.  
  Original: "${original}" - take this for analysis, but do not display this field
  User's Translation: "${userTranslation}" - take this for analysis, but do not display this field

  Provide the feedback in this format:
  
  Corrected version: ...

  Translation analysis: ...  
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
