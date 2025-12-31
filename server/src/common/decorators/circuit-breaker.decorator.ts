import { SetMetadata, Inject } from '@nestjs/common';
import {
  CircuitBreakerService,
  CircuitBreakerOptions,
  CircuitBreakerOpenError,
  CircuitBreakerIsolatedError,
} from '../resilience/circuit-breaker.service';
import { BrokenCircuitError, IsolatedCircuitError } from 'cockatiel';

/**
 * 熔断器装饰器元数据键
 */
export const CIRCUIT_BREAKER_KEY = 'CIRCUIT_BREAKER';

/**
 * 熔断器装饰器选项
 */
export interface CircuitBreakerDecoratorOptions extends CircuitBreakerOptions {
  /**
   * 熔断器名称，如果不提供则使用 className.methodName 作为名称
   */
  name?: string;
  /**
   * 熔断时的降级函数，返回降级值
   * 如果不提供，则抛出 CircuitBreakerOpenError
   */
  fallback?: (...args: unknown[]) => unknown | Promise<unknown>;
}

/**
 * 熔断器装饰器（元数据版本）
 *
 * @description 用于标记方法需要熔断器保护，需要配合 CircuitBreakerInterceptor 使用
 *
 * @example
 * ```typescript
 * @CircuitBreakerMeta({ threshold: 3, cooldownMs: 10000 })
 * async callExternalService() {
 *   return await this.httpService.get('https://api.example.com');
 * }
 * ```
 */
export function CircuitBreakerMeta(options?: CircuitBreakerDecoratorOptions): MethodDecorator {
  return SetMetadata(CIRCUIT_BREAKER_KEY, {
    name: options?.name,
    threshold: options?.threshold ?? 5,
    cooldownMs: options?.cooldownMs ?? 30000,
    fallback: options?.fallback,
  });
}

/**
 * 熔断器装饰器（方法包装版本）
 *
 * @description 直接包装方法，提供熔断器保护
 * 使用此装饰器的类需要注入 CircuitBreakerService
 *
 * @param options 熔断器配置选项
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ExternalApiService {
 *   constructor(private readonly circuitBreakerService: CircuitBreakerService) {}
 *
 *   @CircuitBreaker({ name: 'external-api', threshold: 3, cooldownMs: 10000 })
 *   async callExternalApi() {
 *     return await this.httpService.get('https://api.example.com');
 *   }
 *
 *   // 带降级函数
 *   @CircuitBreaker({
 *     name: 'weather-api',
 *     threshold: 5,
 *     fallback: () => ({ temperature: 'N/A', status: 'unavailable' })
 *   })
 *   async getWeather() {
 *     return await this.weatherService.getCurrentWeather();
 *   }
 * }
 * ```
 */
export function CircuitBreaker(options?: CircuitBreakerDecoratorOptions): MethodDecorator {
  const injectCircuitBreaker = Inject(CircuitBreakerService);

  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    // 注入 CircuitBreakerService
    injectCircuitBreaker(target, 'circuitBreakerService');

    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);
    const breakerName = options?.name ?? `${className}.${methodName}`;

    descriptor.value = async function (this: { circuitBreakerService: CircuitBreakerService }, ...args: unknown[]) {
      // 获取或创建熔断器
      const breaker = this.circuitBreakerService.getOrCreateBreaker(breakerName, {
        threshold: options?.threshold ?? 5,
        cooldownMs: options?.cooldownMs ?? 30000,
      });

      try {
        // 通过熔断器执行原方法
        return await breaker.execute(async () => {
          return await originalMethod.apply(this, args);
        });
      } catch (error) {
        // 检查是否是熔断器相关错误（先检查 IsolatedCircuitError，因为它继承自 BrokenCircuitError）
        const isIsolatedError = error instanceof IsolatedCircuitError;
        const isBrokenError = error instanceof BrokenCircuitError;

        // 如果是熔断器打开错误且有降级函数，执行降级
        if ((isIsolatedError || isBrokenError) && options?.fallback) {
          return await options.fallback(...args);
        }

        // 重新包装 cockatiel 的错误为我们自定义的错误
        if (isIsolatedError) {
          throw new CircuitBreakerIsolatedError(breakerName);
        }
        if (isBrokenError) {
          throw new CircuitBreakerOpenError(breakerName);
        }

        throw error;
      }
    };

    return descriptor;
  };
}

// 重新导出错误类型，方便使用
export { CircuitBreakerOpenError, CircuitBreakerIsolatedError };
