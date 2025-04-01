import Database from 'better-sqlite3';

export class TopicsRepository {
  constructor(private db: Database.Database) {}

  public saveGrammarTopics(grammarTopics: GrammarTopic[]): void {
    const insertGrammarStmt = this.db.prepare(`
        INSERT OR IGNORE INTO grammar (language, topic, level, level_number)
        VALUES (?, ?, ?, ?)
      `);

    for (const record of grammarTopics) {
      insertGrammarStmt.run(record.language, record.topic, record.level, record.level_number);
    }
  }

  public saveVocabularyTopics(vocabularyTopics: VocabularyTopic[]): void {
    const insertVocabularyStmt = this.db.prepare(`
        INSERT OR IGNORE INTO vocabulary (language, topic, level, level_number)
        VALUES (?, ?, ?, ?)
      `);

    for (const record of vocabularyTopics) {
      insertVocabularyStmt.run(record.language, record.topic, record.level, record.level_number);
    }
  }

  public getGrammarTopics(language: string): GrammarTopic[] {
    const stmt = this.db.prepare(`
      SELECT language, topic, level, level_number
      FROM grammar
      WHERE language = ?
    `);
    return stmt.all(language) as GrammarTopic[];
  }

  public getVocabularyTopics(language: string): VocabularyTopic[] {
    const stmt = this.db.prepare(`
      SELECT language, topic, level, level_number
      FROM vocabulary
      WHERE language = ?
    `);
    return stmt.all(language) as VocabularyTopic[];
  }
}

export interface GrammarTopic {
  language: string;
  topic: string;
  level: string;
  level_number: number;
}

export interface VocabularyTopic {
  language: string;
  topic: string;
  level: string;
  level_number: number;
}
