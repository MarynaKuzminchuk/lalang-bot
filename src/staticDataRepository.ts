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
}
