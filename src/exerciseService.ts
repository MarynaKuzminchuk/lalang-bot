import { ChatGPTService } from "./chatgptService";
import { ExerciseRepository } from "./exerciseRepository";
import { Topic } from "./topicsRepository";
import { User } from "./userRepository";

export class ExerciseService {

  constructor(
    private chatGptService: ChatGPTService,
    private exerciseRepository: ExerciseRepository
  ) { }

  public async createExercise(user: User): Promise<Exercise> {
    const nativeLanguage = user.native_language ?? "Russian";
    const studiedLanguage = user.studied_language ?? "German";
    const levelNumber = user.level_number ?? 1;
    const grammarTopics = this.exerciseRepository.getGradedGrammarTopics(user.id, studiedLanguage, levelNumber);
    const vocabularyTopics = this.exerciseRepository.getGradedVocabularyTopics(user.id, studiedLanguage, levelNumber);
    const selectedGrammarTopic = this.chooseTopic(grammarTopics);
    const selectedVocabularyTopic = this.chooseTopic(vocabularyTopics);
    const sentence = await this.chatGptService.generateSentence(
      nativeLanguage, studiedLanguage, selectedGrammarTopic, selectedVocabularyTopic
    );
    return this.exerciseRepository.saveExercise({
      user_id: user.id,
      native_language: nativeLanguage,
      studied_language: studiedLanguage,
      sentence: sentence,
      grammar_topics: [selectedGrammarTopic],
      vocabulary_topics: [selectedVocabularyTopic]
    });
  }

  private chooseTopic(topics: TopicWithGrades[]): TopicWithGrades {
    const base = 100 / topics.length;
  
    const weights = topics.map(({ grades }) => {
      let score = base;
      for (const grade of grades) {
        score += grade >= 4 ? 1 : -1;
      }
      return Math.max(1, score);
    });
  
    const total = weights.reduce((s, x) => s + x, 0);
    let r = Math.random() * total;
    for (let i = 0; i < topics.length; i++) {
      r -= weights[i];
      if (r < 0) return topics[i];
    }
    return topics[topics.length - 1];
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

export interface GradedTopic extends Topic {
  grade?: number;
}

export interface TopicWithGrades extends Topic {
  grades: number[];
}
