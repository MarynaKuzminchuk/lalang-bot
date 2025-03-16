import Database from 'better-sqlite3';

const db = new Database('database.sqlite');

db.exec(`
  CREATE TABLE IF NOT EXISTS translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    original TEXT NOT NULL,
    user_translation TEXT NOT NULL,
    corrected_translation TEXT NOT NULL,
    task_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS student_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK (type IN ('grammar', 'vocabulary')) NOT NULL,
    name TEXT NOT NULL,
    correct BOOLEAN NOT NULL,
    student_id INTEGER NOT NULL,
    task_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

export function saveTranslation(
  studentId: number, original: string, userTranslation: string,
  correctedTranslation: string, taskId: number
) {
  const existing = db.prepare("SELECT id FROM translations WHERE task_id = ?").get(taskId);
  if (existing) {
    console.warn(`⚠️ A record with task_id=${taskId} already exists!`);
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO translations (student_id, original, user_translation, corrected_translation, task_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(studentId, original, userTranslation, correctedTranslation, taskId);
}

export function getLastTranslations(studentId: number, limit = 3) {
  const stmt = db.prepare(`
    SELECT * FROM translations WHERE student_id = ? ORDER BY created_at DESC LIMIT ?
  `);
  return stmt.all(studentId, limit);
}

export function saveStudentProgress(
  studentId: number, type: "grammar" | "vocabulary", name: string, correct: boolean, taskId: number
) {
  if (!studentId || !taskId) {
    console.error("❌ Error: studentId or taskId are empty!", { studentId, taskId });
    return;
  }

  const stmt = db.prepare(`
    INSERT INTO student_progress (student_id, type, name, correct, task_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(studentId, type, name, correct, taskId);
}

export function getStudentProgress(studentId: number): Array<{ count: number; correct_count: number; type: string; name: string }> {
  const stmt = db.prepare(`
    SELECT type, name, COUNT(*) as count, SUM(correct) as correct_count 
    FROM student_progress WHERE student_id = ? 
    GROUP BY type, name ORDER BY count DESC
  `);
  return stmt.all(studentId) as Array<{ count: number; correct_count: number; type: string; name: string }>;
}

export default db;