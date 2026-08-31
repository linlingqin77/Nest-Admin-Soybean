import { SetMetadata } from '@nestjs/common';
import {
  CircuitBreakerService,
  CircuitBreakerOptions,
  CircuitBreakerOpenError,
  CircuitBreakerIsolatedError,
} from 'src/platform/resilience/circuit-breaker/circuit-breaker.service';
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
 * 使用此装饰器的类必须在构造函数中注入 CircuitBreakerService。
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
 * }
 * ```
 */
export function CircuitBreaker(options?: CircuitBreakerDecoratorOptions): MethodDecorator {
  return function (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);
    const breakerName = options?.name ?? `${className}.${methodName}`;

    descriptor.value = async function (this: { circuitBreakerService: CircuitBreakerService }, ...args: unknown[]) {
      if (!this.circuitBreakerService) {
        throw new Error(
          `CircuitBreakerService not found on ${className}. ` +
            `Ensure the class injects CircuitBreakerService in its constructor.`,
        );
      }

      const breaker = this.circuitBreakerService.getOrCreateBreaker(breakerName, {
        threshold: options?.threshold ?? 5,
        cooldownMs: options?.cooldownMs ?? 30000,
      });

      try {
        return await breaker.execute(async () => {
          return await originalMethod.apply(this, args);
        });
      } catch (error) {
        const isIsolatedError = error instanceof IsolatedCircuitError;
        const isBrokenError = error instanceof BrokenCircuitError;

        if ((isIsolatedError || isBrokenError) && options?.fallback) {
          return await options.fallback(...args);
        }

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
