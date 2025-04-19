import Database from 'better-sqlite3';

export class ChatStateRepository {
  constructor(private db: Database.Database) { }

  public saveChatState(chatState: ChatState): void {
    this.db.prepare(`
      INSERT INTO chat_state (chat_id, exercise_id)
      VALUES (?, ?)
      ON CONFLICT(chat_id) DO UPDATE SET
        exercise_id = excluded.exercise_id
    `).run(chatState.chat_id, chatState.exercise_id);
  }

  public getChatState(chatId: number): ChatState | undefined {
    return this.db.prepare(`
      SELECT chat_id, exercise_id FROM chat_state WHERE chat_id = ?
    `).get(chatId) as ChatState | undefined;
  }
}

interface ChatState {
  chat_id: number;
  exercise_id?: number;
}
