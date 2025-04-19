import Database from 'better-sqlite3';

export class TopicsRepository {
  constructor(private db: Database.Database) { }

  public saveTopics(topics: Omit<Topic, "id">[]): void {
    const insertGrammarStmt = this.db.prepare(`
      INSERT OR IGNORE INTO topic (type, language, name, level, level_number)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const topic of topics) {
      insertGrammarStmt.run(topic.type, topic.language, topic.name, topic.level, topic.level_number);
    }
  }
}

export interface Topic {
  id: number;
  type: TopicType;
  language: string;
  name: string;
  level: string;
  level_number: number;
}

export enum TopicType {
  GRAMMAR = 'grammar',
  VOCABULARY = 'vocabulary'
}
