import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClsService } from 'nestjs-cls';
import { Result } from 'src/shared/response/result';

/**
 * 统一响应拦截器
 *
 * @description 为所有响应添加 requestId 和 timestamp 字段
 * 确保所有 API 响应都符合统一格式：
 * { code: number, msg: string, data: any, requestId: string, timestamp: string }
 *
 * @example
 * // 原始响应
 * { code: 200, msg: '操作成功', data: { id: 1 } }
 *
 * // 处理后响应
 * { code: 200, msg: '操作成功', data: { id: 1 }, requestId: 'uuid', timestamp: '2025-01-01T00:00:00.000Z' }
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = this.cls?.get?.('requestId') || request?.requestId || request?.id || '-';
    const timestamp = new Date().toISOString();

    return next.handle().pipe(
      map((data) => {
        // 如果响应是 Result 实例，添加 requestId 和 timestamp
        if (data instanceof Result) {
          data.requestId = requestId;
          data.timestamp = timestamp;
          return data;
        }

        // 如果响应是普通对象且包含 code 字段（类似 Result 结构）
        if (data && typeof data === 'object' && 'code' in data) {
          return {
            ...data,
            requestId,
            timestamp,
          };
        }

        // 其他情况，包装成标准响应格式
        return {
          code: 200,
          msg: '操作成功',
          data,
          requestId,
          timestamp,
        };
      }),
    );
  }
}
