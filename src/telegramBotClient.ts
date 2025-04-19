import TelegramBot, { InlineKeyboardButton, Message } from "node-telegram-bot-api";

export class TelegramBotClient {
  constructor(private bot: TelegramBot) { }

  public sendMessageWithOptions(chatId: number, text: string, buttons: InlineKeyboardButton[]): Promise<Message> {
    return this.bot.sendMessage(chatId, text, {
      reply_markup: {
        inline_keyboard: [buttons],
        resize_keyboard: true
      },
    });
  }

  public answerCallbackQuery(query: TelegramBot.CallbackQuery): Promise<boolean> {
    return this.bot.answerCallbackQuery(query.id);
  }
}
