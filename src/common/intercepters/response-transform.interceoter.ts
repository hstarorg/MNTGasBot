import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
// import { catchError,map } from 'rxjs/operators';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((value) => ({
        success: true,
        statusCode: 200,
        data: value,
        message: 'ok',
      })),
    );
  }
}
