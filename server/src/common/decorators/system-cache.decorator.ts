import { SetMetadata } from '@nestjs/common';
import { RedisService } from 'src/module/common/redis/redis.service';

/**
 * 系统级缓存键前缀
 */
const SYSTEM_CACHE_PREFIX = '';

/**
 * SystemCacheable 装饰器 - 系统级缓存（不包含租户ID）
 *
 * 用于缓存系统级配置和数据，缓存键不包含 tenant_id
 * 适用于：
 * 1. 系统配置（验证码开关、系统参数等）
 * 2. 全局字典数据
 * 3. 其他跨租户的系统级数据
 *
 * 与 @Cacheable 的区别：
 * - @Cacheable: 缓存键包含 tenant_id，用于租户级数据
 * - @SystemCacheable: 缓存键不包含 tenant_id，用于系统级数据
 *
 * @param options 缓存配置
 * @param options.key 缓存键，可以是字符串或函数
 * @param options.ttl 过期时间（秒），默认3600秒（1小时）
 *
 * @example
 * ```typescript
 * @SystemCacheable({
 *   key: (args) => `system:config:${args[0]}`,
 *   ttl: 3600
 * })
 * async getSystemConfig(configKey: string) {
 *   return await this.systemPrisma.sysSystemConfig.findUnique({
 *     where: { configKey }
 *   });
 * }
 * ```
 */
export function SystemCacheable(options: { key: string | ((args: any[]) => string); ttl?: number }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 获取 RedisService 实例
      const redisService: RedisService = this.redisService || this.moduleRef?.get(RedisService);

      if (!redisService) {
        // 如果没有 Redis 服务，直接执行原方法
        return originalMethod.apply(this, args);
      }

      // 生成缓存键（不包含租户ID）
      const cacheKey = typeof options.key === 'function' ? options.key(args) : options.key;

      const fullKey = `${SYSTEM_CACHE_PREFIX}${cacheKey}`;

      try {
        // 尝试从缓存获取
        const cached = await redisService.get(fullKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        // 缓存读取失败，继续执行原方法
        console.warn(`[SystemCacheable] Cache read error for key ${fullKey}:`, error);
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 写入缓存
      if (result !== null && result !== undefined) {
        try {
          await redisService.set(fullKey, JSON.stringify(result), options.ttl || 3600);
        } catch (error) {
          // 缓存写入失败不影响业务逻辑
          console.warn(`[SystemCacheable] Cache write error for key ${fullKey}:`, error);
        }
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * ClearSystemCache 装饰器 - 清除系统级缓存
 *
 * 用于在更新系统配置后清除相关缓存
 *
 * @param keys 要清除的缓存键数组，支持通配符
 *
 * @example
 * ```typescript
 * @ClearSystemCache(['system:config:*'])
 * async updateSystemConfig(configKey: string, configValue: string) {
 *   return await this.systemPrisma.sysSystemConfig.update({
 *     where: { configKey },
 *     data: { configValue }
 *   });
 * }
 * ```
 */
export function ClearSystemCache(keys: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // 执行原方法
      const result = await originalMethod.apply(this, args);

      // 清除缓存
      const redisService: RedisService = this.redisService || this.moduleRef?.get(RedisService);

      if (redisService) {
        for (const key of keys) {
          try {
            const fullKey = `${SYSTEM_CACHE_PREFIX}${key}`;
            if (key.includes('*')) {
              // 支持通配符删除
              const matchedKeys = await redisService.keys(fullKey);
              if (matchedKeys && matchedKeys.length > 0) {
                await redisService.del(matchedKeys);
              }
            } else {
              await redisService.del(fullKey);
            }
          } catch (error) {
            console.warn(`[ClearSystemCache] Cache clear error for key ${key}:`, error);
          }
        }
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * SystemCache 元数据键
 */
export const SYSTEM_CACHE_KEY = 'system:cache';

/**
 * 设置系统缓存元数据
 */
export const SystemCache = (metadata: { key: string | ((args: any[]) => string); ttl?: number }) =>
  SetMetadata(SYSTEM_CACHE_KEY, metadata);
