import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';
import { Request, Response } from 'express';

/**
 * HTTP 请求指标收集拦截器
 *
 * @description 自动收集 HTTP 请求的计数和延迟指标
 * 实现需求 2.3
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const startTime = process.hrtime.bigint();
    const method = request.method;
    const path = request.route?.path || request.path || request.url;

    // 获取租户 ID（如果存在）
    const tenantId = (request as any).user?.tenantId;

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetrics(method, path, response.statusCode, startTime, tenantId);
        },
        error: (error) => {
          const statusCode = error.status || error.statusCode || 500;
          this.recordMetrics(method, path, statusCode, startTime, tenantId);
        },
      }),
    );
  }

  /**
   * 记录请求指标
   */
  private recordMetrics(
    method: string,
    path: string,
    statusCode: number,
    startTime: bigint,
    tenantId?: string,
  ): void {
    // 计算请求耗时（秒）
    const endTime = process.hrtime.bigint();
    const durationNs = Number(endTime - startTime);
    const durationSeconds = durationNs / 1e9;

    // 记录 HTTP 请求指标
    this.metricsService.recordHttpRequest(method, path, statusCode, durationSeconds);

    // 记录租户 API 调用指标
    if (tenantId) {
      this.metricsService.recordTenantApiCall(tenantId, method, path);
    }
  }
}
