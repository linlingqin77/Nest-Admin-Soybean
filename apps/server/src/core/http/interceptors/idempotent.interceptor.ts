import {
  Injectable,
  NestInterceptor,
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { RedisService } from 'src/platform/redis/redis.service';
import { Request } from 'express';
import * as crypto from 'crypto';
import { IDEMPOTENT_KEY, IdempotentOptions } from 'src/core/http/decorators/idempotent.decorator';

/**
 * 幂等性拦截器
 */
@Injectable()
export class IdempotentInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const options = this.reflector.get<Required<IdempotentOptions>>(IDEMPOTENT_KEY, context.getHandler());

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const idempotentKey = this.generateKey(request, options);

    // 尝试获取已存在的结果
    const existingResult = await this.redisService.get(idempotentKey);

    if (existingResult !== null) {
      // 检查是否是处理中状态
      if (existingResult === '__PROCESSING__') {
        throw new HttpException(options.message, HttpStatus.TOO_MANY_REQUESTS);
      }
      // 返回缓存的结果
      return of(existingResult);
    }

    // 使用 Redis SET NX (通过 ioredis client) 实现原子性设置
    const client = this.redisService.getClient();
    const setResult = await client.set(idempotentKey, '__PROCESSING__', 'EX', options.timeout, 'NX');

    if (!setResult) {
      // 设置失败，说明已有其他请求在处理
      throw new HttpException(options.message, HttpStatus.TOO_MANY_REQUESTS);
    }

    return next.handle().pipe(
      tap(async (result) => {
        // 执行成功，存储结果
        // redisService.set 使用 PX（毫秒），所以 timeout（秒）需要 * 1000
        await this.redisService.set(idempotentKey, result, options.timeout * 1000);
      }),
      catchError((error) => {
        // 执行异常，根据配置决定是否删除Key
        if (options.deleteOnError) {
          // Fire and forget - don't await, just trigger the deletion
          this.redisService.del(idempotentKey).catch(() => {
            // Ignore deletion errors
          });
        }
        return throwError(() => error);
      }),
    );
  }

  /**
   * 生成幂等性Key
   */
  private generateKey(request: Request, options: Required<IdempotentOptions>): string {
    const { keyPrefix, keyResolver } = options;

    // 基础信息
    const userId = (request as any).user?.userId || 'anonymous';
    const method = request.method;
    const path = request.path;

    let keyPart: string;

    if (keyResolver) {
      // 使用自定义Key解析器
      keyPart = this.resolveKey(keyResolver, request);
    } else {
      // 默认使用请求参数生成Key
      const params = {
        query: request.query,
        body: request.body,
        params: request.params,
      };
      keyPart = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
    }

    return `${keyPrefix}${userId}:${method}:${path}:${keyPart}`;
  }

  /**
   * 解析自定义Key模板
   */
  private resolveKey(template: string, request: Request): string {
    let result = template;

    // 替换 {body.xxx} 占位符
    const bodyMatches = template.match(/\{body\.(\w+)\}/g);
    if (bodyMatches) {
      for (const match of bodyMatches) {
        const key = match.replace('{body.', '').replace('}', '');
        const value = request.body?.[key] ?? '';
        result = result.replace(match, String(value));
      }
    }

    // 替换 {query.xxx} 占位符
    const queryMatches = template.match(/\{query\.(\w+)\}/g);
    if (queryMatches) {
      for (const match of queryMatches) {
        const key = match.replace('{query.', '').replace('}', '');
        const value = request.query?.[key] ?? '';
        result = result.replace(match, String(value));
      }
    }

    // 替换 {params.xxx} 占位符
    const paramsMatches = template.match(/\{params\.(\w+)\}/g);
    if (paramsMatches) {
      for (const match of paramsMatches) {
        const key = match.replace('{params.', '').replace('}', '');
        const value = request.params?.[key] ?? '';
        result = result.replace(match, String(value));
      }
    }

    // 替换简单 {xxx} 占位符（从body中查找）
    const simpleMatches = template.match(/\{(\w+)\}/g);
    if (simpleMatches) {
      for (const match of simpleMatches) {
        const key = match.replace('{', '').replace('}', '');
        const value = request.body?.[key] ?? request.query?.[key] ?? request.params?.[key] ?? '';
        result = result.replace(match, String(value));
      }
    }

    return result || crypto.createHash('md5').update(JSON.stringify(request.body)).digest('hex');
  }
}
