/**
 * Redis Mock 服务
 *
 * @description
 * 提供内存存储的 Redis 服务 Mock 实现
 * 用于单元测试中隔离 Redis 依赖
 *
 * @requirements 5.1, 5.2
 */

/**
 * Redis Mock 类型
 */
export interface MockRedisService {
  // 字符串操作
  get: jest.Mock<Promise<string | null>, [string]>;
  set: jest.Mock<Promise<'OK'>, [string, string, ...any[]]>;
  setex: jest.Mock<Promise<'OK'>, [string, number, string]>;
  setnx: jest.Mock<Promise<number>, [string, string]>;
  del: jest.Mock<Promise<number>, [string | string[]]>;
  exists: jest.Mock<Promise<number>, [string | string[]]>;
  expire: jest.Mock<Promise<number>, [string, number]>;
  ttl: jest.Mock<Promise<number>, [string]>;
  incr: jest.Mock<Promise<number>, [string]>;
  decr: jest.Mock<Promise<number>, [string]>;
  incrby: jest.Mock<Promise<number>, [string, number]>;
  decrby: jest.Mock<Promise<number>, [string, number]>;

  // 哈希操作
  hget: jest.Mock<Promise<string | null>, [string, string]>;
  hset: jest.Mock<Promise<number>, [string, string, string]>;
  hmset: jest.Mock<Promise<'OK'>, [string, Record<string, string>]>;
  hmget: jest.Mock<Promise<(string | null)[]>, [string, ...string[]]>;
  hgetall: jest.Mock<Promise<Record<string, string>>, [string]>;
  hdel: jest.Mock<Promise<number>, [string, string | string[]]>;
  hexists: jest.Mock<Promise<number>, [string, string]>;
  hkeys: jest.Mock<Promise<string[]>, [string]>;
  hvals: jest.Mock<Promise<string[]>, [string]>;
  hlen: jest.Mock<Promise<number>, [string]>;

  // 列表操作
  lpush: jest.Mock<Promise<number>, [string, ...string[]]>;
  rpush: jest.Mock<Promise<number>, [string, ...string[]]>;
  lpop: jest.Mock<Promise<string | null>, [string]>;
  rpop: jest.Mock<Promise<string | null>, [string]>;
  lrange: jest.Mock<Promise<string[]>, [string, number, number]>;
  llen: jest.Mock<Promise<number>, [string]>;
  lindex: jest.Mock<Promise<string | null>, [string, number]>;

  // 集合操作
  sadd: jest.Mock<Promise<number>, [string, ...string[]]>;
  srem: jest.Mock<Promise<number>, [string, ...string[]]>;
  smembers: jest.Mock<Promise<string[]>, [string]>;
  sismember: jest.Mock<Promise<number>, [string, string]>;
  scard: jest.Mock<Promise<number>, [string]>;

  // 有序集合操作
  zadd: jest.Mock<Promise<number>, [string, ...any[]]>;
  zrem: jest.Mock<Promise<number>, [string, ...string[]]>;
  zrange: jest.Mock<Promise<string[]>, [string, number, number, ...any[]]>;
  zrangebyscore: jest.Mock<Promise<string[]>, [string, number | string, number | string, ...any[]]>;
  zscore: jest.Mock<Promise<string | null>, [string, string]>;
  zcard: jest.Mock<Promise<number>, [string]>;

  // 键操作
  keys: jest.Mock<Promise<string[]>, [string]>;
  scan: jest.Mock<Promise<[string, string[]]>, [number, ...any[]]>;
  type: jest.Mock<Promise<string>, [string]>;
  rename: jest.Mock<Promise<'OK'>, [string, string]>;

  // 发布订阅
  publish: jest.Mock<Promise<number>, [string, string]>;
  subscribe: jest.Mock<Promise<void>, [string | string[]]>;
  unsubscribe: jest.Mock<Promise<void>, [string | string[]]>;

  // 事务
  multi: jest.Mock<any, []>;
  exec: jest.Mock<Promise<any[]>, []>;

  // 连接
  ping: jest.Mock<Promise<'PONG'>, []>;
  quit: jest.Mock<Promise<'OK'>, []>;

  // 内部存储（用于测试验证）
  _store: Map<string, any>;
  _resetAll: () => void;
  _getStore: () => Map<string, any>;
}

/**
 * 创建 Redis Mock 服务
 *
 * @returns MockRedisService 实例
 *
 * @example
 * ```typescript
 * const mockRedis = createMockRedis();
 * await mockRedis.set('key', 'value');
 * const value = await mockRedis.get('key');
 * ```
 */
export const createMockRedis = (): MockRedisService => {
  const store = new Map<string, any>();

  const mock: MockRedisService = {
    // 字符串操作
    get: jest.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    set: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve('OK' as const);
    }),
    setex: jest.fn((key: string, seconds: number, value: string) => {
      store.set(key, value);
      // 简化实现，不处理过期
      return Promise.resolve('OK' as const);
    }),
    setnx: jest.fn((key: string, value: string) => {
      if (store.has(key)) {
        return Promise.resolve(0);
      }
      store.set(key, value);
      return Promise.resolve(1);
    }),
    del: jest.fn((keys: string | string[]) => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      let count = 0;
      keyArray.forEach((key) => {
        if (store.delete(key)) count++;
      });
      return Promise.resolve(count);
    }),
    exists: jest.fn((keys: string | string[]) => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      return Promise.resolve(keyArray.filter((key) => store.has(key)).length);
    }),
    expire: jest.fn((_key: string, _seconds: number) => Promise.resolve(1)),
    ttl: jest.fn((_key: string) => Promise.resolve(-1)),
    incr: jest.fn((key: string) => {
      const value = parseInt(store.get(key) || '0', 10) + 1;
      store.set(key, String(value));
      return Promise.resolve(value);
    }),
    decr: jest.fn((key: string) => {
      const value = parseInt(store.get(key) || '0', 10) - 1;
      store.set(key, String(value));
      return Promise.resolve(value);
    }),
    incrby: jest.fn((key: string, increment: number) => {
      const value = parseInt(store.get(key) || '0', 10) + increment;
      store.set(key, String(value));
      return Promise.resolve(value);
    }),
    decrby: jest.fn((key: string, decrement: number) => {
      const value = parseInt(store.get(key) || '0', 10) - decrement;
      store.set(key, String(value));
      return Promise.resolve(value);
    }),

    // 哈希操作
    hget: jest.fn((key: string, field: string) => {
      const hash = store.get(key) || {};
      return Promise.resolve(hash[field] ?? null);
    }),
    hset: jest.fn((key: string, field: string, value: string) => {
      const hash = store.get(key) || {};
      const isNew = !(field in hash);
      hash[field] = value;
      store.set(key, hash);
      return Promise.resolve(isNew ? 1 : 0);
    }),
    hmset: jest.fn((key: string, data: Record<string, string>) => {
      const hash = store.get(key) || {};
      Object.assign(hash, data);
      store.set(key, hash);
      return Promise.resolve('OK' as const);
    }),
    hmget: jest.fn((key: string, ...fields: string[]) => {
      const hash = store.get(key) || {};
      return Promise.resolve(fields.map((field) => hash[field] ?? null));
    }),
    hgetall: jest.fn((key: string) => {
      return Promise.resolve(store.get(key) || {});
    }),
    hdel: jest.fn((key: string, fields: string | string[]) => {
      const hash = store.get(key) || {};
      const fieldArray = Array.isArray(fields) ? fields : [fields];
      let count = 0;
      fieldArray.forEach((field) => {
        if (field in hash) {
          delete hash[field];
          count++;
        }
      });
      store.set(key, hash);
      return Promise.resolve(count);
    }),
    hexists: jest.fn((key: string, field: string) => {
      const hash = store.get(key) || {};
      return Promise.resolve(field in hash ? 1 : 0);
    }),
    hkeys: jest.fn((key: string) => {
      const hash = store.get(key) || {};
      return Promise.resolve(Object.keys(hash));
    }),
    hvals: jest.fn((key: string) => {
      const hash = store.get(key) || {};
      return Promise.resolve(Object.values(hash));
    }),
    hlen: jest.fn((key: string) => {
      const hash = store.get(key) || {};
      return Promise.resolve(Object.keys(hash).length);
    }),

    // 列表操作
    lpush: jest.fn((key: string, ...values: string[]) => {
      const list = store.get(key) || [];
      list.unshift(...values.reverse());
      store.set(key, list);
      return Promise.resolve(list.length);
    }),
    rpush: jest.fn((key: string, ...values: string[]) => {
      const list = store.get(key) || [];
      list.push(...values);
      store.set(key, list);
      return Promise.resolve(list.length);
    }),
    lpop: jest.fn((key: string) => {
      const list = store.get(key) || [];
      return Promise.resolve(list.shift() ?? null);
    }),
    rpop: jest.fn((key: string) => {
      const list = store.get(key) || [];
      return Promise.resolve(list.pop() ?? null);
    }),
    lrange: jest.fn((key: string, start: number, stop: number) => {
      const list = store.get(key) || [];
      const end = stop === -1 ? list.length : stop + 1;
      return Promise.resolve(list.slice(start, end));
    }),
    llen: jest.fn((key: string) => {
      const list = store.get(key) || [];
      return Promise.resolve(list.length);
    }),
    lindex: jest.fn((key: string, index: number) => {
      const list = store.get(key) || [];
      return Promise.resolve(list[index] ?? null);
    }),

    // 集合操作
    sadd: jest.fn((key: string, ...members: string[]) => {
      const set = new Set(store.get(key) || []);
      let added = 0;
      members.forEach((member) => {
        if (!set.has(member)) {
          set.add(member);
          added++;
        }
      });
      store.set(key, Array.from(set));
      return Promise.resolve(added);
    }),
    srem: jest.fn((key: string, ...members: string[]) => {
      const set = new Set(store.get(key) || []);
      let removed = 0;
      members.forEach((member) => {
        if (set.delete(member)) removed++;
      });
      store.set(key, Array.from(set));
      return Promise.resolve(removed);
    }),
    smembers: jest.fn((key: string) => {
      return Promise.resolve(store.get(key) || []);
    }),
    sismember: jest.fn((key: string, member: string) => {
      const set = new Set(store.get(key) || []);
      return Promise.resolve(set.has(member) ? 1 : 0);
    }),
    scard: jest.fn((key: string) => {
      const set = store.get(key) || [];
      return Promise.resolve(set.length);
    }),

    // 有序集合操作
    zadd: jest.fn((_key: string, ..._args: any[]) => Promise.resolve(1)),
    zrem: jest.fn((_key: string, ..._members: string[]) => Promise.resolve(1)),
    // @ts-expect-error
    zrange: jest.fn(() => Promise.resolve([])),
    // @ts-expect-error
    zrangebyscore: jest.fn(() => Promise.resolve([])),
    // @ts-expect-error
    zscore: jest.fn(() => Promise.resolve(null)),
    // @ts-expect-error
    zcard: jest.fn(() => Promise.resolve(0)),

    // 键操作
    keys: jest.fn((pattern: string) => {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      const matchedKeys = Array.from(store.keys()).filter((key) => regex.test(key));
      return Promise.resolve(matchedKeys);
    }),
    // @ts-expect-error
    scan: jest.fn(() => Promise.resolve(['0', []] as [string, string[]])),
    type: jest.fn((key: string) => {
      const value = store.get(key);
      if (value === undefined) return Promise.resolve('none');
      if (Array.isArray(value)) return Promise.resolve('list');
      if (typeof value === 'object') return Promise.resolve('hash');
      return Promise.resolve('string');
    }),
    rename: jest.fn((oldKey: string, newKey: string) => {
      const value = store.get(oldKey);
      store.delete(oldKey);
      store.set(newKey, value);
      return Promise.resolve('OK' as const);
    }),

    // 发布订阅
    // @ts-expect-error
    publish: jest.fn(() => Promise.resolve(0)),
    // @ts-expect-error
    subscribe: jest.fn(() => Promise.resolve()),
    // @ts-expect-error
    unsubscribe: jest.fn(() => Promise.resolve()),

    // 事务
    multi: jest.fn(() => mock),
    exec: jest.fn(() => Promise.resolve([])),

    // 连接
    ping: jest.fn(() => Promise.resolve('PONG' as const)),
    quit: jest.fn(() => Promise.resolve('OK' as const)),

    // 内部方法
    _store: store,
    _resetAll: () => {
      store.clear();
      Object.values(mock).forEach((value) => {
        if (typeof value === 'function' && 'mockClear' in value) {
          (value as jest.Mock).mockClear();
        }
      });
    },
    _getStore: () => store,
  };

  return mock;
};

export default createMockRedis;
