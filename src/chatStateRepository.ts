import Database from 'better-sqlite3';

export class ChatStateRepository {
  constructor(private db: Database.Database) {}

  public saveChatState(chatState: ChatState): void {
    const stmt = this.db.prepare(`
        INSERT INTO chat_state (chat_id, sentence, topic, is_waiting_for_translation)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(chat_id) DO UPDATE SET
          sentence = excluded.sentence,
          topic = excluded.topic,
          is_waiting_for_translation = excluded.is_waiting_for_translation
      `);
    stmt.run(chatState.chat_id, chatState.sentence, chatState.topic, chatState.is_waiting_for_translation ? 1 : 0);
  }

  public getChatState(chatId: number): ChatState | undefined {
    const stmt = this.db.prepare(`
      SELECT chat_id, sentence, topic, is_waiting_for_translation FROM chat_state WHERE chat_id = ?
    `);
    return stmt.get(chatId) as ChatState | undefined;
  }
}

interface ChatState {
    chat_id: number;
    sentence: string;
    topic: string;
    is_waiting_for_translation: boolean;
}
