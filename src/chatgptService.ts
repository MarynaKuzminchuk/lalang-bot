import OpenAI from "openai";
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const GRAMMAR_DE = `Großschreibung der Substantive, Grammatisches Geschlecht (Genus), 
Nominativ, Akkusativ, Dativ, Genitiv, Schwache Maskulina (N-Deklination), Pluralbildung, 
Bestimmter Artikel, Unbestimmter Artikel, Negativartikel (kein), Starke Adjektivdeklination, 
Gemischte Adjektivdeklination, Schwache Adjektivdeklination, Komparativ und Superlativ, 
Personalpronomen, Possessivpronomen, Reflexivpronomen, Relativpronomen, Demonstrativpronomen, 
Interrogativpronomen, Indefinitpronomen, Präsens, Präteritum (Imperfekt), Perfekt, 
Plusquamperfekt, Futur I, Futur II, Konjunktiv I, Konjunktiv II, Imperativ, Passiv, 
Regelmäßige Verben (schwache Verben), Unregelmäßige Verben (starke Verben), Gemischte Verben, 
Modalverben, Trennbare Verben, Untrennbare Verben, Reflexive Verben, Akkusativpräpositionen, 
Dativpräpositionen, Genitivpräpositionen, Wechselpräpositionen, Koordinierende Konjunktionen, 
Subordinierende Konjunktionen, Aussagesätze, Entscheidungsfragen (Ja/Nein-Fragen), W-Fragen, 
Imperativsätze, Nebensätze, Relativsätze, Indirekte Fragen, Satzstellung im Hauptsatz 
(Verbzweitstellung), Satzstellung im Nebensatz (Verbletztstellung), Inversion, 
Zeit–Art–Ort (Adverbialordnung), Stellung von „nicht“, Stellung von trennbaren Präfixen.`;

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
  ---
  // Here write correctly translated sentence
  ---
  // Given a list of all grammar rules ${GRAMMAR_DE}
  // Here write a comma-separated list of correctly used grammar rules
  ---
  // And here write a comma-separated list of incorrectly used grammar rules from the same list as above
  ---
  // Comma-separated list of correctly translated words
  ---
  // Comma-separated list of incorrectly translated words
  `;

  console.log(prompt);
  
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
