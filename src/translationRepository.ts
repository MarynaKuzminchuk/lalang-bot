import Database from 'better-sqlite3';

export class TranslationRepository {
  constructor(private db: Database.Database) {}

  public saveTranslation(
    studentId: number,
    original: string,
    userTranslation: string,
    correctedTranslation: string,
    taskId: number
  ): void {
    const existing = this.db.prepare("SELECT id FROM translations WHERE task_id = ?").get(taskId);
    if (existing) {
      console.warn(`⚠️ A record with task_id=${taskId} already exists!`);
      return;
    }

    const stmt = this.db.prepare(`
      INSERT INTO translations (student_id, original, user_translation, corrected_translation, task_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(studentId, original, userTranslation, correctedTranslation, taskId);
  }

  public getLastTranslations(studentId: number, limit: number = 3): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM translations WHERE student_id = ? ORDER BY created_at DESC LIMIT ?
    `);
    return stmt.all(studentId, limit);
  }

  public saveStudentProgress(
    studentId: number,
    type: "grammar" | "vocabulary",
    name: string,
    correct: boolean,
    taskId: number
  ): void {
    if (!studentId || !taskId) {
      console.error("❌ Error: studentId or taskId are empty!", { studentId, taskId });
      return;
    }

    const stmt = this.db.prepare(`
      INSERT INTO student_progress (student_id, type, name, correct, task_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(studentId, type, name, correct, taskId);
  }

  public getStudentProgress(studentId: number): Array<{
    count: number;
    correct_count: number;
    type: string;
    name: string;
  }> {
    const stmt = this.db.prepare(`
      SELECT type, name, COUNT(*) as count, SUM(correct) as correct_count 
      FROM student_progress 
      WHERE student_id = ? 
      GROUP BY type, name 
      ORDER BY count DESC
    `);
    return stmt.all(studentId) as Array<{
      count: number;
      correct_count: number;
      type: string;
      name: string;
    }>;
  }
}
