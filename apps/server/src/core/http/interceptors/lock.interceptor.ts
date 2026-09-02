import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { RedisService } from 'src/platform/redis/redis.service';
import { Request } from 'express';
import * as crypto from 'crypto';
import { LOCK_KEY, LockAcquireException, LockOptions } from 'src/core/http/decorators/lock.decorator';

/**
 * 分布式锁拦截器
 */
@Injectable()
export class LockInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LockInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const options = this.reflector.get<Required<LockOptions>>(LOCK_KEY, context.getHandler());

    if (!options || !options.key) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const lockKey = this.generateKey(request, options);
    const lockValue = this.generateLockValue();

    // 尝试获取锁
    const acquired = await this.tryAcquireLock(lockKey, lockValue, options);

    if (!acquired) {
      throw new LockAcquireException(options.message);
    }

    // 执行方法并在完成后释放锁
    return next.handle().pipe(
      finalize(async () => {
        await this.releaseLock(lockKey, lockValue);
      }),
    );
  }

  /**
   * 尝试获取锁
   */
  private async tryAcquireLock(key: string, value: string, options: Required<LockOptions>): Promise<boolean> {
    const client = this.redisService.getClient();
    const startTime = Date.now();
    const waitTimeMs = options.waitTime * 1000;
    const leaseTimeSeconds = options.leaseTime;

    // 尝试获取锁
    while (true) {
      const result = await client.set(key, value, 'EX', leaseTimeSeconds, 'NX');

      if (result === 'OK') {
        return true;
      }

      // 如果不等待，直接返回失败
      if (options.waitTime <= 0) {
        return false;
      }

      // 检查是否超过等待时间
      const elapsed = Date.now() - startTime;
      if (elapsed >= waitTimeMs) {
        return false;
      }

      // 等待一小段时间后重试
      await this.sleep(Math.min(100, waitTimeMs - elapsed));
    }
  }

  /**
   * 释放锁
   * 使用Lua脚本确保只有锁的持有者才能释放锁
   */
  private async releaseLock(key: string, value: string): Promise<boolean> {
    const client = this.redisService.getClient();

    // Lua脚本：只有当锁的值匹配时才删除
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    try {
      const result = await client.eval(script, 1, key, value);
      return result === 1;
    } catch (error) {
      // 释放锁失败，记录日志但不抛出异常
      this.logger.error(
        `Failed to release lock ${key}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }

  /**
   * 生成锁Key
   */
  private generateKey(request: Request, options: Required<LockOptions>): string {
    const { keyPrefix, key } = options;
    const resolvedKey = this.resolveKey(key, request);
    return `${keyPrefix}${resolvedKey}`;
  }

  /**
   * 生成唯一的锁值（用于标识锁的持有者）
   */
  private generateLockValue(): string {
    return `${process.pid}:${crypto.randomUUID()}`;
  }

  /**
   * 解析Key模板中的占位符
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

    // 替换 {params.xxx} 或 {:xxx} 占位符
    const paramsMatches = template.match(/\{(?:params\.)?(\w+)\}/g);
    if (paramsMatches) {
      for (const match of paramsMatches) {
        // Extract key from {params.xxx} or {xxx}
        const key = match.replace('{params.', '').replace('{', '').replace('}', '');
        const value = request.params?.[key] ?? request.body?.[key] ?? request.query?.[key] ?? '';
        result = result.replace(match, String(value));
      }
    }

    return result;
  }

  /**
   * 休眠指定毫秒数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
