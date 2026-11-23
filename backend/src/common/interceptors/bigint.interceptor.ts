import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function serializeValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Date) {
    return value;
  }
  // Decimal.js instances (Prisma Decimal fields) or objects with custom numeric formatting
  if (typeof value === 'object' && typeof value.toFixed === 'function') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }
  if (typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto === null || proto === Object.prototype) {
      const transformed: Record<string, any> = {};
      for (const key of Object.keys(value)) {
        transformed[key] = serializeValue(value[key]);
      }
      return transformed;
    }
  }
  return value;
}

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => serializeValue(data)));
  }
}
