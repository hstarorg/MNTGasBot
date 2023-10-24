import { BadRequestException, Injectable } from '@nestjs/common';
import type { TgUpdateDto } from '../dtos/bot-webhook.dto';
import { BotLogicType, Envs, GlobalConfig } from '../constants';
import type { BotKeyInfo } from '../types/bot-types';
import { Telegram } from 'telegraf';
import type { CallbackQuery, Message, Update } from 'telegraf/types';
import { TgTextMessageWrapper } from '../libs/TgTextMessageWrapper';
import { MantleService } from './mantle.service';
import { numberDiv, numberSub, db, numberMul } from '../utils';

@Injectable()
export class BotWebhookService {
  private botMap: Record<string, BotKeyInfo> = {};

  constructor(private mantleServie: MantleService) {
    this.cacheBotMap();
  }

  private cacheBotMap() {
    const gasBots = this.getBotsFromEnvString(
      Envs.GasBot_BOTS,
      BotLogicType.GasBot,
    );

    const botMap: Record<string, BotKeyInfo> = {};

    gasBots.forEach((bot) => {
      botMap[String(bot.botId)] = bot;
    });

    this.botMap = botMap;
  }

  private getBotsFromEnvString(
    envString: string,
    botLogicType: BotLogicType,
  ): BotKeyInfo[] {
    const bots = envString.split(',').map((x) => {
      return {
        token: x,
        botId: Number(x.split(':')?.[0] || 0),
        type: botLogicType,
      };
    });
    return bots;
  }

  async processTgWebhook(botId: string, dto: TgUpdateDto) {
    const botKeyInfo = this.botMap[String(botId)];

    if (!botKeyInfo) {
      throw new BadRequestException('Invalid bot id');
    }

    if (botKeyInfo.type === BotLogicType.GasBot) {
      await this.processGasBotUpdate(botKeyInfo, dto);
    }

    return { processed: true };
  }

  private async processGasBotUpdate(botInfo: BotKeyInfo, update: TgUpdateDto) {
    const bot = new Telegram(botInfo.token);

    await db.botUpdateLog.create({
      data: {
        botId: String(botInfo.botId),
        createAt: Date.now(),
        update: JSON.stringify(update),
        chatType: 'private',
        fromId: '',
        fromName: '',
        updateId: update.update_id,
      },
    });

    const Query_Exchange_Message = `Enter Your USDT transaction ID on Ethereum Mainnet:`;

    if ((update as Update.CallbackQueryUpdate).callback_query) {
      const callbackQuery = (update as Update.CallbackQueryUpdate)
        .callback_query;
      const callbackQueryData = (callbackQuery as CallbackQuery.DataQuery).data;
      if (callbackQueryData === 'exchange_mnt') {
        const mantlePrice = await this.mantleServie.getMantlePrice();
        const exchangeRate = Number(
          numberDiv(numberSub(1 - 0.1), mantlePrice.mntPrice),
        ).toFixed(4);
        const msgText =
          `We're here to gas you up!\n\n` +
          `1. Please send <= ${GlobalConfig.MAX_USDT_AMOUNT} USDT on Ethereum Mainnet to address: ${Envs.RECEIVING_ADDRESS} .\n` +
          `2. You will receive MNT on Mantle Mainnet.\n\n` +
          `We take ${numberMul(
            100 * GlobalConfig.feeRate,
          )}% tip. The rate is 1 USDT = ${exchangeRate} MNT(market price)`;

        const addressIdx = msgText.indexOf('0x');

        await bot.sendMessage(callbackQuery.from.id, msgText, {
          entities: [
            // { offset: addressIdx, length: 42, type: 'code' d },
            { offset: addressIdx, length: 42, type: 'underline' },
          ],
        });
      } else if (callbackQueryData === 'query_exchange') {
        return;
        bot.sendMessage(callbackQuery.from.id, Query_Exchange_Message, {
          reply_markup: {
            force_reply: true,
          },
        });
      }
    }
    // If message update
    else if ((update as Update.MessageUpdate).message) {
      const message = (update as Update.MessageUpdate)
        .message as Message.TextMessage;
      const textMsgWrapper = new TgTextMessageWrapper(message, bot);

      if (textMsgWrapper.isGroupChat) {
        return;
      }

      const promptMessage = 'Enter Your Wallet Address:';
      // private chat
      if (textMsgWrapper.hasCommand('/start')) {
        await bot.sendMessage(
          textMsgWrapper.chatId,
          `Welcome to MNT gas bot!`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: 'Get MNT', callback_data: 'exchange_mnt' },
                  // { text: 'Coming Soon', callback_data: 'query_exchange' },
                ],
              ],
            },
          },
        );
      } else if (textMsgWrapper.hasCommand('/gas')) {
        await bot.sendMessage(textMsgWrapper.chatId, promptMessage, {
          reply_markup: {
            force_reply: true,
          },
        });
      } else if (textMsgWrapper.hasCommand('/price')) {
        const priceResult = await this.mantleServie.getMantlePrice();

        const message = `MNT: $${priceResult.mntPrice}\nETH: $${
          priceResult.ethPrice
        }\nLast Update At: ${new Date(priceResult.queryDate)}`;

        await bot.sendMessage(textMsgWrapper.chatId, message);
      } else if (message.reply_to_message) {
        // is reply message
        const messageText = (message.reply_to_message as Message.TextMessage)
          ?.text;
        if (messageText === promptMessage) {
          // get user input
          const toAddress = message.text.trim();
          if (!toAddress.startsWith('0x') || toAddress.length !== 42) {
            await bot.sendMessage(
              textMsgWrapper.chatId,
              `⚠️ Invalid wallet address: ${toAddress}`,
            );
            await bot.sendMessage(textMsgWrapper.chatId, promptMessage, {
              reply_markup: {
                force_reply: true,
              },
            });
          } else {
            // start transfer
            await bot.sendMessage(textMsgWrapper.chatId, 'Transferring...');
            try {
              const balanceResult =
                await this.mantleServie.sendTransactionAndGetToBalance(
                  toAddress,
                  '1',
                );

              await bot.sendMessage(
                textMsgWrapper.chatId,
                `Transfer successful, the balance after the transfer: ${balanceResult.formatedBalance} MNT`,
              );
            } catch (reason) {
              await bot.sendMessage(
                textMsgWrapper.chatId,
                `Transfer failed, ${
                  (reason as Error)?.message || 'please retry'
                }`,
              );
            }
          }
        } else if (messageText === Query_Exchange_Message) {
          const txId = message.text.trim();

          const result = await this.mantleServie.getGasTransaction(txId);
          let replyMessage = '';
          if (result.status === 'none') {
            replyMessage = 'No transaction found';
          } else if (result.status === 'pending') {
            replyMessage = 'Transaction is processing, please wait';
          } else if (result.status === 'done') {
            replyMessage = `Transaction is done, the transaction hash on Mantle Mainnet is: ${
              result.mantleTxHash || ''
            }`;
          }
          bot.sendMessage(textMsgWrapper.chatId, replyMessage);
        }
      }
    } else if ((update as Update.CallbackQueryUpdate).callback_query) {
      // If callback query update
    }
  }
}
