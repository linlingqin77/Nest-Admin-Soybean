import { SetMetadata } from '@nestjs/common';
import { MultiThrottleConfig, THROTTLE_KEY, SKIP_THROTTLE_KEY } from '../guards/multi-throttle.guard';

/**
 * 限流装饰器
 *
 * @description
 * 用于配置方法或控制器的限流规则
 * 可以分别配置 IP、用户、租户三个维度的限流
 *
 * @example
 * ```typescript
 * // 自定义 IP 限流
 * @Throttle({ ip: { ttl: 60000, limit: 10 } })
 * async login() {}
 *
 * // 自定义多维度限流
 * @Throttle({
 *   ip: { ttl: 60000, limit: 10 },
 *   user: { ttl: 60000, limit: 50 },
 *   tenant: { ttl: 60000, limit: 500 }
 * })
 * async sensitiveOperation() {}
 * ```
 *
 * @param config 限流配置
 */
export const Throttle = (config: MultiThrottleConfig) => SetMetadata(THROTTLE_KEY, config);

/**
 * 跳过限流装饰器
 *
 * @description
 * 用于标记不需要限流的方法或控制器
 *
 * @example
 * ```typescript
 * @SkipThrottle()
 * async healthCheck() {}
 * ```
 */
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
