CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  native_language TEXT,
  studied_language TEXT,
  level_number INTEGER,
  UNIQUE(username)
);

CREATE TABLE IF NOT EXISTS chat_state (
  chat_id INTEGER PRIMARY KEY,
  exercise_id INTEGER,
  UNIQUE(chat_id)
);

CREATE TABLE IF NOT EXISTS grammar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language TEXT NOT NULL,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  level_number INTEGER NOT NULL,
  UNIQUE(language, name, level)
);

CREATE TABLE IF NOT EXISTS vocabulary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  language TEXT NOT NULL,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  level_number INTEGER NOT NULL,
  UNIQUE(language, name, level)
);

CREATE TABLE IF NOT EXISTS exercise (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  sentence TEXT NOT NULL,
  translation TEXT,
  correct_translation TEXT,
  native_language TEXT NOT NULL,
  studied_language TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exercise_grammar (
  exercise_id INTEGER NOT NULL,
  grammar_id INTEGER NOT NULL,
  grade INTEGER,
  PRIMARY KEY (exercise_id, grammar_id),
  FOREIGN KEY (exercise_id) REFERENCES exercise(id),
  FOREIGN KEY (grammar_id) REFERENCES grammar(id)
);

CREATE TABLE IF NOT EXISTS exercise_vocabulary (
  exercise_id INTEGER NOT NULL,
  vocabulary_id INTEGER NOT NULL,
  grade INTEGER,
  PRIMARY KEY (exercise_id, vocabulary_id),
  FOREIGN KEY (exercise_id) REFERENCES exercise(id),
  FOREIGN KEY (vocabulary_id) REFERENCES vocabulary(id)
);
