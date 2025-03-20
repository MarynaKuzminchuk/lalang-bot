import TelegramBot, { Message } from "node-telegram-bot-api";

export class TelegramBotClient {
  constructor(private bot: TelegramBot) {}

  public sendTaskButton(chatId: number): Promise<Message> {
    const keyboard = {
      reply_markup: {
        inline_keyboard: [[{ text: 'Give assignment', callback_data: 'give_task' }]],
      },
    };
    return this.bot.sendMessage(chatId, 'Click “Give assignment” to get a new exercise.', keyboard);
  }

  public sendMessage(chatId: number, text: string): Promise<Message> {
    return this.bot.sendMessage(chatId, text);
  }

  public answerCallbackQuery(query: TelegramBot.CallbackQuery): Promise<boolean> {
    return this.bot.answerCallbackQuery(query.id);
  }
}
