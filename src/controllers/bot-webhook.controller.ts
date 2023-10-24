import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Req,
  Request,
} from '@nestjs/common';

import { BotWebhookService } from '../services';
import { hmacSha256 } from '../utils';
import { Envs } from '../constants';

@Controller('/bot-webhook')
export class BotWebhookController {
  constructor(private readonly botWebhook: BotWebhookService) {}

  @Post('/:botId')
  processTgWebhook(
    @Req() request: Request,
    @Param('botId') botId: string,

    @Body() dto: any,
  ) {
    // 1. get secret token from header
    const secretToken =
      request.headers['x-telegram-bot-api-secret-token'] || '';

    // 2. calc expect secret token
    const expectSecretToken = hmacSha256(botId, Envs.APP_SECRET);

    // 3. match secret token
    if (expectSecretToken !== secretToken) {
      throw new BadRequestException(
        'Invalid request',
        `Invalid secret token for bot ${botId}`,
      );
    }

    return this.botWebhook.processTgWebhook(botId, dto);
  }
}
