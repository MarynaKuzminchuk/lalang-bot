import Database from 'better-sqlite3';

export class TopicsRepository {
  constructor(private db: Database.Database) {}

  public saveGrammarTopics(grammarTopics: Omit<GrammarTopic, "id">[]): void {
    const insertGrammarStmt = this.db.prepare(`
        INSERT OR IGNORE INTO grammar (language, topic, level, level_number)
        VALUES (?, ?, ?, ?)
      `);

    for (const record of grammarTopics) {
      insertGrammarStmt.run(record.language, record.topic, record.level, record.level_number);
    }
  }

  public saveVocabularyTopics(vocabularyTopics: Omit<VocabularyTopic, "id">[]): void {
    const insertVocabularyStmt = this.db.prepare(`
        INSERT OR IGNORE INTO vocabulary (language, topic, level, level_number)
        VALUES (?, ?, ?, ?)
      `);

    for (const record of vocabularyTopics) {
      insertVocabularyStmt.run(record.language, record.topic, record.level, record.level_number);
    }
  }

  public getGrammarTopics(language: string, levelNumber: number): GrammarTopic[] {
    return this.db.prepare(`
      SELECT id, language, topic, level, level_number
      FROM grammar
      WHERE language = ? AND level_number = ?
    `).all(language, levelNumber) as GrammarTopic[];
  }

  public getVocabularyTopics(language: string, levelNumber: number): VocabularyTopic[] {
    return this.db.prepare(`
      SELECT id, language, topic, level, level_number
      FROM vocabulary
      WHERE language = ? AND level_number = ?
    `).all(language, levelNumber) as VocabularyTopic[];
  }
}

export interface GrammarTopic {
  id: number;
  language: string;
  topic: string;
  level: string;
  level_number: number;
}

export interface VocabularyTopic {
  id: number;
  language: string;
  topic: string;
  level: string;
  level_number: number;
}
