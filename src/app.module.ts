import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

import { ALL_CONTROLLERS } from './controllers';
import { ALL_SERVICES } from './services';
import { RequestValidationPipe, ResponseTransformInterceptor } from './common';
import { Envs, GlobalConfig } from './constants';

@Module({
  imports: [
    ConfigModule.forRoot(),
    BullModule.forRoot({
      url: Envs.REDIS_URL,
      redis: { maxRetriesPerRequest: 50 },
      prefix: GlobalConfig.queueConf.prefix,
    }),
    BullModule.registerQueue({
      name: GlobalConfig.queueConf.txQueueName,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: ALL_CONTROLLERS,
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
    { provide: APP_PIPE, useClass: RequestValidationPipe },
    ...ALL_SERVICES,
  ],
})
export class AppModule {}
