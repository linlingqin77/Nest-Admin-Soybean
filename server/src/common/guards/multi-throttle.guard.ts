import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RedisService } from 'src/module/common/redis/redis.service';

/**
 * 限流配置接口
 */
export interface ThrottleConfig {
  /** 时间窗口（毫秒） */
  ttl: number;
  /** 时间窗口内允许的最大请求数 */
  limit: number;
}

/**
 * 多维度限流配置
 */
export interface MultiThrottleConfig {
  /** IP 限流配置 */
  ip?: ThrottleConfig;
  /** 用户限流配置 */
  user?: ThrottleConfig;
  /** 租户限流配置 */
  tenant?: ThrottleConfig;
}

/**
 * 默认限流配置
 */
export const DEFAULT_THROTTLE_CONFIG: MultiThrottleConfig = {
  ip: { ttl: 60000, limit: 100 }, // 每分钟 100 次
  user: { ttl: 60000, limit: 200 }, // 每分钟 200 次
  tenant: { ttl: 60000, limit: 1000 }, // 每分钟 1000 次
};

/**
 * 限流装饰器元数据 key
 */
export const THROTTLE_KEY = 'throttle';
export const SKIP_THROTTLE_KEY = 'skipThrottle';

/**
 * 限流异常
 */
export class ThrottleException extends HttpException {
  constructor(message: string = '请求过于频繁，请稍后再试', retryAfter?: number) {
    super(
      {
        code: 429,
        msg: message,
        data: null,
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * 限流结果
 */
export interface ThrottleResult {
  /** 是否被限流 */
  blocked: boolean;
  /** 当前请求数 */
  current: number;
  /** 限制数 */
  limit: number;
  /** 剩余时间（秒） */
  remaining: number;
}

/**
 * 多维度限流守卫
 *
 * @description
 * 实现 IP、用户、租户三个维度的限流控制
 * 使用 Redis 滑动窗口算法实现精确限流
 *
 * @example
 * ```typescript
 * // 在 Controller 或方法上使用
 * @UseGuards(MultiThrottleGuard)
 * @Throttle({ ip: { ttl: 60000, limit: 10 } })
 * async login() {}
 *
 * // 跳过限流
 * @SkipThrottle()
 * async healthCheck() {}
 * ```
 */
@Injectable()
export class MultiThrottleGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 检查是否跳过限流
    const skipThrottle = this.reflector.getAllAndOverride<boolean>(SKIP_THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipThrottle) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const config = this.getThrottleConfig(context);

    // IP 限流
    if (config.ip) {
      const ip = this.getClientIp(request);
      const ipResult = await this.checkLimit(`throttle:ip:${ip}`, config.ip);
      if (ipResult.blocked) {
        throw new ThrottleException(`IP 请求过于频繁，请 ${ipResult.remaining} 秒后再试`, ipResult.remaining);
      }
    }

    // 用户限流
    const userId = request.user?.userId;
    if (config.user && userId) {
      const userResult = await this.checkLimit(`throttle:user:${userId}`, config.user);
      if (userResult.blocked) {
        throw new ThrottleException(`用户请求过于频繁，请 ${userResult.remaining} 秒后再试`, userResult.remaining);
      }
    }

    // 租户限流
    const tenantId = request.user?.tenantId;
    if (config.tenant && tenantId) {
      const tenantResult = await this.checkLimit(`throttle:tenant:${tenantId}`, config.tenant);
      if (tenantResult.blocked) {
        throw new ThrottleException(`租户请求过于频繁，请 ${tenantResult.remaining} 秒后再试`, tenantResult.remaining);
      }
    }

    return true;
  }

  /**
   * 获取限流配置
   * 优先使用装饰器配置，否则使用默认配置
   */
  private getThrottleConfig(context: ExecutionContext): MultiThrottleConfig {
    const decoratorConfig = this.reflector.getAllAndOverride<MultiThrottleConfig>(THROTTLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (decoratorConfig) {
      return {
        ip: decoratorConfig.ip ?? DEFAULT_THROTTLE_CONFIG.ip,
        user: decoratorConfig.user ?? DEFAULT_THROTTLE_CONFIG.user,
        tenant: decoratorConfig.tenant ?? DEFAULT_THROTTLE_CONFIG.tenant,
      };
    }

    return DEFAULT_THROTTLE_CONFIG;
  }

  /**
   * 获取客户端 IP
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers?.['x-forwarded-for'];
    if (forwarded) {
      const ips = (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',');
      return ips[0].trim();
    }
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }

  /**
   * 检查限流
   * 使用 Redis 滑动窗口算法
   *
   * @param key Redis key
   * @param config 限流配置
   * @returns 限流结果
   */
  async checkLimit(key: string, config: ThrottleConfig): Promise<ThrottleResult> {
    const now = Date.now();
    const windowStart = now - config.ttl;

    // 获取当前计数
    const currentCount = await this.redisService.get(key);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    if (count >= config.limit) {
      // 获取剩余时间
      const ttl = await this.redisService.ttl(key);
      return {
        blocked: true,
        current: count,
        limit: config.limit,
        remaining: ttl > 0 ? ttl : Math.ceil(config.ttl / 1000),
      };
    }

    // 增加计数
    if (count === 0) {
      // 第一次请求，设置 key 和过期时间
      await this.redisService.set(key, '1', config.ttl);
    } else {
      // 增加计数，使用 Redis INCR 命令
      const client = this.redisService.getClient();
      await client.incr(key);
    }

    return {
      blocked: false,
      current: count + 1,
      limit: config.limit,
      remaining: 0,
    };
  }

  /**
   * 重置限流计数
   * 用于测试或管理目的
   *
   * @param key Redis key
   */
  async resetLimit(key: string): Promise<void> {
    await this.redisService.del(key);
  }

  /**
   * 获取当前限流状态
   *
   * @param key Redis key
   * @param config 限流配置
   * @returns 限流结果
   */
  async getStatus(key: string, config: ThrottleConfig): Promise<ThrottleResult> {
    const currentCount = await this.redisService.get(key);
    const count = currentCount ? parseInt(currentCount, 10) : 0;
    const ttl = await this.redisService.ttl(key);

    return {
      blocked: count >= config.limit,
      current: count,
      limit: config.limit,
      remaining: ttl > 0 ? ttl : 0,
    };
  }
}
