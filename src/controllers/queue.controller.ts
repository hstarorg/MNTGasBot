import { Controller, Get } from '@nestjs/common';

import { GlobalConfig } from '../constants';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('/queue')
export class QueueController {
  constructor(
    @InjectQueue(GlobalConfig.queueConf.txQueueName)
    private readonly txQueue: Queue,
  ) {}

  @Get('/info')
  async getQuestInfo() {
    const [activeCount, failedCount] = await Promise.all([
      this.txQueue.getActiveCount(),
      this.txQueue.getFailedCount(),
    ]);

    return {
      activeCount,
      failedCount,
    };
  }
}
