import { Inject } from '@nestjs/common';
import { RedisService } from 'src/module/common/redis/redis.service';
import { paramsKeyFormat } from '../utils/decorator';

/** 随机过期时间偏移范围（秒） */
const JITTER_RANGE = 300; // 5分钟

/**
 * 添加随机过期偏移（防雪崩）
 */
function addJitter(baseTtl: number): number {
  const jitter = Math.floor(Math.random() * JITTER_RANGE);
  return baseTtl + jitter;
}

/**
 * 缓存失效装饰器
 * 
 * @param CACHE_NAME - 缓存键前缀
 * @param CACHE_KEY - 缓存键模板，支持 {param} 占位符
 * @example
 * @CacheEvict(CacheEnum.SYS_USER_KEY, '{userId}')
 * async updateUser(userId: number) { }
 * 
 * @CacheEvict(CacheEnum.SYS_USER_KEY, '*')
 * async clearAllUserCache() { }
 */
export function CacheEvict(CACHE_NAME: string, CACHE_KEY: string) {
  const injectRedis = Inject(RedisService);

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    injectRedis(target, 'redis');

    const originMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = paramsKeyFormat(originMethod, CACHE_KEY, args);

      if (key === '*') {
        const res = await this.redis.keys(`${CACHE_NAME}*`);
        if (res.length) {
          await this.redis.del(res);
        }
      } else if (key !== null) {
        await this.redis.del(`${CACHE_NAME}${key}`);
      } else {
        await this.redis.del(`${CACHE_NAME}${CACHE_KEY}`);
      }

      return await originMethod.apply(this, args);
    };
  };
}

/**
 * 批量缓存失效装饰器
 * 
 * @param configs - 多个缓存键配置
 * @example
 * @CacheEvictMultiple([
 *   { name: CacheEnum.SYS_USER_KEY, key: '{userId}' },
 *   { name: CacheEnum.SYS_ROLE_KEY, key: '{roleId}' },
 * ])
 */
export function CacheEvictMultiple(configs: Array<{ name: string; key: string }>) {
  const injectRedis = Inject(RedisService);

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    injectRedis(target, 'redis');

    const originMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      for (const config of configs) {
        const key = paramsKeyFormat(originMethod, config.key, args);

        if (key === '*') {
          const res = await this.redis.keys(`${config.name}*`);
          if (res.length) {
            await this.redis.del(res);
          }
        } else if (key !== null) {
          await this.redis.del(`${config.name}${key}`);
        }
      }

      return await originMethod.apply(this, args);
    };
  };
}

/**
 * 缓存装饰器（带防雪崩机制）
 * 
 * @param CACHE_NAME - 缓存键前缀
 * @param CACHE_KEY - 缓存键模板，支持 {param} 占位符
 * @param CACHE_EXPIRESIN - 过期时间（秒），默认3600秒
 * @example
 * @Cacheable(CacheEnum.SYS_USER_KEY, '{userId}', 3600)
 * async getUser(userId: number) { }
 */
export function Cacheable(CACHE_NAME: string, CACHE_KEY: string, CACHE_EXPIRESIN: number = 3600) {
  const injectRedis = Inject(RedisService);

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    injectRedis(target, 'redis');

    const originMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = paramsKeyFormat(originMethod, CACHE_KEY, args);

      if (key === null) {
        return await originMethod.apply(this, args);
      }

      const cacheResult = await this.redis.get(`${CACHE_NAME}${key}`);

      if (!cacheResult) {
        const result = await originMethod.apply(this, args);

        // 添加随机偏移防止缓存雪崩
        const ttl = addJitter(CACHE_EXPIRESIN);
        await this.redis.set(`${CACHE_NAME}${key}`, result, ttl);

        return result;
      }

      return cacheResult;
    };
  };
}

/**
 * 缓存更新装饰器 - 执行方法后更新缓存
 * 
 * @param CACHE_NAME - 缓存键前缀
 * @param CACHE_KEY - 缓存键模板
 * @param CACHE_EXPIRESIN - 过期时间（秒）
 */
export function CachePut(CACHE_NAME: string, CACHE_KEY: string, CACHE_EXPIRESIN: number = 3600) {
  const injectRedis = Inject(RedisService);

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    injectRedis(target, 'redis');

    const originMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originMethod.apply(this, args);

      const key = paramsKeyFormat(originMethod, CACHE_KEY, args);
      if (key !== null) {
        const ttl = addJitter(CACHE_EXPIRESIN);
        await this.redis.set(`${CACHE_NAME}${key}`, result, ttl);
      }

      return result;
    };
  };
}
