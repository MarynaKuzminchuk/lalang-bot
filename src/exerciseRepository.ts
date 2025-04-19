import Database from 'better-sqlite3';
import { Exercise } from './exerciseService';
import { Topic } from './topicsRepository';

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
      SELECT g.id, g.language, g.name, g.level, g.level_number
        FROM grammar g
        JOIN exercise_grammar eg ON eg.grammar_id = g.id
        WHERE eg.exercise_id = ?
    `).all(exerciseId) as GradedTopic[];

    const vocabularyTopics = this.db.prepare(`
      SELECT v.id, v.language, v.name, v.level, v.level_number
        FROM vocabulary v
        JOIN exercise_vocabulary ev ON ev.vocabulary_id = v.id
        WHERE ev.exercise_id = ?
    `).all(exerciseId) as GradedTopic[];

    return {
      ...partialExercise,
      grammar_topics: grammarTopics,
      vocabulary_topics: vocabularyTopics
    }
  }

  public updateExercise(exercise: Pick<Exercise, "id" | "translation" | "correct_translation" | "grammar_topics" | "vocabulary_topics">) {
    this.db.prepare(`
      UPDATE exercise
      SET translation = ?, correct_translation = ?
      WHERE id = ?
    `).run(exercise.translation, exercise.correct_translation, exercise.id);

      if (exercise.grammar_topics) {
        exercise.grammar_topics.forEach((grammarTopic) => {
          this.db.prepare(`
            UPDATE exercise_grammar
            SET grade = ?
            WHERE exercise_id = ? AND grammar_id = ?
          `).run(grammarTopic.grade, exercise.id, grammarTopic.id);
        });
    }

    if (exercise.vocabulary_topics) {
        exercise.vocabulary_topics.forEach((vocabularyTopic) => {
          this.db.prepare(`
            UPDATE exercise_vocabulary
            SET grade = ?
            WHERE exercise_id = ? AND vocabulary_id = ?
          `).run(vocabularyTopic.grade, exercise.id, vocabularyTopic.id);
        });
    }
  }
}

export interface GradedTopic extends Topic {
  grade?: number;
}
