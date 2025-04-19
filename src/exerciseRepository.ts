import Database from 'better-sqlite3';
import { Exercise, GradedTopic, TopicWithGrades } from './exerciseService';
import { Topic } from './topicsRepository';

export class ExerciseRepository {
  constructor(private db: Database.Database) { }

  public saveExercise(exercise: Omit<Exercise, "id">): Exercise {
    const exerciseId = this.db.prepare(`
      INSERT INTO exercise (user_id, sentence, native_language, studied_language)
      VALUES (?, ?, ?, ?)
    `).run(exercise.user_id, exercise.sentence, exercise.native_language, exercise.studied_language).lastInsertRowid as number;
    for (const grammarTopic of exercise.grammar_topics) {
      this.db.prepare(`
        INSERT INTO exercise_topic (exercise_id, topic_id)
        VALUES (?, ?)
      `).run(exerciseId, grammarTopic.id);
    }
    for (const vocabularyTopic of exercise.vocabulary_topics) {
      this.db.prepare(`
        INSERT INTO exercise_topic (exercise_id, topic_id)
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
      SELECT t.id, t.type, t.language, t.name, t.level, t.level_number
      FROM topic t
      JOIN exercise_topic et ON et.topic_id = t.id
      WHERE et.exercise_id = ? AND t.type = 'grammar'
    `).all(exerciseId) as GradedTopic[];

    const vocabularyTopics = this.db.prepare(`
      SELECT t.id, t.type, t.language, t.name, t.level, t.level_number
      FROM topic t
      JOIN exercise_topic et ON et.topic_id = t.id
      WHERE et.exercise_id = ? AND t.type = 'vocabulary'
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
          UPDATE exercise_topic
          SET grade = ?
          WHERE exercise_id = ? AND topic_id = ?
        `).run(grammarTopic.grade, exercise.id, grammarTopic.id);
      });
    }

    if (exercise.vocabulary_topics) {
      exercise.vocabulary_topics.forEach((vocabularyTopic) => {
        this.db.prepare(`
          UPDATE exercise_topic
          SET grade = ?
          WHERE exercise_id = ? AND topic_id = ?
        `).run(vocabularyTopic.grade, exercise.id, vocabularyTopic.id);
      });
    }
  }

  public getGradedGrammarTopics(userId: number, language: string, levelNumber: number): TopicWithGrades[] {
    const topics = this.db.prepare(`
      SELECT id, type, language, name, level, level_number
      FROM topic
      WHERE language = ? AND level_number = ? AND type = 'grammar'
    `).all(language, levelNumber) as Topic[];
    const grades = this.db.prepare(`
      SELECT e.id, et.grade
      FROM exercise e
      JOIN exercise_topic et ON et.exercise_id = e.id
      WHERE e.user_id = ?
    `).all(userId) as TopicGrade[];
    const gradeMap = new Map<number, number[]>();
    for (const { id, grade } of grades) {
      const list = gradeMap.get(id) ?? [];
      list.push(grade);
      gradeMap.set(id, list);
    }
    return topics.map(topic => {
      return {
        ...topic,
        grades: gradeMap.get(topic.id) ?? []
      }
    });
  }

  public getGradedVocabularyTopics(userId: number, language: string, levelNumber: number): TopicWithGrades[] {
    const topics = this.db.prepare(`
      SELECT id, type, language, name, level, level_number
      FROM topic
      WHERE language = ? AND level_number = ? AND type = 'vocabulary'
    `).all(language, levelNumber) as Topic[];
    const grades = this.db.prepare(`
      SELECT e.id, et.grade
      FROM exercise e
      JOIN exercise_topic et ON et.exercise_id = e.id
      WHERE e.user_id = ?
    `).all(userId) as TopicGrade[];
    const gradeMap = new Map<number, number[]>();
    for (const { id, grade } of grades) {
      const list = gradeMap.get(id) ?? [];
      list.push(grade);
      gradeMap.set(id, list);
    }
    return topics.map(topic => {
      return {
        ...topic,
        grades: gradeMap.get(topic.id) ?? []
      }
    });
  }
}

interface TopicGrade {
  id: number;
  grade: number;
}
