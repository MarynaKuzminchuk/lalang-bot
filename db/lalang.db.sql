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

CREATE TABLE IF NOT EXISTS exercise (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  sentence TEXT NOT NULL,
  native_language TEXT NOT NULL,
  studied_language TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_grammar (
  exercise_id INTEGER NOT NULL,
  grammar_id INTEGER NOT NULL,
  PRIMARY KEY (exercise_id, grammar_id),
  FOREIGN KEY (exercise_id) REFERENCES exercise(id),
  FOREIGN KEY (grammar_id) REFERENCES grammar(id)
);

CREATE TABLE IF NOT EXISTS exercise_vocabulary (
  exercise_id INTEGER NOT NULL,
  vocabulary_id INTEGER NOT NULL,
  PRIMARY KEY (exercise_id, vocabulary_id),
  FOREIGN KEY (exercise_id) REFERENCES exercise(id),
  FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id)
);
