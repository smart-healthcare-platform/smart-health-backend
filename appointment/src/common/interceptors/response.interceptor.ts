import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => {
                return {
                    success: true,
                    message: data?.message || 'Thành công',
                    data: instanceToPlain(data?.result ?? data),
                    code: 200,
                };
            }),
        );
    }
}
