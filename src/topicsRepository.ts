import Database from 'better-sqlite3';

export class TopicsRepository {
  constructor(private db: Database.Database) {}

  public saveGrammarTopics(grammarTopics: Omit<Topic, "id">[]): void {
    const insertGrammarStmt = this.db.prepare(`
      INSERT OR IGNORE INTO grammar (language, name, level, level_number)
      VALUES (?, ?, ?, ?)
    `);

    for (const record of grammarTopics) {
      insertGrammarStmt.run(record.language, record.name, record.level, record.level_number);
    }
  }

  public saveVocabularyTopics(vocabularyTopics: Omit<Topic, "id">[]): void {
    const insertVocabularyStmt = this.db.prepare(`
      INSERT OR IGNORE INTO vocabulary (language, name, level, level_number)
      VALUES (?, ?, ?, ?)
    `);

    for (const record of vocabularyTopics) {
      insertVocabularyStmt.run(record.language, record.name, record.level, record.level_number);
    }
  }

  public getGrammarTopics(language: string, levelNumber: number): Topic[] {
    return this.db.prepare(`
      SELECT id, language, name, level, level_number
      FROM grammar
      WHERE language = ? AND level_number = ?
    `).all(language, levelNumber) as Topic[];
  }

  public getVocabularyTopics(language: string, levelNumber: number): Topic[] {
    return this.db.prepare(`
      SELECT id, language, name, level, level_number
      FROM vocabulary
      WHERE language = ? AND level_number = ?
    `).all(language, levelNumber) as Topic[];
  }
}

export interface Topic {
  id: number;
  language: string;
  name: string;
  level: string;
  level_number: number;
}
