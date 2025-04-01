import Database from 'better-sqlite3';

export class StaticDataRepository {
  constructor(private db: Database.Database) {}

  public saveGrammarData(
    grammarData: Array<{
      language: string;
      topic: string;
      level: string;
      level_number: number;
    }>
  ): void {
    const insertGrammarStmt = this.db.prepare(`
        INSERT OR IGNORE INTO grammar (language, topic, level, level_number)
        VALUES (?, ?, ?, ?)
      `);

    for (const record of grammarData) {
      insertGrammarStmt.run(record.language, record.topic, record.level, record.level_number);
    }
  }

  public saveVocabularyData(
    vocabularyData: Array<{
      language: string;
      topic: string;
      level: string;
      level_number: number;
    }>
  ): void {
    const insertVocabularyStmt = this.db.prepare(`
        INSERT OR IGNORE INTO vocabulary (language, topic, level, level_number)
        VALUES (?, ?, ?, ?)
      `);

    for (const record of vocabularyData) {
      insertVocabularyStmt.run(record.language, record.topic, record.level, record.level_number);
    }
  }
}
