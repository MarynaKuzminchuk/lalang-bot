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
