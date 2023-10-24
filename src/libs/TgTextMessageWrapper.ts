import { Telegram } from 'telegraf';
import type {
  InlineKeyboardButton,
  Message,
  MessageEntity,
} from 'telegraf/types';

export type OptimzedMessageEntity = {
  type: MessageEntity['type'];
  value: string;
  user?: string;
};

export class TgTextMessageWrapper {
  private entities: OptimzedMessageEntity[] = [];
  constructor(private message: Message.TextMessage, private bot: Telegram) {
    this.entities = this.getMessageEntities(message);
  }

  private getMessageEntities(message: Message.TextMessage) {
    const entities: OptimzedMessageEntity[] = [];
    (message?.entities || [])?.forEach((x) => {
      const value = message.text.substring(x.offset, x.offset + x.length);
      if (x.type === 'bot_command') {
        const [name, user] = value.split('@');
        entities.push({ type: x.type, value: name, user });
      } else {
        entities.push({ type: x.type, value });
      }
    });

    return entities;
  }

  /**
   * is private chat
   */
  get isPrivateChat() {
    return this.message.chat.type === 'private';
  }

  /**
   * is group chat
   */
  get isGroupChat() {
    return this.message.chat.type === 'group';
  }

  get chatId() {
    return this.message.chat.id;
  }

  get from() {
    return this.message.from!;
  }

  hasCommand(commandName: string) {
    return this.entities.some(
      (x) => x.type === 'bot_command' && x.value === commandName,
    );
  }

  getEntitiesByType(type: MessageEntity['type']) {
    return this.entities.filter((x) => x.type === type);
  }

  replyMessage(message: string) {
    this.bot.sendMessage(this.chatId, message);
  }

  replyMessageWithInlineKeyboard(
    message: string,
    inlineKeyboard: InlineKeyboardButton[][],
  ) {
    return this.bot.sendMessage(this.chatId, message, {
      reply_markup: {
        inline_keyboard: [...inlineKeyboard],
      },
    });
  }
}
