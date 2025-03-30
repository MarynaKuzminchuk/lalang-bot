import Database from 'better-sqlite3';

export class TranslationRepository {
  constructor(private db: Database.Database) {}

  public saveTranslation(
    studentId: number,
    original: string,
    userTranslation: string,
    correctedTranslation: string,
    taskId: number
  ): number {
    const existing = this.db
      .prepare("SELECT id FROM translations WHERE task_id = ?")
      .get(taskId) as { id: number } | undefined;
    if (existing) {
      console.warn(`⚠️ A record with task_id=${taskId} already exists!`);
      return existing.id;
    }

    const stmt = this.db.prepare(`
      INSERT INTO translations (student_id, original, user_translation, corrected_translation, task_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(studentId, original, userTranslation, correctedTranslation, taskId);
    return info.lastInsertRowid as number;
  }

  public getLastTranslations(studentId: number, limit: number = 3): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM translations WHERE student_id = ? ORDER BY created_at DESC LIMIT ?
    `);
    return stmt.all(studentId, limit);
  }

  public getWeakTopics(studentId: number): Array<{ topic: string; total_success: number }> {
    const stmt = this.db.prepare(`
      SELECT topic, (grammar_success + vocabulary_success) as total_success
      FROM student_topic_progress
      WHERE student_id = ? AND (grammar_success + vocabulary_success) < 3
    `);
    return stmt.all(studentId) as Array<{ topic: string; total_success: number }>;
  }
  
  public getAttemptedTopics(studentId: number): string[] {
    const stmt = this.db.prepare(`SELECT topic FROM student_topic_progress WHERE student_id = ?`);
    const rows = stmt.all(studentId) as Array<{ topic: string }>;
    return rows.map(row => row.topic);
  }
  
  public saveTranslationAnalysis(
    translationId: number,
    correctGrammar: string,
    incorrectGrammar: string,
    correctVocabulary: string,
    incorrectVocabulary: string
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO translation_analysis (translation_id, correct_grammar, incorrect_grammar, correct_vocabulary, incorrect_vocabulary)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(translationId, correctGrammar, incorrectGrammar, correctVocabulary, incorrectVocabulary);
  }

  public updateStudentTopicProgress(
    studentId: number,
    topic: string,
    grammarErrors: number,
    vocabularyErrors: number,
    grammarSuccess: number,
    vocabularySuccess: number
  ): void {
    const existing = this.db.prepare(`
      SELECT id FROM student_topic_progress WHERE student_id = ? AND topic = ?
    `).get(studentId, topic) as { id: number } | undefined;

    if (existing) {
      const stmt = this.db.prepare(`
        UPDATE student_topic_progress
        SET grammar_errors = grammar_errors + ?,
            vocabulary_errors = vocabulary_errors + ?,
            grammar_success = grammar_success + ?,
            vocabulary_success = vocabulary_success + ?,
            last_attempted = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(grammarErrors, vocabularyErrors, grammarSuccess, vocabularySuccess, existing.id);
    } else {
      const stmt = this.db.prepare(`
        INSERT INTO student_topic_progress (student_id, topic, grammar_errors, vocabulary_errors, grammar_success, vocabulary_success)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(studentId, topic, grammarErrors, vocabularyErrors, grammarSuccess, vocabularySuccess);
    }
  }
}
