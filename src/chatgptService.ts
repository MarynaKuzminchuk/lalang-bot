import OpenAI from 'openai';
import { GrammarTopic, VocabularyTopic } from './topicsRepository';
import { Exercise } from './exerciseService';

export class ChatGPTService {

  constructor(private openai: OpenAI) {}

  public async generateSentence(nativeLanguage: string, studiedLanguage: string, selectedGrammarTopic: GrammarTopic, selectedVocabularyTopic: VocabularyTopic): Promise<string> {
    const prompt = `
      Please generate a sentence in ${nativeLanguage} that will be translated to ${studiedLanguage} 
      that focuses on the ${studiedLanguage} grammar topic "${selectedGrammarTopic.topic} of ${selectedGrammarTopic.level} level" 
      and vocabulary topic "${selectedVocabularyTopic.topic} of ${selectedVocabularyTopic.level} level".
      Just output the sentence directly.
    `.trim();
    return await this.generateGPTRequest(prompt);
  }

  public async checkTranslation(exercise: Exercise, translation: string): Promise<string> {
    const grammarTopics = exercise.grammar_topics.map(grammarTopic => grammarTopic.topic).join(",");
    const vocabularyTopics = exercise.vocabulary_topics.map(vocabularyTopic => vocabularyTopic.topic).join(",");
    const prompt = `
      You are a strict language teacher.
      Your task is to evaluate the translation.
      From ${exercise.native_language}: "${exercise.sentence}".
      To ${exercise.studied_language}: "${translation}".
      Specifically checking grammar topics: ${grammarTopics} and vocabulary topics: ${vocabularyTopics}.
      Return evaluation result in the following format.
      correct_translation="coorect translation of the given sentence from ${exercise.native_language} to ${exercise.studied_language}"
      grammar_grades=[("grammar topic",grade from 1 to 5)]
      vocabulary_grades=[("vocabulary topic",grade from 1 to 5)]
      explanation="use this text to explain the ${exercise.native_language} speaker in his language what are the mistakes"
    `;
    console.log(prompt);
    return await this.generateGPTRequest(prompt);
  }

  private async generateGPTRequest(question: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      store: true,
      messages: [{ role: 'user', content: question }],
    });
    return completion.choices[0].message?.content || 'Error: failed to get a response.';
  }
}
