import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        function formatDate(date: Date) {
          if (!date) return null;
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          const hh = String(date.getHours()).padStart(2, '0');
          const min = String(date.getMinutes()).padStart(2, '0');
          const ss = String(date.getSeconds()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
        }

        function transformDates(obj: any): any {
          if (obj instanceof Date) return formatDate(obj);
          if (Array.isArray(obj)) return obj.map(transformDates);
          if (obj && typeof obj === 'object') {
            return Object.fromEntries(
              Object.entries(obj).map(([k, v]) => [k, transformDates(v)])
            );
          }
          return obj;
        }

        return {
          success: true,
          message: data?.message || 'Thành công',
          data: transformDates(data?.result ?? data),
          code: 200,
        };
      }),
    );
  }
}
