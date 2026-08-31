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
export function calculateBackoffDelay(
  attempt: number,
  options: Required<Pick<RetryOptions, 'backoff' | 'baseDelayMs' | 'maxDelayMs' | 'multiplier' | 'jitter'>>,
): number {
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
      delay = options.baseDelayMs * Math.pow(options.multiplier, attempt - 1);
      break;
  }

  delay = Math.min(delay, options.maxDelayMs);

  if (options.jitter) {
    const jitterRange = delay * 0.25;
    delay = delay + (Math.random() * 2 - 1) * jitterRange;
  }

  return Math.floor(delay);
}

/**
 * 检查异常是否应该重试
 */
export function shouldRetryError(
  error: Error,
  retryOn?: (new (...args: unknown[]) => Error)[],
  noRetryOn?: (new (...args: unknown[]) => Error)[],
): boolean {
  if (noRetryOn && noRetryOn.length > 0) {
    for (const ErrorType of noRetryOn) {
      if (error instanceof ErrorType) {
        return false;
      }
    }
  }

  if (retryOn && retryOn.length > 0) {
    for (const ErrorType of retryOn) {
      if (error instanceof ErrorType) {
        return true;
      }
    }
    return false;
  }

  return true;
}

/**
 * 延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 重试装饰器
 *
 * 通过 SetMetadata 存储重试配置，需要配合 RetryInterceptor 使用。
 *
 * @param options 重试配置选项
 *
 * @example
 * ```typescript
 * @Retry({ maxRetries: 3, backoff: BackoffStrategy.EXPONENTIAL })
 * async callExternalService() {
 *   return await this.httpService.get('https://api.example.com');
 * }
 * ```
 */
export function Retry(options?: RetryOptions): MethodDecorator {
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
 * @deprecated Use Retry() instead
 */
export const RetryMeta = Retry;

/**
 * 重试耗尽错误
 */
export class RetryExhaustedError extends Error {
  public readonly methodName: string;
  public readonly retryCount: number;
  public readonly lastError: Error;

  constructor(methodName: string, retryCount: number, lastError: Error) {
    super(`Method "${methodName}" failed after ${retryCount} retries. Last error: ${lastError.message}`);
    this.name = 'RetryExhaustedError';
    this.methodName = methodName;
    this.retryCount = retryCount;
    this.lastError = lastError;
  }
}
