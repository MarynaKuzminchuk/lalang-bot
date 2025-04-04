CREATE TABLE IF NOT EXISTS translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  original TEXT NOT NULL,
  user_translation TEXT NOT NULL,
  corrected_translation TEXT NOT NULL,
  task_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS translation_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  translation_id INTEGER NOT NULL,
  correct_grammar TEXT,
  incorrect_grammar TEXT,
  correct_vocabulary TEXT,
  incorrect_vocabulary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (translation_id) REFERENCES translations(id)
);

CREATE TABLE IF NOT EXISTS student_topic_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  topic TEXT NOT NULL,
  grammar_errors INTEGER DEFAULT 0,
  vocabulary_errors INTEGER DEFAULT 0,
  grammar_success INTEGER DEFAULT 0,
  vocabulary_success INTEGER DEFAULT 0,
  last_attempted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, topic)
);

CREATE TABLE IF NOT EXISTS chat_state (
  chat_id INTEGER PRIMARY KEY,
  sentence TEXT,
  topic TEXT,
  is_waiting_for_translation BOOLEAN,
  UNIQUE(chat_id)
);

CREATE TABLE IF NOT EXISTS grammar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language TEXT NOT NULL,
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  level_number INTEGER NOT NULL,
  UNIQUE(language, topic, level)
);

CREATE TABLE IF NOT EXISTS vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language TEXT NOT NULL,
  topic TEXT NOT NULL,
  level TEXT NOT NULL,
  level_number INTEGER NOT NULL,
  UNIQUE(language, topic, level)
);

