import Database from 'better-sqlite3';
import { Exercise, GradedTopic, Topic, TopicType, TopicWithGrades } from './exerciseService';

export class ExerciseRepository {
  constructor(private db: Database.Database) { }

  public saveExercise(exercise: Omit<Exercise, "id">): Exercise {
    const exerciseId = this.db.prepare(`
      INSERT INTO exercise (user_id, sentence, native_language, studied_language)
      VALUES (?, ?, ?, ?)
    `).run(exercise.user_id, exercise.sentence, exercise.native_language, exercise.studied_language).lastInsertRowid as number;

    for (const topic of [...exercise.grammar_topics, ...exercise.vocabulary_topics]) {
      this.db.prepare(`
        INSERT INTO exercise_topic (exercise_id, topic_id)
        VALUES (?, ?)
      `).run(exerciseId, topic.id);
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

    const gradedTopics = this.db.prepare(`
      SELECT t.id, t.type, t.language, t.name, t.level, t.level_number
      FROM topic t
      JOIN exercise_topic et ON et.topic_id = t.id
      WHERE et.exercise_id = ?
    `).all(exerciseId) as GradedTopic[];

    return {
      ...partialExercise,
      grammar_topics: gradedTopics.filter(topic => topic.type === TopicType.GRAMMAR),
      vocabulary_topics: gradedTopics.filter(topic => topic.type === TopicType.VOCABULARY)
    }
  }

  public updateExercise(exercise: Pick<Exercise, "id" | "translation" | "correct_translation" | "grammar_topics" | "vocabulary_topics">) {
    this.db.prepare(`
      UPDATE exercise
      SET translation = ?, correct_translation = ?
      WHERE id = ?
    `).run(exercise.translation, exercise.correct_translation, exercise.id);

    for (const topic of [...exercise.grammar_topics, ...exercise.vocabulary_topics]) {
      this.db.prepare(`
        UPDATE exercise_topic
        SET grade = ?
        WHERE exercise_id = ? AND topic_id = ?
      `).run(topic.grade, exercise.id, topic.id);
    }
  }

  public getGradedTopics(userId: number, language: string, levelNumber: number): TopicWithGrades[] {
    const topics = this.db.prepare(`
      SELECT id, type, language, name, level, level_number
      FROM topic
      WHERE language = ? AND level_number = ?
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

  public saveTopics(topics: Omit<Topic, "id">[]): void {
    const insertGrammarStmt = this.db.prepare(`
      INSERT OR IGNORE INTO topic (type, language, name, level, level_number)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const topic of topics) {
      insertGrammarStmt.run(topic.type, topic.language, topic.name, topic.level, topic.level_number);
    }
  }
}

interface TopicGrade {
  id: number;
  grade: number;
}
