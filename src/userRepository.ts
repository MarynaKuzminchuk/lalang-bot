import Database from 'better-sqlite3';

export class UserRepository {
  constructor(private db: Database.Database) { }

  public saveUser(user: Omit<User, "id">): void {
    this.db.prepare(`
      INSERT INTO user (username, native_language, studied_language, level_number)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(username) DO UPDATE SET
        native_language = excluded.native_language,
        studied_language = excluded.studied_language,
        level_number = excluded.level_number
    `).run(user.username, user.native_language, user.studied_language, user.level_number);
  }

  public getUser(username: string): User | undefined {
    return this.db.prepare(`
      SELECT id, username, native_language, studied_language, level_number
      FROM user
      WHERE username = ?
    `).get(username) as User | undefined;
  }
}

export interface User {
  id: number,
  username: string,
  native_language?: string,
  studied_language?: string;
  level_number?: number;
}
