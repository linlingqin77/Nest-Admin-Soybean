import { Logger } from '@nestjs/common';
import { Result } from '../response';

/**
 * 缓存刷新配置
 */
export interface CacheRefreshConfig<T> {
  /** 缓存键前缀 */
  cacheKeyPrefix: string;
  /** 加载数据的函数 */
  loadData: () => Promise<T[]>;
  /** 获取缓存键的函数 */
  getCacheKey: (item: T) => string;
  /** 获取缓存值的函数 */
  getCacheValue: (item: T) => unknown;
  /** Redis 服务实例 */
  redisService: {
    set: (key: string, value: unknown) => Promise<void>;
    del: (key: string | string[]) => Promise<void>;
    keys: (pattern: string) => Promise<string[]>;
  };
  /** 日志记录器 */
  logger?: Logger;
}

/**
 * 缓存刷新辅助类
 *
 * @description 提供通用的缓存刷新逻辑，减少 Service 层的重复代码
 * 支持清除缓存、加载缓存、刷新缓存等操作
 *
 * @example
 * ```typescript
 * const helper = new CacheRefreshHelper({
 *   cacheKeyPrefix: CacheEnum.SYS_CONFIG_KEY,
 *   loadData: () => this.configRepo.findMany({ where: { delFlag: '0' } }),
 *   getCacheKey: (item) => item.configKey,
 *   getCacheValue: (item) => item.configValue,
 *   redisService: this.redisService,
 *   logger: this.logger,
 * });
 *
 * await helper.refresh();
 * ```
 */
export class CacheRefreshHelper<T> {
  private readonly config: CacheRefreshConfig<T>;
  private readonly logger: Logger;

  constructor(config: CacheRefreshConfig<T>) {
    this.config = config;
    this.logger = config.logger || new Logger(CacheRefreshHelper.name);
  }

  /**
   * 清除所有缓存
   */
  async clear(): Promise<void> {
    try {
      const pattern = `${this.config.cacheKeyPrefix}*`;
      const keys = await this.config.redisService.keys(pattern);
      if (keys && keys.length > 0) {
        await this.config.redisService.del(keys);
        this.logger.log(`已清除 ${keys.length} 个缓存键`);
      }
    } catch (error) {
      this.logger.error('清除缓存失败', error);
      throw error;
    }
  }

  /**
   * 加载缓存
   */
  async load(): Promise<number> {
    try {
      const data = await this.config.loadData();
      let loadedCount = 0;

      for (const item of data) {
        const key = this.config.getCacheKey(item);
        if (key) {
          const value = this.config.getCacheValue(item);
          await this.config.redisService.set(`${this.config.cacheKeyPrefix}${key}`, value);
          loadedCount++;
        }
      }

      this.logger.log(`已加载 ${loadedCount} 个缓存项`);
      return loadedCount;
    } catch (error) {
      this.logger.error('加载缓存失败', error);
      throw error;
    }
  }

  /**
   * 刷新缓存（先清除后加载）
   */
  async refresh(): Promise<Result<{ cleared: boolean; loaded: number }>> {
    await this.clear();
    const loaded = await this.load();
    return Result.ok({ cleared: true, loaded });
  }

  /**
   * 删除单个缓存项
   * @param key 缓存键
   */
  async delete(key: string): Promise<void> {
    await this.config.redisService.del(`${this.config.cacheKeyPrefix}${key}`);
  }

  /**
   * 设置单个缓存项
   * @param key 缓存键
   * @param value 缓存值
   */
  async set(key: string, value: unknown): Promise<void> {
    await this.config.redisService.set(`${this.config.cacheKeyPrefix}${key}`, value);
  }
}

/**
 * 分组缓存刷新辅助类
 *
 * @description 用于按类型分组的缓存刷新，如字典数据按 dictType 分组
 *
 * @example
 * ```typescript
 * const helper = new GroupedCacheRefreshHelper({
 *   cacheKeyPrefix: CacheEnum.SYS_DICT_KEY,
 *   loadData: () => this.dictDataRepo.findMany({ where: { delFlag: '0' } }),
 *   getGroupKey: (item) => item.dictType,
 *   redisService: this.redisService,
 * });
 *
 * await helper.refresh();
 * ```
 */
export class GroupedCacheRefreshHelper<T> {
  private readonly config: {
    cacheKeyPrefix: string;
    loadData: () => Promise<T[]>;
    getGroupKey: (item: T) => string;
    redisService: {
      set: (key: string, value: unknown) => Promise<void>;
      del: (key: string | string[]) => Promise<void>;
      keys: (pattern: string) => Promise<string[]>;
    };
    logger?: Logger;
  };
  private readonly logger: Logger;

  constructor(config: typeof GroupedCacheRefreshHelper.prototype.config) {
    this.config = config;
    this.logger = config.logger || new Logger(GroupedCacheRefreshHelper.name);
  }

  /**
   * 清除所有缓存
   */
  async clear(): Promise<void> {
    const pattern = `${this.config.cacheKeyPrefix}*`;
    const keys = await this.config.redisService.keys(pattern);
    if (keys && keys.length > 0) {
      await this.config.redisService.del(keys);
      this.logger.log(`已清除 ${keys.length} 个缓存键`);
    }
  }

  /**
   * 加载缓存（按组分组）
   */
  async load(): Promise<number> {
    const data = await this.config.loadData();

    // 按组分组
    const grouped = data.reduce<Record<string, T[]>>((acc, item) => {
      const groupKey = this.config.getGroupKey(item);
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    }, {});

    // 写入缓存
    const entries = Object.entries(grouped);
    await Promise.all(
      entries.map(([groupKey, items]) =>
        this.config.redisService.set(`${this.config.cacheKeyPrefix}${groupKey}`, items),
      ),
    );

    this.logger.log(`已加载 ${entries.length} 个分组缓存`);
    return entries.length;
  }

  /**
   * 刷新缓存
   */
  async refresh(): Promise<Result<{ cleared: boolean; loaded: number }>> {
    await this.clear();
    const loaded = await this.load();
    return Result.ok({ cleared: true, loaded });
  }
}
