import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  BackoffStrategy,
  calculateBackoffDelay,
  RETRY_KEY,
  RetryExhaustedError,
  RetryOptions,
  shouldRetryError,
  sleep,
} from 'src/core/http/decorators/retry.decorator';

/**
 * 重试拦截器
 *
 * @description 配合 @Retry() 装饰器使用，自动对失败的方法调用进行重试
 *
 * 特性：
 * - 支持固定、线性、指数退避策略
 * - 支持随机抖动防止惊群效应
 * - 支持按异常类型过滤是否重试
 * - 支持重试前回调
 * - 所有重试耗尽后抛出 RetryExhaustedError
 *
 * @example
 * ```typescript
 * // 在 AppModule 或特定模块中注册
 * { provide: APP_INTERCEPTOR, useClass: RetryInterceptor }
 *
 * // 在 Controller 或 Service 方法上使用
 * @Retry({ maxRetries: 3, backoff: BackoffStrategy.EXPONENTIAL })
 * async callExternalApi() { ... }
 * ```
 */
@Injectable()
export class RetryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RetryInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const retryOptions = this.reflector.get<RetryOptions>(RETRY_KEY, context.getHandler());

    // 没有 @Retry() 装饰器，直接执行
    if (!retryOptions) {
      return next.handle();
    }

    const options = this.normalizeOptions(retryOptions);
    const methodName = `${context.getClass().name}.${context.getHandler().name}`;

    return next.handle().pipe(catchError((error) => this.handleRetry(error, methodName, options, next)));
  }

  /**
   * 处理重试逻辑
   */
  private async handleRetry(
    error: Error,
    methodName: string,
    options: Required<Omit<RetryOptions, 'retryOn' | 'noRetryOn' | 'onRetry'>> &
      Pick<RetryOptions, 'retryOn' | 'noRetryOn' | 'onRetry'>,
    next: CallHandler,
  ): Promise<any> {
    let lastError = error;

    for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
      // 检查错误是否应该重试
      if (!shouldRetryError(lastError, options.retryOn, options.noRetryOn)) {
        this.logger.debug(`[${methodName}] Error type ${lastError.constructor.name} is not retryable, skipping retry`);
        throw lastError;
      }

      // 计算延迟
      const delay = calculateBackoffDelay(attempt, {
        backoff: options.backoff,
        baseDelayMs: options.baseDelayMs,
        maxDelayMs: options.maxDelayMs,
        multiplier: options.multiplier,
        jitter: options.jitter,
      });

      this.logger.warn(
        `[${methodName}] Attempt ${attempt}/${options.maxRetries} failed: ${lastError.message}. ` +
          `Retrying in ${delay}ms...`,
      );

      // 执行重试前回调
      if (options.onRetry) {
        try {
          await options.onRetry(lastError, attempt);
        } catch (callbackError) {
          this.logger.warn(
            `[${methodName}] onRetry callback failed: ${callbackError instanceof Error ? callbackError.message : 'Unknown error'}`,
          );
        }
      }

      // 等待退避时间
      await sleep(delay);

      try {
        // 重试执行 - 将 Observable 转为 Promise
        const result = await new Promise((resolve, reject) => {
          next.handle().subscribe({
            next: (value) => resolve(value),
            error: (err) => reject(err),
          });
        });
        this.logger.log(`[${methodName}] Retry attempt ${attempt} succeeded`);
        return result;
      } catch (retryError) {
        lastError = retryError instanceof Error ? retryError : new Error(String(retryError));
      }
    }

    // 所有重试都失败了
    this.logger.error(
      `[${methodName}] All ${options.maxRetries} retry attempts exhausted. Last error: ${lastError.message}`,
    );
    throw new RetryExhaustedError(methodName, options.maxRetries, lastError);
  }

  /**
   * 标准化重试选项，确保所有必填字段都有默认值
   */
  private normalizeOptions(options: RetryOptions) {
    return {
      maxRetries: options.maxRetries ?? 3,
      backoff: options.backoff ?? BackoffStrategy.EXPONENTIAL,
      baseDelayMs: options.baseDelayMs ?? 1000,
      maxDelayMs: options.maxDelayMs ?? 30000,
      multiplier: options.multiplier ?? 2,
      jitter: options.jitter ?? true,
      retryOn: options.retryOn,
      noRetryOn: options.noRetryOn,
      onRetry: options.onRetry,
    };
  }
}
