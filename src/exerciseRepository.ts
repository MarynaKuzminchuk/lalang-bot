import Database from 'better-sqlite3';
import { Exercise } from './exerciseService';
import { GrammarTopic, VocabularyTopic } from './topicsRepository';

export class ExerciseRepository {
  constructor(private db: Database.Database) {}

  public saveExercise(exercise: Omit<Exercise, "id">): Exercise {
    const exerciseId = this.db.prepare(`
        INSERT INTO exercise (user_id, sentence, native_language, studied_language)
        VALUES (?, ?, ?, ?)
    `).run(exercise.user_id, exercise.sentence, exercise.native_language, exercise.studied_language).lastInsertRowid as number;
    for (const grammarTopic of exercise.grammar_topics) {
      this.db.prepare(`
        INSERT INTO exercise_grammar (exercise_id, grammar_id)
        VALUES (?, ?)
      `).run(exerciseId, grammarTopic.id);
    }
    for (const vocabularyTopic of exercise.vocabulary_topics) {
      this.db.prepare(`
        INSERT INTO exercise_vocabulary (exercise_id, vocabulary_id)
        VALUES (?, ?)
      `).run(exerciseId, vocabularyTopic.id);
    }
    return {
        ...exercise,
        id: exerciseId
    }
  }

  public getExercise(exerciseId: number): Exercise {
    const partialExercise = this.db.prepare(`
      SELECT e.id, e.user_id, e.native_language, e.studied_language, e.sentence, e.translation
      FROM exercise e
      WHERE e.id = ?
    `).get(exerciseId) as Omit<Exercise, "grammar_topics" | "vocabulary_topics">;

    const grammarTopics = this.db.prepare(`
      SELECT g.id, g.language, g.topic, g.level, g.level_number
        FROM grammar g
        JOIN exercise_grammar eg ON eg.grammar_id = g.id
        WHERE eg.exercise_id = ?
    `).get(exerciseId) as GrammarTopic[];

    const vocabularyTopics = this.db.prepare(`
      SELECT v.id, v.language, v.topic, v.level, v.level_number
        FROM vocabulary v
        JOIN exercise_vocabulary ev ON ev.vocabulary_id = v.id
        WHERE ev.exercise_id = ?
    `).get(exerciseId) as VocabularyTopic[];

    return {
      ...partialExercise,
      grammar_topics: grammarTopics,
      vocabulary_topics: vocabularyTopics
    }
  }

  public updateExercise(exercise: Pick<Exercise, "id" | "translation">) {
    this.db.prepare(`
      UPDATE exercise
      SET translation = ?
      WHERE id = ?`).run(exercise.translation, exercise.id);
  }
}