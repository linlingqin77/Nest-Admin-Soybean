import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RedisService } from 'src/platform/redis/redis.service';

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
 * 原子性限流 Lua 脚本
 *
 * 使用 Redis INCR + PEXPIRE 实现固定窗口计数器。
 * 所有操作在一个 Lua 脚本中原子执行，避免高并发下的竞态条件。
 *
 * KEYS[1]: 限流 key
 * ARGV[1]: 最大请求数 (limit)
 * ARGV[2]: 窗口时间 (TTL, 毫秒)
 *
 * 返回值:
 * - 如果未超限: 返回 -1
 * - 如果超限: 返回剩余 TTL (毫秒)
 */
const THROTTLE_LUA_SCRIPT = `
  local key = KEYS[1]
  local limit = tonumber(ARGV[1])
  local ttl = tonumber(ARGV[2])
  local current = redis.call('INCR', key)
  if current == 1 then
    redis.call('PEXPIRE', key, ttl)
  end
  if current > limit then
    return redis.call('PTTL', key)
  end
  return -1
`;

/**
 * 多维度限流守卫
 *
 * @description
 * 实现 IP、用户、租户三个维度的限流控制。
 * 使用 Redis 固定窗口计数器 + Lua 脚本保证原子性。
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
   * 检查限流 — 使用 Redis Lua 脚本保证原子性
   *
   * 使用固定窗口计数器算法:
   * 1. 原子递增计数
   * 2. 首次请求时设置过期时间
   * 3. 超过限制则返回剩余 TTL
   *
   * @param key Redis key
   * @param config 限流配置
   * @returns 限流结果
   */
  async checkLimit(key: string, config: ThrottleConfig): Promise<ThrottleResult> {
    const client = this.redisService.getClient();

    // 使用 Lua 脚本原子执行 INCR + PEXPIRE + 限流判断
    const result = await client.eval(
      THROTTLE_LUA_SCRIPT,
      1,
      key,
      String(config.limit),
      String(config.ttl),
    ) as number;

    if (result > 0) {
      // 被限流，result 是剩余 TTL (毫秒)
      const remainingSeconds = Math.ceil(result / 1000);
      return {
        blocked: true,
        current: config.limit + 1,
        limit: config.limit,
        remaining: remainingSeconds,
      };
    }

    // 未被限流
    return {
      blocked: false,
      current: 0, // Lua 脚本不返回当前计数，这里不重要
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
      remaining: ttl !== null && ttl > 0 ? ttl : 0,
    };
  }
}
