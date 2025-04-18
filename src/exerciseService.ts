import { ChatGPTService } from "./chatgptService";
import { ExerciseRepository } from "./exerciseRepository";
import { GrammarTopic, TopicsRepository, VocabularyTopic } from "./topicsRepository";

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

  public async evaluateExercise(exerciseId: number, translation: string): Promise<string> {
    const exercise = this.exerciseRepository.getExercise(exerciseId);
    this.exerciseRepository.updateExercise({
      id: exercise.id,
      translation: translation
    });
    return this.chatGptService.checkTranslation(exercise.sentence, translation);
  }
}

export interface Exercise {
  id: number;
  user_id: number;
  native_language: string;
  studied_language: string;
  sentence: string;
  translation?: string;
  grammar_topics: GrammarTopic[];
  vocabulary_topics: VocabularyTopic[];
}
