import { ArgumentsHost, Catch, HttpServer } from '@nestjs/common';
import { AbstractHttpAdapter, BaseExceptionFilter } from '@nestjs/core';

@Catch()
export class CustomErrorFilter extends BaseExceptionFilter {
  handleUnknownError(
    exception: any,
    host: ArgumentsHost,
    applicationRef: HttpServer<any, any> | AbstractHttpAdapter<any, any, any>,
  ): void {
    console.error(exception);
    super.handleUnknownError(exception, host, applicationRef);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    console.error(exception);
    super.catch(exception, host);
  }
}
