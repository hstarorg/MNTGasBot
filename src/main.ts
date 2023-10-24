import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';
import { GlobalConfig } from './constants';
import { CustomErrorFilter } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // add custom filter
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new CustomErrorFilter(httpAdapter));

  // add request body size limit
  app.use(json({ limit: GlobalConfig.jsonLimit }));

  await app.listen(4004);
}
bootstrap();
