import { Prisma } from '@prisma/client';
import { Logger } from '@nestjs/common';

/**
 * 慢查询日志配置
 */
export interface SlowQueryExtensionConfig {
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
 * 默认慢查询阈值（毫秒）
 */
export const DEFAULT_SLOW_QUERY_THRESHOLD = 500;

const logger = new Logger('SlowQueryExtension');

/**
 * 创建慢查询日志扩展
 *
 * 使用 Prisma $extends API 替代已弃用的 $use 中间件
 * 记录执行时间超过阈值的查询，默认阈值为 500ms
 *
 * @param config 慢查询日志配置
 * @param callback 可选的回调函数，用于自定义日志处理
 * @returns Prisma 扩展配置
 */
export function createSlowQueryExtension(config: SlowQueryExtensionConfig = {}, callback?: SlowQueryCallback) {
  const threshold = config.threshold ?? DEFAULT_SLOW_QUERY_THRESHOLD;
  const enabled = config.enabled ?? true;

  return Prisma.defineExtension({
    name: 'slow-query-extension',
    query: {
      $allOperations({ model, operation, args, query }) {
        if (!enabled) {
          return query(args);
        }

        const startTime = Date.now();

        return query(args)
          .then((result) => {
            const duration = Date.now() - startTime;

            if (duration >= threshold) {
              const slowQueryLog: SlowQueryLog = {
                query: `${model}.${operation}`,
                params: JSON.stringify(args || {}),
                duration,
                threshold,
                timestamp: new Date(),
              };

              logger.warn(`Slow query detected: ${slowQueryLog.query} took ${duration}ms (threshold: ${threshold}ms)`, {
                model,
                operation,
                args,
                duration,
                threshold,
              });

              if (callback) {
                callback(slowQueryLog);
              }
            }

            return result;
          })
          .catch((error) => {
            const duration = Date.now() - startTime;

            if (duration >= threshold) {
              logger.warn(`Slow query (failed): ${model}.${operation} took ${duration}ms (threshold: ${threshold}ms)`, {
                model,
                operation,
                args,
                duration,
                threshold,
                error: error instanceof Error ? error.message : String(error),
              });
            }

            throw error;
          });
      },
    },
  });
}
