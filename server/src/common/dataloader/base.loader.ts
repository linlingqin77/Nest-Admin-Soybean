import DataLoader from 'dataloader';
import { Injectable, OnModuleDestroy, Scope } from '@nestjs/common';

/**
 * DataLoader 基类
 *
 * @description 提供 DataLoader 的基础实现，子类需要实现 batchLoad 方法
 * DataLoader 会自动批量处理同一事件循环中的多个请求，减少数据库查询次数
 *
 * @template K - 键类型（通常是 ID）
 * @template V - 值类型（通常是实体对象）
 *
 * @example
 * ```typescript
 * @Injectable({ scope: Scope.REQUEST })
 * export class UserLoader extends BaseLoader<number, SysUser> {
 *   protected async batchLoad(ids: readonly number[]): Promise<(SysUser | null)[]> {
 *     const users = await this.prisma.sysUser.findMany({
 *       where: { userId: { in: [...ids] } }
 *     });
 *     const userMap = new Map(users.map(u => [u.userId, u]));
 *     return ids.map(id => userMap.get(id) ?? null);
 *   }
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export abstract class BaseLoader<K, V> implements OnModuleDestroy {
  protected loader: DataLoader<K, V | null>;

  constructor() {
    this.loader = new DataLoader<K, V | null>(
      (keys) => this.batchLoad(keys),
      {
        // 缓存配置
        cache: true,
        // 最大批量大小
        maxBatchSize: 100,
      },
    );
  }

  /**
   * 批量加载数据
   *
   * @description 子类必须实现此方法，返回的数组顺序必须与输入的 keys 顺序一致
   * 如果某个 key 没有对应的数据，应该返回 null
   *
   * @param keys - 要加载的键数组
   * @returns 与 keys 顺序对应的值数组
   */
  protected abstract batchLoad(keys: readonly K[]): Promise<(V | null)[]>;

  /**
   * 加载单个数据
   *
   * @param key - 要加载的键
   * @returns 对应的值，如果不存在则返回 null
   */
  async load(key: K): Promise<V | null> {
    return this.loader.load(key);
  }

  /**
   * 批量加载多个数据
   *
   * @param keys - 要加载的键数组
   * @returns 对应的值数组
   */
  async loadMany(keys: K[]): Promise<(V | null | Error)[]> {
    return this.loader.loadMany(keys);
  }

  /**
   * 清除指定键的缓存
   *
   * @param key - 要清除缓存的键
   */
  clear(key: K): this {
    this.loader.clear(key);
    return this;
  }

  /**
   * 清除所有缓存
   */
  clearAll(): this {
    this.loader.clearAll();
    return this;
  }

  /**
   * 预填充缓存
   *
   * @param key - 键
   * @param value - 值
   */
  prime(key: K, value: V | null): this {
    this.loader.prime(key, value);
    return this;
  }

  /**
   * 模块销毁时清理资源
   */
  onModuleDestroy() {
    this.clearAll();
  }
}
