import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * 慢查询日志配置
 */
export interface SlowQueryLoggerConfig {
  /**
   * 慢查询阈值（毫秒），超过此值的查询将被记录
   * @default 500
   */
  threshold?: number;

  /**
   * 是否启用慢查询日志
   * @default true
   */
  enabled?: boolean;
}

/**
 * 慢查询日志记录
 */
export interface SlowQueryLog {
  /** 查询语句 */
  query: string;
  /** 查询参数 */
  params: string;
  /** 执行时间（毫秒） */
  duration: number;
  /** 阈值（毫秒） */
  threshold: number;
  /** 时间戳 */
  timestamp: Date;
}

/**
 * 慢查询日志回调函数类型
 */
export type SlowQueryCallback = (log: SlowQueryLog) => void;

/**
 * 创建 Prisma 慢查询日志中间件
 *
 * 该中间件会拦截所有 Prisma 查询，记录执行时间超过阈值的查询。
 * 默认阈值为 500ms，符合需求 2.10 的要求。
 *
 * @param config 慢查询日志配置
 * @param callback 可选的回调函数，用于自定义日志处理
 * @returns Prisma 中间件
 *
 * @example
 * ```typescript
 * // 在 PrismaService 中使用
 * this.$use(createSlowQueryLoggerMiddleware({ threshold: 500 }));
 * ```
 */
export function createSlowQueryLoggerMiddleware(
  config: SlowQueryLoggerConfig = {},
  callback?: SlowQueryCallback,
): Prisma.Middleware {
  const logger = new Logger('SlowQueryLogger');
  const threshold = config.threshold ?? 500;
  const enabled = config.enabled ?? true;

  return async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
    if (!enabled) {
      return next(params);
    }

    const startTime = Date.now();

    try {
      const result = await next(params);
      const duration = Date.now() - startTime;

      if (duration >= threshold) {
        const slowQueryLog: SlowQueryLog = {
          query: `${params.model}.${params.action}`,
          params: JSON.stringify(params.args || {}),
          duration,
          threshold,
          timestamp: new Date(),
        };

        // 使用 Logger 记录慢查询
        logger.warn(
          `Slow query detected: ${slowQueryLog.query} took ${duration}ms (threshold: ${threshold}ms)`,
          {
            model: params.model,
            action: params.action,
            args: params.args,
            duration,
            threshold,
          },
        );

        // 如果提供了回调函数，调用它
        if (callback) {
          callback(slowQueryLog);
        }
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 即使查询失败，如果超过阈值也记录
      if (duration >= threshold) {
        logger.warn(
          `Slow query (failed): ${params.model}.${params.action} took ${duration}ms (threshold: ${threshold}ms)`,
          {
            model: params.model,
            action: params.action,
            args: params.args,
            duration,
            threshold,
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }

      throw error;
    }
  };
}

/**
 * 默认慢查询阈值（毫秒）
 */
export const DEFAULT_SLOW_QUERY_THRESHOLD = 500;
