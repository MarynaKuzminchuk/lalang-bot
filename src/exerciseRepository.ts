import Database from 'better-sqlite3';
import { Exercise } from './exerciseService';

export class ExerciseRepository {
  constructor(private db: Database.Database) {}

  public saveExercise(exercise: Omit<Exercise, "id">): Exercise {
    const exerciseId = this.db.prepare(`
        INSERT OR IGNORE INTO exercise (user_id, sentence, native_language, studied_language)
        VALUES (?, ?, ?, ?)
    `).run(exercise.user_id, exercise.sentence, exercise.native_language, exercise.studied_language).lastInsertRowid as number;
    for (const grammarTopic of exercise.grammar_topics) {
      this.db.prepare(`
        INSERT OR IGNORE INTO exercise_grammar (exercise_id, grammar_id)
        VALUES (?, ?)
      `).run(exerciseId, grammarTopic.id);
    }
    for (const vocabularyTopic of exercise.vocabulary_topics) {
      this.db.prepare(`
        INSERT OR IGNORE INTO exercise_vocabulary (exercise_id, vocabulary_id)
        VALUES (?, ?)
      `).run(exerciseId, vocabularyTopic.id);
    }
    return {
        ...exercise,
        id: exerciseId
    }
  }
}