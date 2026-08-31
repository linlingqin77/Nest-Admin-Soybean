import { Inject } from '@nestjs/common';
import { RedisService } from '../../../platform/redis/redis.service';
import { TenantContext } from '../../tenancy/context/tenant.context';

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
 * 基于参数索引的 key 解析
 *
 * 支持的模板格式:
 * - `'{0}'` — 第一个参数值
 * - `'{0.userId}'` — 第一个参数的 userId 属性
 * - `'prefix:{0}'` — 静态前缀 + 第一个参数
 * - `'prefix:{0}-{1}'` — 多参数
 * - `'staticKey'` — 无占位符，直接使用
 * - `'*'` — 通配符（用于缓存清除）
 *
 * @param template 缓存 key 模板
 * @param args 方法参数列表
 * @returns 解析后的 key，如果参数值为 undefined/null 则返回 null
 */
function resolveKey(template: string, args: unknown[]): string | null {
  // 通配符直接返回
  if (template === '*') return '*';

  // 无占位符，直接返回
  if (!template.includes('{')) return template;

  let hasUndefined = false;

  const resolved = template.replace(/\{(\d+)(?:\.([^}]+))?\}/g, (_match, indexStr, prop) => {
    const index = Number(indexStr);
    const arg = args[index];

    if (arg === undefined || arg === null) {
      hasUndefined = true;
      return '';
    }

    if (prop) {
      // 支持嵌套属性访问 (e.g., {0.userId})
      const value = (arg as Record<string, unknown>)[prop];
      if (value === undefined || value === null) {
        hasUndefined = true;
        return '';
      }
      return String(value);
    }

    return String(arg);
  });

  return hasUndefined ? null : resolved;
}

/**
 * 缓存失效装饰器
 *
 * @param CACHE_NAME - 缓存键前缀
 * @param CACHE_KEY - 缓存键模板，支持 {index} 和 {index.prop} 占位符
 * @example
 * @CacheEvict(CacheEnum.SYS_USER_KEY, '{0}')
 * async updateUser(userId: number) { }
 *
 * @CacheEvict(CacheEnum.SYS_USER_KEY, '*')
 * async clearAllUserCache() { }
 */
export function CacheEvict(CACHE_NAME: string, CACHE_KEY: string) {
  const injectRedis = Inject(RedisService);

  return function <T extends object>(target: T, propertyKey: string, descriptor: PropertyDescriptor) {
    injectRedis(target, 'redisService');

    const originMethod = descriptor.value;

    descriptor.value = async function (this: T & { redisService: RedisService }, ...args: unknown[]) {
      const key = resolveKey(CACHE_KEY, args);

      if (key === '*') {
        const res = await this.redisService.keys(`${CACHE_NAME}*`);
        if (res.length) {
          await this.redisService.del(res);
        }
      } else if (key !== null) {
        const tenantId = TenantContext.getTenantId();
        const fullKey = tenantId ? `${CACHE_NAME}${tenantId}:${key}` : `${CACHE_NAME}${key}`;
        await this.redisService.del(fullKey);
      } else {
        const tenantId = TenantContext.getTenantId();
        const fullKey = tenantId ? `${CACHE_NAME}${tenantId}:${CACHE_KEY}` : `${CACHE_NAME}${CACHE_KEY}`;
        await this.redisService.del(fullKey);
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
 *   { name: CacheEnum.SYS_USER_KEY, key: '{0}' },
 *   { name: CacheEnum.SYS_ROLE_KEY, key: '{1}' },
 * ])
 */
export function CacheEvictMultiple(configs: Array<{ name: string; key: string }>) {
  const injectRedis = Inject(RedisService);

  return function <T extends object>(target: T, propertyKey: string, descriptor: PropertyDescriptor) {
    injectRedis(target, 'redisService');

    const originMethod = descriptor.value;

    descriptor.value = async function (this: T & { redisService: RedisService }, ...args: unknown[]) {
      for (const config of configs) {
        const key = resolveKey(config.key, args);

        if (key === '*') {
          const res = await this.redisService.keys(`${config.name}*`);
          if (res.length) {
            await this.redisService.del(res);
          }
        } else if (key !== null) {
          await this.redisService.del(`${config.name}${key}`);
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
 * @param CACHE_KEY - 缓存键模板，支持 {index} 和 {index.prop} 占位符
 * @param CACHE_EXPIRESIN - 过期时间（秒），默认3600秒
 * @example
 * @Cacheable(CacheEnum.SYS_USER_KEY, '{0}', 3600)
 * async getUser(userId: number) { }
 *
 * @Cacheable(CacheEnum.SYS_DEPT_KEY, 'scope:{0}-{1}')
 * async findByScope(deptId: number, scope: string) { }
 */
export function Cacheable(CACHE_NAME: string, CACHE_KEY: string, CACHE_EXPIRESIN: number = 3600) {
  const injectRedis = Inject(RedisService);

  return function <T extends object>(target: T, propertyKey: string, descriptor: PropertyDescriptor) {
    injectRedis(target, 'redisService');

    const originMethod = descriptor.value;

    descriptor.value = async function (this: T & { redisService: RedisService }, ...args: unknown[]) {
      const key = resolveKey(CACHE_KEY, args);

      if (key === null) {
        return await originMethod.apply(this, args);
      }

      // 包含租户ID到缓存键中（如果存在）
      const tenantId = TenantContext.getTenantId();
      const fullKey = tenantId ? `${CACHE_NAME}${tenantId}:${key}` : `${CACHE_NAME}${key}`;

      const cacheResult = await this.redisService.get(fullKey);

      if (!cacheResult) {
        const result = await originMethod.apply(this, args);

        // 添加随机偏移防止缓存雪崩
        const ttl = addJitter(CACHE_EXPIRESIN);
        await this.redisService.set(fullKey, result, ttl);

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

  return function <T extends object>(target: T, propertyKey: string, descriptor: PropertyDescriptor) {
    injectRedis(target, 'redisService');

    const originMethod = descriptor.value;

    descriptor.value = async function (this: T & { redisService: RedisService }, ...args: unknown[]) {
      const result = await originMethod.apply(this, args);

      const key = resolveKey(CACHE_KEY, args);
      if (key !== null) {
        const ttl = addJitter(CACHE_EXPIRESIN);
        await this.redisService.set(`${CACHE_NAME}${key}`, result, ttl);
      }

      return result;
    };
  };
}
