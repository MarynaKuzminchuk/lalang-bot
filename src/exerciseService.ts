import { ChatGPTService } from "./chatgptService";
import { ExerciseRepository, GradedTopic } from "./exerciseRepository";
import { TopicsRepository } from "./topicsRepository";

export class ExerciseService {

  constructor(
    private chatGptService: ChatGPTService,
    private topicsRepository: TopicsRepository,
    private exerciseRepository: ExerciseRepository
  ) {}

  public async createExercise(userId: number): Promise<Exercise> {
    const nativeLanguage = "Russian";
    const studiedLanguage = "German";
    const levelNumber = 6;
    const grammarTopics = this.topicsRepository.getGrammarTopics(studiedLanguage, levelNumber);
    const vocabularyTopics = this.topicsRepository.getVocabularyTopics(studiedLanguage, levelNumber);
    const selectedGrammarTopic = grammarTopics[Math.floor(Math.random() * grammarTopics.length)];
    const selectedVocabularyTopic = vocabularyTopics[Math.floor(Math.random() * vocabularyTopics.length)];
    const sentence = await this.chatGptService.generateSentence(
      nativeLanguage, studiedLanguage, selectedGrammarTopic, selectedVocabularyTopic
    );
    return this.exerciseRepository.saveExercise({
      user_id: userId,
      native_language: nativeLanguage,
      studied_language: studiedLanguage,
      sentence: sentence,
      grammar_topics: [selectedGrammarTopic],
      vocabulary_topics: [selectedVocabularyTopic]
    });
  }

  public async evaluateExercise(exerciseId: number, translation: string): Promise<Evaluation> {
    const exercise = this.exerciseRepository.getExercise(exerciseId);
    console.log(JSON.stringify(exercise));
    const check = await this.chatGptService.checkTranslation(exercise, translation);
    const parsedCheck = JSON.parse(check);
    const gradedGrammarTopics = exercise.grammar_topics.map(grammarTopic => {
      return {
        ...grammarTopic,
        grade: parsedCheck.grammar_grades[grammarTopic.name]
      }
    });
    const gradedVocabularyTopics = exercise.vocabulary_topics.map(vocabularyTopic => {
      return {
        ...vocabularyTopic,
        grade: parsedCheck.vocabulary_grades[vocabularyTopic.name]
      }
    });
    this.exerciseRepository.updateExercise({
      id: exercise.id,
      translation: translation,
      correct_translation: parsedCheck.correct_translation,
      grammar_topics: gradedGrammarTopics,
      vocabulary_topics: gradedVocabularyTopics
    });
    return {
      correct_translation: parsedCheck.correct_translation,
      explanation: parsedCheck.explanation,
      graded_grammar_topics: gradedGrammarTopics,
      graded_vocabulary_topics: gradedVocabularyTopics
    };
  }
}

export interface Exercise {
  id: number;
  user_id: number;
  native_language: string;
  studied_language: string;
  sentence: string;
  translation?: string;
  correct_translation?: string;
  grammar_topics: GradedTopic[];
  vocabulary_topics: GradedTopic[];
}

export interface Evaluation {
  correct_translation: string,
  explanation: string,
  graded_grammar_topics: GradedTopic[],
  graded_vocabulary_topics: GradedTopic[]
}
