import { BotWebhookService } from './bot-webhook.service';
import { QueueConsumerService } from './queue-consumer.service';
import { TaskSchedulingService } from './task-scheduling.service';
import { MantleService } from './mantle.service';
import { EthereumChainService } from './chain-services/ethereum-chain.service';
import { AppService } from './app.service';
export { BotWebhookService, EthereumChainService, AppService };

export const ALL_SERVICES = [
  BotWebhookService,
  QueueConsumerService,
  TaskSchedulingService,
  MantleService,
  EthereumChainService,
  AppService,
];
