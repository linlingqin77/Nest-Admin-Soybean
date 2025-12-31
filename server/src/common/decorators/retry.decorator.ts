import { SetMetadata } from '@nestjs/common';

/**
 * 重试装饰器元数据键
 */
export const RETRY_KEY = 'RETRY';

/**
 * 退避策略类型
 */
export enum BackoffStrategy {
  /** 固定间隔 */
  FIXED = 'fixed',
  /** 线性增长 */
  LINEAR = 'linear',
  /** 指数增长 */
  EXPONENTIAL = 'exponential',
}

/**
 * 重试装饰器选项
 */
export interface RetryOptions {
  /**
   * 最大重试次数，默认 3 次
   */
  maxRetries?: number;
  /**
   * 退避策略，默认指数退避
   */
  backoff?: BackoffStrategy;
  /**
   * 基础延迟时间（毫秒），默认 1000ms
   */
  baseDelayMs?: number;
  /**
   * 最大延迟时间（毫秒），默认 30000ms
   */
  maxDelayMs?: number;
  /**
   * 指数退避的乘数因子，默认 2
   */
  multiplier?: number;
  /**
   * 是否添加随机抖动，默认 true
   * 抖动可以防止多个客户端同时重试导致的"惊群效应"
   */
  jitter?: boolean;
  /**
   * 需要重试的异常类型，默认重试所有异常
   */
  retryOn?: (new (...args: unknown[]) => Error)[];
  /**
   * 不需要重试的异常类型
   */
  noRetryOn?: (new (...args: unknown[]) => Error)[];
  /**
   * 重试前的回调函数
   */
  onRetry?: (error: Error, attempt: number) => void | Promise<void>;
}

/**
 * 计算退避延迟时间
 *
 * @param attempt 当前重试次数（从 1 开始）
 * @param options 重试选项
 * @returns 延迟时间（毫秒）
 */
export function calculateBackoffDelay(attempt: number, options: Required<Pick<RetryOptions, 'backoff' | 'baseDelayMs' | 'maxDelayMs' | 'multiplier' | 'jitter'>>): number {
  let delay: number;

  switch (options.backoff) {
    case BackoffStrategy.FIXED:
      delay = options.baseDelayMs;
      break;
    case BackoffStrategy.LINEAR:
      delay = options.baseDelayMs * attempt;
      break;
    case BackoffStrategy.EXPONENTIAL:
    default:
      // 指数退避: baseDelay * multiplier^(attempt-1)
      delay = options.baseDelayMs * Math.pow(options.multiplier, attempt - 1);
      break;
  }

  // 应用最大延迟限制
  delay = Math.min(delay, options.maxDelayMs);

  // 添加随机抖动（±25%）
  if (options.jitter) {
    const jitterRange = delay * 0.25;
    delay = delay + (Math.random() * 2 - 1) * jitterRange;
  }

  return Math.floor(delay);
}

/**
 * 检查异常是否应该重试
 *
 * @param error 异常
 * @param retryOn 需要重试的异常类型
 * @param noRetryOn 不需要重试的异常类型
 * @returns 是否应该重试
 */
export function shouldRetryError(
  error: Error,
  retryOn?: (new (...args: unknown[]) => Error)[],
  noRetryOn?: (new (...args: unknown[]) => Error)[],
): boolean {
  // 如果指定了不重试的异常类型，检查是否匹配
  if (noRetryOn && noRetryOn.length > 0) {
    for (const ErrorType of noRetryOn) {
      if (error instanceof ErrorType) {
        return false;
      }
    }
  }

  // 如果指定了需要重试的异常类型，检查是否匹配
  if (retryOn && retryOn.length > 0) {
    for (const ErrorType of retryOn) {
      if (error instanceof ErrorType) {
        return true;
      }
    }
    return false;
  }

  // 默认重试所有异常
  return true;
}

/**
 * 延迟函数
 *
 * @param ms 延迟时间（毫秒）
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 重试装饰器（元数据版本）
 *
 * @description 用于标记方法需要重试保护，需要配合 RetryInterceptor 使用
 *
 * @example
 * ```typescript
 * @RetryMeta({ maxRetries: 3, backoff: BackoffStrategy.EXPONENTIAL })
 * async callExternalService() {
 *   return await this.httpService.get('https://api.example.com');
 * }
 * ```
 */
export function RetryMeta(options?: RetryOptions): MethodDecorator {
  return SetMetadata(RETRY_KEY, {
    maxRetries: options?.maxRetries ?? 3,
    backoff: options?.backoff ?? BackoffStrategy.EXPONENTIAL,
    baseDelayMs: options?.baseDelayMs ?? 1000,
    maxDelayMs: options?.maxDelayMs ?? 30000,
    multiplier: options?.multiplier ?? 2,
    jitter: options?.jitter ?? true,
    retryOn: options?.retryOn,
    noRetryOn: options?.noRetryOn,
    onRetry: options?.onRetry,
  });
}

/**
 * 重试装饰器（方法包装版本）
 *
 * @description 直接包装方法，提供重试保护
 * 支持配置重试次数和指数退避策略
 *
 * @param options 重试配置选项
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ExternalApiService {
 *   // 基本用法：默认 3 次重试，指数退避
 *   @Retry()
 *   async callExternalApi() {
 *     return await this.httpService.get('https://api.example.com');
 *   }
 *
 *   // 自定义配置
 *   @Retry({
 *     maxRetries: 5,
 *     backoff: BackoffStrategy.EXPONENTIAL,
 *     baseDelayMs: 500,
 *     maxDelayMs: 10000,
 *     multiplier: 2,
 *   })
 *   async callUnstableService() {
 *     return await this.unstableService.getData();
 *   }
 *
 *   // 只对特定异常重试
 *   @Retry({
 *     maxRetries: 3,
 *     retryOn: [NetworkError, TimeoutError],
 *   })
 *   async callWithSpecificRetry() {
 *     return await this.service.call();
 *   }
 *
 *   // 带重试回调
 *   @Retry({
 *     maxRetries: 3,
 *     onRetry: (error, attempt) => {
 *       console.log(`Retry attempt ${attempt} due to: ${error.message}`);
 *     },
 *   })
 *   async callWithCallback() {
 *     return await this.service.call();
 *   }
 * }
 * ```
 */
export function Retry(options?: RetryOptions): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const methodName = String(propertyKey);
    const className = target.constructor.name;

    // 合并默认选项
    const resolvedOptions = {
      maxRetries: options?.maxRetries ?? 3,
      backoff: options?.backoff ?? BackoffStrategy.EXPONENTIAL,
      baseDelayMs: options?.baseDelayMs ?? 1000,
      maxDelayMs: options?.maxDelayMs ?? 30000,
      multiplier: options?.multiplier ?? 2,
      jitter: options?.jitter ?? true,
      retryOn: options?.retryOn,
      noRetryOn: options?.noRetryOn,
      onRetry: options?.onRetry,
    };

    descriptor.value = async function (...args: unknown[]) {
      let lastError: Error | undefined;

      for (let attempt = 1; attempt <= resolvedOptions.maxRetries + 1; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;

          // 检查是否应该重试
          if (!shouldRetryError(lastError, resolvedOptions.retryOn, resolvedOptions.noRetryOn)) {
            throw lastError;
          }

          // 如果已经是最后一次尝试，抛出异常
          if (attempt > resolvedOptions.maxRetries) {
            throw new RetryExhaustedError(
              `${className}.${methodName}`,
              resolvedOptions.maxRetries,
              lastError,
            );
          }

          // 执行重试回调
          if (resolvedOptions.onRetry) {
            await resolvedOptions.onRetry(lastError, attempt);
          }

          // 计算延迟时间并等待
          const delay = calculateBackoffDelay(attempt, resolvedOptions);
          await sleep(delay);
        }
      }

      // 这行代码理论上不会执行，但为了类型安全
      throw lastError;
    };

    return descriptor;
  };
}

/**
 * 重试耗尽错误
 *
 * @description 当所有重试次数都用完后抛出此错误
 */
export class RetryExhaustedError extends Error {
  /**
   * 方法名称
   */
  public readonly methodName: string;

  /**
   * 重试次数
   */
  public readonly retryCount: number;

  /**
   * 最后一次错误
   */
  public readonly lastError: Error;

  constructor(methodName: string, retryCount: number, lastError: Error) {
    super(`Method "${methodName}" failed after ${retryCount} retries. Last error: ${lastError.message}`);
    this.name = 'RetryExhaustedError';
    this.methodName = methodName;
    this.retryCount = retryCount;
    this.lastError = lastError;
  }
}
