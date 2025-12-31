import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import NodeCache from 'node-cache';
import { RedisService } from 'src/module/common/redis/redis.service';

/**
 * 多级缓存配置选项
 */
export interface MultiLevelCacheOptions {
  /** L1 本地缓存 TTL（秒），默认 60 秒 */
  l1Ttl?: number;
  /** L2 Redis 缓存 TTL（秒），默认 300 秒 */
  l2Ttl?: number;
  /** 是否启用 L1 缓存，默认 true */
  enableL1?: boolean;
  /** 是否启用 L2 缓存，默认 true */
  enableL2?: boolean;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  l1Keys: number;
  hitRate: number;
}

/**
 * 多级缓存服务
 *
 * 实现两级缓存架构：
 * - L1: 本地内存缓存（node-cache），TTL 60s，用于热点数据快速访问
 * - L2: Redis 缓存，TTL 5min，用于分布式缓存共享
 *
 * 缓存策略：
 * - 读取时先查 L1，未命中再查 L2，L2 命中后回填 L1
 * - 写入时同时写入 L1 和 L2
 * - 删除时同时删除 L1 和 L2
 *
 * @example
 * ```typescript
 * // 基本使用
 * await cacheService.set('user:1', userData, 300);
 * const user = await cacheService.get<User>('user:1');
 *
 * // 使用 getOrSet 模式
 * const user = await cacheService.getOrSet('user:1', async () => {
 *   return await userRepository.findById(1);
 * }, 300);
 * ```
 */
@Injectable()
export class MultiLevelCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MultiLevelCacheService.name);
  private l1Cache: NodeCache;

  /** L1 缓存命中次数 */
  private l1Hits = 0;
  /** L1 缓存未命中次数 */
  private l1Misses = 0;
  /** L2 缓存命中次数 */
  private l2Hits = 0;
  /** L2 缓存未命中次数 */
  private l2Misses = 0;

  /** 默认 L1 TTL（秒） */
  private readonly defaultL1Ttl = 60;
  /** 默认 L2 TTL（秒） */
  private readonly defaultL2Ttl = 300;

  constructor(private readonly redisService: RedisService) {
    this.l1Cache = new NodeCache({
      stdTTL: this.defaultL1Ttl,
      checkperiod: 120,
      useClones: true,
      deleteOnExpire: true,
    });
  }

  onModuleInit() {
    this.logger.log('MultiLevelCacheService initialized with L1 (node-cache) and L2 (Redis)');
  }

  /**
   * 模块销毁时清理 L1 缓存 (需求 3.8)
   * 确保优雅关闭时正确清理本地缓存资源
   */
  onModuleDestroy() {
    this.logger.log('Closing MultiLevelCacheService...');
    try {
      // 关闭 NodeCache，停止定时检查并清空缓存
      this.l1Cache.close();
      this.logger.log('L1 cache (node-cache) closed successfully.');
    } catch (error) {
      this.logger.error(`Error closing L1 cache: ${error.message}`);
    }
  }

  /**
   * 从缓存获取数据
   *
   * 查找顺序：L1 -> L2 -> null
   * L2 命中时会自动回填 L1
   *
   * @param key 缓存键
   * @param options 缓存选项
   * @returns 缓存值或 null
   */
  async get<T>(key: string, options: MultiLevelCacheOptions = {}): Promise<T | null> {
    const { enableL1 = true, enableL2 = true, l1Ttl = this.defaultL1Ttl } = options;

    // L1 查找
    if (enableL1) {
      const l1Value = this.l1Cache.get<T>(key);
      if (l1Value !== undefined) {
        this.l1Hits++;
        this.logger.debug(`L1 cache hit for key: ${key}`);
        return l1Value;
      }
      this.l1Misses++;
    }

    // L2 查找
    if (enableL2) {
      try {
        const l2Value = await this.redisService.get(key);
        if (l2Value !== null && l2Value !== undefined) {
          this.l2Hits++;
          this.logger.debug(`L2 cache hit for key: ${key}`);

          // 回填 L1
          if (enableL1) {
            this.l1Cache.set(key, l2Value, l1Ttl);
            this.logger.debug(`Backfilled L1 cache for key: ${key}`);
          }

          return l2Value as T;
        }
        this.l2Misses++;
      } catch (error) {
        this.logger.warn(`L2 cache error for key ${key}: ${error.message}`);
        this.l2Misses++;
      }
    }

    this.logger.debug(`Cache miss for key: ${key}`);
    return null;
  }

  /**
   * 设置缓存数据
   *
   * 同时写入 L1 和 L2 缓存
   * L1 TTL 取 min(ttl, 60s) 以保证本地缓存不会过长
   *
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl TTL（秒），默认 300 秒
   * @param options 缓存选项
   */
  async set<T>(key: string, value: T, ttl?: number, options: MultiLevelCacheOptions = {}): Promise<void> {
    const { enableL1 = true, enableL2 = true, l1Ttl = this.defaultL1Ttl, l2Ttl = this.defaultL2Ttl } = options;

    const effectiveL2Ttl = ttl || l2Ttl;
    // L1 TTL 取较小值，避免本地缓存过长
    const effectiveL1Ttl = Math.min(ttl || l1Ttl, l1Ttl);

    // 写入 L1
    if (enableL1) {
      this.l1Cache.set(key, value, effectiveL1Ttl);
      this.logger.debug(`Set L1 cache for key: ${key}, ttl: ${effectiveL1Ttl}s`);
    }

    // 写入 L2
    if (enableL2) {
      try {
        // Redis TTL 使用毫秒
        await this.redisService.set(key, value, effectiveL2Ttl * 1000);
        this.logger.debug(`Set L2 cache for key: ${key}, ttl: ${effectiveL2Ttl}s`);
      } catch (error) {
        this.logger.warn(`Failed to set L2 cache for key ${key}: ${error.message}`);
      }
    }
  }

  /**
   * 删除缓存数据
   *
   * 同时删除 L1 和 L2 缓存
   *
   * @param key 缓存键或键数组
   */
  async del(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];

    // 删除 L1
    keys.forEach((k) => {
      this.l1Cache.del(k);
    });
    this.logger.debug(`Deleted L1 cache for keys: ${keys.join(', ')}`);

    // 删除 L2
    try {
      await this.redisService.del(keys);
      this.logger.debug(`Deleted L2 cache for keys: ${keys.join(', ')}`);
    } catch (error) {
      this.logger.warn(`Failed to delete L2 cache for keys ${keys.join(', ')}: ${error.message}`);
    }
  }

  /**
   * 获取或设置缓存
   *
   * 如果缓存存在则返回缓存值，否则执行 factory 函数获取值并缓存
   *
   * @param key 缓存键
   * @param factory 值工厂函数
   * @param ttl TTL（秒）
   * @param options 缓存选项
   * @returns 缓存值或工厂函数返回值
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
    options: MultiLevelCacheOptions = {},
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    if (value !== null && value !== undefined) {
      await this.set(key, value, ttl, options);
    }
    return value;
  }

  /**
   * 检查缓存是否存在
   *
   * @param key 缓存键
   * @returns 是否存在
   */
  async has(key: string): Promise<boolean> {
    // 先检查 L1
    if (this.l1Cache.has(key)) {
      return true;
    }

    // 再检查 L2
    try {
      const value = await this.redisService.get(key);
      return value !== null && value !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * 清空所有缓存
   */
  async flush(): Promise<void> {
    // 清空 L1
    this.l1Cache.flushAll();
    this.logger.debug('Flushed L1 cache');

    // 注意：不清空 L2 Redis，因为可能影响其他服务
    // 如需清空 L2，请使用 redisService.reset()
  }

  /**
   * 仅清空 L1 本地缓存
   */
  flushL1(): void {
    this.l1Cache.flushAll();
    this.logger.debug('Flushed L1 cache');
  }

  /**
   * 获取缓存统计信息
   *
   * @returns 缓存统计
   */
  getStats(): CacheStats {
    const totalHits = this.l1Hits + this.l2Hits;
    const totalRequests = totalHits + this.l1Misses;
    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      l1Hits: this.l1Hits,
      l1Misses: this.l1Misses,
      l2Hits: this.l2Hits,
      l2Misses: this.l2Misses,
      l1Keys: this.l1Cache.keys().length,
      hitRate: Math.round(hitRate * 10000) / 100, // 保留两位小数的百分比
    };
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.l1Hits = 0;
    this.l1Misses = 0;
    this.l2Hits = 0;
    this.l2Misses = 0;
  }

  /**
   * 获取 L1 缓存中的所有键
   *
   * @returns 键数组
   */
  getL1Keys(): string[] {
    return this.l1Cache.keys();
  }

  /**
   * 获取 L1 缓存的 TTL
   *
   * @param key 缓存键
   * @returns TTL（毫秒）或 undefined
   */
  getL1Ttl(key: string): number | undefined {
    return this.l1Cache.getTtl(key);
  }
}
