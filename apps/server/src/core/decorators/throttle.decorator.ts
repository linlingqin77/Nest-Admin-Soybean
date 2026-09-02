import { applyDecorators, SetMetadata } from '@nestjs/common';
import { SkipThrottle as NestSkipThrottle, Throttle as NestThrottle } from '@nestjs/throttler';
import { MultiThrottleConfig, SKIP_THROTTLE_KEY, THROTTLE_KEY } from 'src/core/http/guards/multi-throttle.guard';

/**
 * 限流配置选项（用于 @nestjs/throttler）
 */
export interface ThrottleOptions {
  /** 时间窗口（毫秒），默认 60000 (1分钟) */
  ttl?: number;
  /** 时间窗口内允许的最大请求数，默认 100 */
  limit?: number;
  /** 被限流后的阻塞时间（毫秒），默认等于 ttl */
  blockDuration?: number;
}

/**
 * 接口级别限流装饰器
 *
 * @description
 * 用于在 Controller 方法上配置不同的限流参数，覆盖全局限流配置。
 * 基于 @nestjs/throttler 实现，支持方法级别和类级别的配置。
 *
 * @example
 * ```typescript
 * // 1. 基本用法 - 覆盖全局限流配置
 * @ApiThrottle({ ttl: 60000, limit: 10 })
 * async login() {}
 *
 * // 2. 严格限流 - 敏感操作
 * @ApiThrottle({ ttl: 60000, limit: 5, blockDuration: 300000 })
 * async resetPassword() {}
 *
 * // 3. 宽松限流 - 高频接口
 * @ApiThrottle({ ttl: 60000, limit: 1000 })
 * async getList() {}
 *
 * // 4. 在 Controller 类上使用 - 对整个控制器生效
 * @ApiThrottle({ ttl: 60000, limit: 50 })
 * @Controller('api')
 * export class ApiController {}
 * ```
 *
 * @param options 限流配置选项
 * @returns 方法装饰器或类装饰器
 */
export function ApiThrottle(options: ThrottleOptions): MethodDecorator & ClassDecorator {
  const { ttl = 60000, limit = 100, blockDuration } = options;

  // 使用 @nestjs/throttler 的 Throttle 装饰器
  // 'default' 是默认的限流器名称
  return NestThrottle({
    default: {
      ttl,
      limit,
      blockDuration,
    },
  });
}

/**
 * 跳过限流装饰器
 *
 * @description
 * 用于标记不需要限流的方法或控制器。
 * 基于 @nestjs/throttler 实现。
 *
 * @example
 * ```typescript
 * // 1. 跳过方法的限流
 * @ApiSkipThrottle()
 * async healthCheck() {}
 *
 * // 2. 跳过整个控制器的限流
 * @ApiSkipThrottle()
 * @Controller('health')
 * export class HealthController {}
 * ```
 *
 * @returns 方法装饰器或类装饰器
 */
export function ApiSkipThrottle(): MethodDecorator & ClassDecorator {
  return NestSkipThrottle({ default: true });
}

// ============================================================================
// 以下是多维度限流装饰器（配合 MultiThrottleGuard 使用）
// ============================================================================

/**
 * 多维度限流装饰器
 *
 * @description
 * 用于配置方法或控制器的多维度限流规则。
 * 可以分别配置 IP、用户、租户三个维度的限流。
 * 需要配合 MultiThrottleGuard 使用。
 *
 * @example
 * ```typescript
 * // 自定义 IP 限流
 * @UseGuards(MultiThrottleGuard)
 * @MultiThrottle({ ip: { ttl: 60000, limit: 10 } })
 * async login() {}
 *
 * // 自定义多维度限流
 * @UseGuards(MultiThrottleGuard)
 * @MultiThrottle({
 *   ip: { ttl: 60000, limit: 10 },
 *   user: { ttl: 60000, limit: 50 },
 *   tenant: { ttl: 60000, limit: 500 }
 * })
 * async sensitiveOperation() {}
 * ```
 *
 * @param config 多维度限流配置
 */
export const MultiThrottle = (config: MultiThrottleConfig) => SetMetadata(THROTTLE_KEY, config);

/**
 * 跳过多维度限流装饰器
 *
 * @description
 * 用于标记不需要多维度限流的方法或控制器。
 * 需要配合 MultiThrottleGuard 使用。
 *
 * @example
 * ```typescript
 * @UseGuards(MultiThrottleGuard)
 * @SkipMultiThrottle()
 * async healthCheck() {}
 * ```
 */
export const SkipMultiThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);

// ============================================================================
// 重新导出 @nestjs/throttler 的原始装饰器（保持向后兼容）
// ============================================================================

/**
 * @deprecated 请使用 ApiThrottle 或 MultiThrottle
 * 保留此导出以保持向后兼容
 */
export const Throttle = MultiThrottle;

/**
 * @deprecated 请使用 ApiSkipThrottle 或 SkipMultiThrottle
 * 保留此导出以保持向后兼容
 */
export const SkipThrottle = SkipMultiThrottle;
