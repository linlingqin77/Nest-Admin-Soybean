import { RedisService } from 'src/module/common/redis/redis.service';

/**
 * Redis Mock 类型 - 只包含公共方法
 */
export type RedisMock = {
  // 基础方法
  getClient: jest.Mock;
  getInfo: jest.Mock;
  skipFind: jest.Mock;
  getDbSize: jest.Mock;
  commandStats: jest.Mock;

  // String 操作
  set: jest.Mock;
  mget: jest.Mock;
  get: jest.Mock;
  del: jest.Mock;
  ttl: jest.Mock;
  keys: jest.Mock;

  // Hash 操作
  hset: jest.Mock;
  hmset: jest.Mock;
  hget: jest.Mock;
  hvals: jest.Mock;
  hGetAll: jest.Mock;
  hdel: jest.Mock;
  hdelAll: jest.Mock;

  // List 操作
  lLength: jest.Mock;
  lSet: jest.Mock;
  lIndex: jest.Mock;
  lRange: jest.Mock;
  lLeftPush: jest.Mock;
  lLeftPushIfPresent: jest.Mock;
  lLeftInsert: jest.Mock;
  lRightInsert: jest.Mock;
  lRightPush: jest.Mock;
  lRightPushIfPresent: jest.Mock;
  lLeftPop: jest.Mock;
  lRightPop: jest.Mock;
  lTrim: jest.Mock;
  lRemove: jest.Mock;
  lPoplPush: jest.Mock;

  // 其他操作
  reset: jest.Mock;
};

/**
 * 创建 Redis Mock 实例
 *
 * @description
 * 创建一个完整的 RedisService Mock，所有方法都是 Jest Mock 函数
 * 支持链式调用和自定义返回值
 *
 * @example
 * ```typescript
 * const redisMock = createRedisMock();
 * redisMock.get.mockResolvedValue({ userId: 1, userName: 'test' });
 * redisMock.set.mockResolvedValue('OK');
 * ```
 */
export const createRedisMock = (): RedisMock => {
  const mock: RedisMock = {
    // 基础方法
    getClient: jest.fn(),
    getInfo: jest.fn().mockResolvedValue({}),
    skipFind: jest.fn().mockResolvedValue([]),
    getDbSize: jest.fn().mockResolvedValue(0),
    commandStats: jest.fn().mockResolvedValue([]),

    // String 操作
    set: jest.fn().mockResolvedValue('OK'),
    mget: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    keys: jest.fn().mockResolvedValue([]),

    // Hash 操作
    hset: jest.fn().mockResolvedValue(1),
    hmset: jest.fn().mockResolvedValue('OK'),
    hget: jest.fn().mockResolvedValue(null),
    hvals: jest.fn().mockResolvedValue([]),
    hGetAll: jest.fn().mockResolvedValue({}),
    hdel: jest.fn().mockResolvedValue(1),
    hdelAll: jest.fn().mockResolvedValue(0),

    // List 操作
    lLength: jest.fn().mockResolvedValue(0),
    lSet: jest.fn().mockResolvedValue('OK'),
    lIndex: jest.fn().mockResolvedValue(null),
    lRange: jest.fn().mockResolvedValue([]),
    lLeftPush: jest.fn().mockResolvedValue(1),
    lLeftPushIfPresent: jest.fn().mockResolvedValue(0),
    lLeftInsert: jest.fn().mockResolvedValue(1),
    lRightInsert: jest.fn().mockResolvedValue(1),
    lRightPush: jest.fn().mockResolvedValue(1),
    lRightPushIfPresent: jest.fn().mockResolvedValue(0),
    lLeftPop: jest.fn().mockResolvedValue(null),
    lRightPop: jest.fn().mockResolvedValue(null),
    lTrim: jest.fn().mockResolvedValue('OK'),
    lRemove: jest.fn().mockResolvedValue(0),
    lPoplPush: jest.fn().mockResolvedValue(null),

    // 其他操作
    reset: jest.fn().mockResolvedValue(0),
  };

  return mock;
};

/**
 * 创建带有内存存储的 Redis Mock
 *
 * @description
 * 创建一个带有简单内存存储的 Redis Mock，
 * 可以模拟真实的 Redis 行为用于集成测试
 *
 * @example
 * ```typescript
 * const redisMock = createInMemoryRedisMock();
 * await redisMock.set('key', 'value');
 * const value = await redisMock.get('key'); // 'value'
 * ```
 */
export const createInMemoryRedisMock = (): RedisMock => {
  const store = new Map<string, { value: any; expireAt?: number }>();
  const hashStore = new Map<string, Map<string, string>>();

  const isExpired = (key: string): boolean => {
    const item = store.get(key);
    if (!item) return true;
    if (item.expireAt && Date.now() > item.expireAt) {
      store.delete(key);
      return true;
    }
    return false;
  };

  const mock: RedisMock = {
    getClient: jest.fn(),
    getInfo: jest.fn().mockResolvedValue({}),
    skipFind: jest.fn().mockResolvedValue([]),
    getDbSize: jest.fn().mockImplementation(async () => store.size),
    commandStats: jest.fn().mockResolvedValue([]),

    // String 操作
    set: jest.fn().mockImplementation(async (key: string, val: any, ttl?: number) => {
      const expireAt = ttl ? Date.now() + ttl : undefined;
      store.set(key, { value: val, expireAt });
      return 'OK';
    }),
    mget: jest.fn().mockImplementation(async (keys: string[]) => {
      return keys.map((key) => {
        if (isExpired(key)) return null;
        return store.get(key)?.value ?? null;
      });
    }),
    get: jest.fn().mockImplementation(async (key: string) => {
      if (isExpired(key)) return null;
      return store.get(key)?.value ?? null;
    }),
    del: jest.fn().mockImplementation(async (keys: string | string[]) => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      let count = 0;
      keyArray.forEach((key) => {
        if (store.delete(key)) count++;
        hashStore.delete(key);
      });
      return count;
    }),
    ttl: jest.fn().mockImplementation(async (key: string) => {
      const item = store.get(key);
      if (!item) return -2;
      if (!item.expireAt) return -1;
      return Math.max(0, Math.floor((item.expireAt - Date.now()) / 1000));
    }),
    keys: jest.fn().mockImplementation(async (pattern?: string) => {
      const allKeys = Array.from(store.keys());
      if (!pattern || pattern === '*') return allKeys;
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return allKeys.filter((key) => regex.test(key));
    }),

    // Hash 操作
    hset: jest.fn().mockImplementation(async (key: string, field: string, value: string) => {
      if (!hashStore.has(key)) hashStore.set(key, new Map());
      const isNew = !hashStore.get(key)!.has(field);
      hashStore.get(key)!.set(field, value);
      return isNew ? 1 : 0;
    }),
    hmset: jest.fn().mockImplementation(async (key: string, data: Record<string, any>) => {
      if (!hashStore.has(key)) hashStore.set(key, new Map());
      Object.entries(data).forEach(([field, value]) => {
        hashStore.get(key)!.set(field, String(value));
      });
      return 'OK';
    }),
    hget: jest.fn().mockImplementation(async (key: string, field: string) => {
      return hashStore.get(key)?.get(field) ?? null;
    }),
    hvals: jest.fn().mockImplementation(async (key: string) => {
      const hash = hashStore.get(key);
      return hash ? Array.from(hash.values()) : [];
    }),
    hGetAll: jest.fn().mockImplementation(async (key: string) => {
      const hash = hashStore.get(key);
      if (!hash) return {};
      return Object.fromEntries(hash.entries());
    }),
    hdel: jest.fn().mockImplementation(async (key: string, fields: string | string[]) => {
      const hash = hashStore.get(key);
      if (!hash) return 0;
      const fieldArray = Array.isArray(fields) ? fields : [fields];
      let count = 0;
      fieldArray.forEach((field) => {
        if (hash.delete(field)) count++;
      });
      return count;
    }),
    hdelAll: jest.fn().mockImplementation(async (key: string) => {
      const hash = hashStore.get(key);
      if (!hash) return 0;
      const count = hash.size;
      hash.clear();
      return count;
    }),

    // List 操作 - 简化实现
    lLength: jest.fn().mockResolvedValue(0),
    lSet: jest.fn().mockResolvedValue('OK'),
    lIndex: jest.fn().mockResolvedValue(null),
    lRange: jest.fn().mockResolvedValue([]),
    lLeftPush: jest.fn().mockResolvedValue(1),
    lLeftPushIfPresent: jest.fn().mockResolvedValue(0),
    lLeftInsert: jest.fn().mockResolvedValue(1),
    lRightInsert: jest.fn().mockResolvedValue(1),
    lRightPush: jest.fn().mockResolvedValue(1),
    lRightPushIfPresent: jest.fn().mockResolvedValue(0),
    lLeftPop: jest.fn().mockResolvedValue(null),
    lRightPop: jest.fn().mockResolvedValue(null),
    lTrim: jest.fn().mockResolvedValue('OK'),
    lRemove: jest.fn().mockResolvedValue(0),
    lPoplPush: jest.fn().mockResolvedValue(null),

    // 其他操作
    reset: jest.fn().mockImplementation(async () => {
      const count = store.size;
      store.clear();
      hashStore.clear();
      return count;
    }),
  };

  return mock;
};
