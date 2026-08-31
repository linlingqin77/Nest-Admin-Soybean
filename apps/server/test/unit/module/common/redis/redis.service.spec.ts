/**
 * @file Redis Service Unit Tests
 * @description Migrated from src/platform/redis/redis.service.spec.ts
 */
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from '@/platform/redis/redis.service';
import { getRedisToken } from '@songkeys/nestjs-redis';

describe('RedisService', () => {
  let service: RedisService;
  let redisMock: any;

  beforeEach(async () => {
    redisMock = {
      status: 'ready',
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
      info: jest.fn(),
      lrange: jest.fn(),
      dbsize: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      mget: jest.fn(),
      del: jest.fn(),
      ttl: jest.fn(),
      keys: jest.fn(),
      hset: jest.fn(),
      hmset: jest.fn(),
      hget: jest.fn(),
      hvals: jest.fn(),
      hgetall: jest.fn(),
      hdel: jest.fn(),
      hkeys: jest.fn(),
      expire: jest.fn(),
      llen: jest.fn(),
      lset: jest.fn(),
      lindex: jest.fn(),
      lpush: jest.fn(),
      lpushx: jest.fn(),
      linsert: jest.fn(),
      rpushx: jest.fn(),
      blpop: jest.fn(),
      brpop: jest.fn(),
      ltrim: jest.fn(),
      lrem: jest.fn(),
      brpoplpush: jest.fn(),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [RedisService, { provide: getRedisToken('default'), useValue: redisMock }],
    }).compile();

    service = modules.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleDestroy', () => {
    it('should close redis connection gracefully', async () => {
      await service.onModuleDestroy();
      expect(redisMock.quit).toHaveBeenCalled();
    });

    it('should skip if connection already closed', async () => {
      redisMock.status = 'end';
      await service.onModuleDestroy();
      expect(redisMock.quit).not.toHaveBeenCalled();
    });

    it('should force disconnect on quit error', async () => {
      redisMock.quit.mockRejectedValue(new Error('Quit failed'));
      await service.onModuleDestroy();
      expect(redisMock.disconnect).toHaveBeenCalled();
    });
  });

  describe('getClient', () => {
    it('should return redis client', () => {
      const client = service.getClient();
      expect(client).toBe(redisMock);
    });
  });

  describe('getInfo', () => {
    it('should parse redis info', async () => {
      redisMock.info.mockResolvedValue('redis_version:6.0.0\r\nused_memory:1000\r\n');
      const result = await service.getInfo();
      expect(result['redis_version']).toBe('6.0.0');
      expect(result['used_memory']).toBe('1000');
    });
  });

  describe('skipFind', () => {
    it('should return paginated list', async () => {
      redisMock.lrange.mockResolvedValue(['item1', 'item2']);
      const result = await service.skipFind({ key: 'test', pageSize: 10, pageNum: 1 });
      expect(result).toEqual(['item1', 'item2']);
      expect(redisMock.lrange).toHaveBeenCalledWith('test', 0, 10);
    });
  });

  describe('getDbSize', () => {
    it('should return db size', async () => {
      redisMock.dbsize.mockResolvedValue(100);
      const result = await service.getDbSize();
      expect(result).toBe(100);
    });
  });

  describe('commandStats', () => {
    it('should parse command stats', async () => {
      redisMock.info.mockResolvedValue('cmdstat_get:calls=100,usec=200\r\ncmdstat_set:calls=50,usec=100\r\n');
      const result = await service.commandStats();
      expect(result).toContainEqual({ name: 'get', value: 100 });
      expect(result).toContainEqual({ name: 'set', value: 50 });
    });
  });

  describe('set', () => {
    it('should set string value', async () => {
      redisMock.set.mockResolvedValue('OK');
      const result = await service.set('key', 'value');
      expect(result).toBe('OK');
      expect(redisMock.set).toHaveBeenCalledWith('key', 'value');
    });

    it('should set value with ttl', async () => {
      redisMock.set.mockResolvedValue('OK');
      await service.set('key', 'value', 1000);
      expect(redisMock.set).toHaveBeenCalledWith('key', 'value', 'PX', 1000);
    });

    it('should stringify object value', async () => {
      redisMock.set.mockResolvedValue('OK');
      await service.set('key', { foo: 'bar' });
      expect(redisMock.set).toHaveBeenCalledWith('key', '{"foo":"bar"}');
    });

    it('should stringify array value', async () => {
      redisMock.set.mockResolvedValue('OK');
      await service.set('key', [1, 2, 3]);
      expect(redisMock.set).toHaveBeenCalledWith('key', '[1,2,3]');
    });
  });

  describe('get', () => {
    it('should return null for empty key', async () => {
      const result = await service.get('');
      expect(result).toBeNull();
    });

    it('should return null for wildcard key', async () => {
      const result = await service.get('*');
      expect(result).toBeNull();
    });

    it('should return parsed JSON', async () => {
      redisMock.get.mockResolvedValue('{"foo":"bar"}');
      const result = await service.get('key');
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should return string if not JSON', async () => {
      redisMock.get.mockResolvedValue('plain string');
      const result = await service.get('key');
      expect(result).toBe('plain string');
    });

    it('should return null if key not found', async () => {
      redisMock.get.mockResolvedValue(null);
      const result = await service.get('key');
      expect(result).toBeNull();
    });
  });

  describe('mget', () => {
    it('should return null for empty keys', async () => {
      const result = await service.mget(null as any);
      expect(result).toBeNull();
    });

    it('should return parsed values', async () => {
      redisMock.mget.mockResolvedValue(['{"a":1}', '{"b":2}']);
      const result = await service.mget(['key1', 'key2']);
      expect(result).toEqual([{ a: 1 }, { b: 2 }]);
    });
  });

  describe('del', () => {
    it('should return 0 for empty keys', async () => {
      const result = await service.del('');
      expect(result).toBe(0);
    });

    it('should return 0 for wildcard', async () => {
      const result = await service.del('*');
      expect(result).toBe(0);
    });

    it('should delete single key', async () => {
      redisMock.del.mockResolvedValue(1);
      const result = await service.del('key');
      expect(result).toBe(1);
    });

    it('should delete multiple keys', async () => {
      redisMock.del.mockResolvedValue(2);
      const result = await service.del(['key1', 'key2']);
      expect(result).toBe(2);
    });
  });

  describe('ttl', () => {
    it('should return null for empty key', async () => {
      const result = await service.ttl('');
      expect(result).toBeNull();
    });

    it('should return ttl value', async () => {
      redisMock.ttl.mockResolvedValue(3600);
      const result = await service.ttl('key');
      expect(result).toBe(3600);
    });
  });

  describe('keys', () => {
    it('should return matching keys', async () => {
      redisMock.keys.mockResolvedValue(['key1', 'key2']);
      const result = await service.keys('key*');
      expect(result).toEqual(['key1', 'key2']);
    });
  });

  describe('hash operations', () => {
    describe('hset', () => {
      it('should return null for empty key', async () => {
        const result = await service.hset('', 'field', 'value');
        expect(result).toBeNull();
      });

      it('should set hash field', async () => {
        redisMock.hset.mockResolvedValue(1);
        const result = await service.hset('key', 'field', 'value');
        expect(result).toBe(1);
      });
    });

    describe('hmset', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.hmset('', {});
        expect(result).toBe(0);
      });

      it('should set multiple hash fields', async () => {
        redisMock.hmset.mockResolvedValue('OK');
        const result = await service.hmset('key', { a: '1', b: '2' });
        expect(result).toBe('OK');
      });

      it('should set expire if provided', async () => {
        redisMock.hmset.mockResolvedValue('OK');
        await service.hmset('key', { a: '1' }, 3600);
        expect(redisMock.expire).toHaveBeenCalledWith('key', 3600);
      });
    });

    describe('hget', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.hget('', 'field');
        expect(result).toBe(0);
      });

      it('should get hash field', async () => {
        redisMock.hget.mockResolvedValue('value');
        const result = await service.hget('key', 'field');
        expect(result).toBe('value');
      });
    });

    describe('hvals', () => {
      it('should return empty array for empty key', async () => {
        const result = await service.hvals('');
        expect(result).toEqual([]);
      });

      it('should return hash values', async () => {
        redisMock.hvals.mockResolvedValue(['v1', 'v2']);
        const result = await service.hvals('key');
        expect(result).toEqual(['v1', 'v2']);
      });
    });

    describe('hdel', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.hdel('', 'field');
        expect(result).toBe(0);
      });

      it('should delete hash fields', async () => {
        redisMock.hdel.mockResolvedValue(1);
        const result = await service.hdel('key', 'field');
        expect(result).toBe(1);
      });
    });

    describe('hdelAll', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.hdelAll('');
        expect(result).toBe(0);
      });

      it('should return 0 if no fields', async () => {
        redisMock.hkeys.mockResolvedValue([]);
        const result = await service.hdelAll('key');
        expect(result).toBe(0);
      });

      it('should delete all hash fields', async () => {
        redisMock.hkeys.mockResolvedValue(['f1', 'f2']);
        redisMock.hdel.mockResolvedValue(2);
        const result = await service.hdelAll('key');
        expect(result).toBe(2);
      });
    });
  });

  describe('list operations', () => {
    describe('lLength', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.lLength('');
        expect(result).toBe(0);
      });

      it('should return list length', async () => {
        redisMock.llen.mockResolvedValue(5);
        const result = await service.lLength('key');
        expect(result).toBe(5);
      });
    });

    describe('lSet', () => {
      it('should return null for empty key', async () => {
        const result = await service.lSet('', 0, 'value');
        expect(result).toBeNull();
      });

      it('should return null for negative index', async () => {
        const result = await service.lSet('key', -1, 'value');
        expect(result).toBeNull();
      });

      it('should set list element', async () => {
        redisMock.lset.mockResolvedValue('OK');
        const result = await service.lSet('key', 0, 'value');
        expect(result).toBe('OK');
      });
    });

    describe('lIndex', () => {
      it('should return null for empty key', async () => {
        const result = await service.lIndex('', 0);
        expect(result).toBeNull();
      });

      it('should return element at index', async () => {
        redisMock.lindex.mockResolvedValue('value');
        const result = await service.lIndex('key', 0);
        expect(result).toBe('value');
      });
    });

    describe('lRange', () => {
      it('should return null for empty key', async () => {
        const result = await service.lRange('', 0, -1);
        expect(result).toBeNull();
      });

      it('should return range of elements', async () => {
        redisMock.lrange.mockResolvedValue(['a', 'b', 'c']);
        const result = await service.lRange('key', 0, -1);
        expect(result).toEqual(['a', 'b', 'c']);
      });
    });

    describe('lLeftPush', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.lLeftPush('', 'value');
        expect(result).toBe(0);
      });

      it('should push to left', async () => {
        redisMock.lpush.mockResolvedValue(1);
        const result = await service.lLeftPush('key', 'value');
        expect(result).toBe(1);
      });
    });

    describe('lTrim', () => {
      it('should return null for empty key', async () => {
        const result = await service.lTrim('', 0, 10);
        expect(result).toBeNull();
      });

      it('should trim list', async () => {
        redisMock.ltrim.mockResolvedValue('OK');
        const result = await service.lTrim('key', 0, 10);
        expect(result).toBe('OK');
      });
    });

    describe('lRemove', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.lRemove('', 0, 'value');
        expect(result).toBe(0);
      });

      it('should remove elements', async () => {
        redisMock.lrem.mockResolvedValue(2);
        const result = await service.lRemove('key', 0, 'value');
        expect(result).toBe(2);
      });
    });
  });

  describe('reset', () => {
    it('should delete all keys', async () => {
      redisMock.keys.mockResolvedValue(['key1', 'key2']);
      redisMock.del.mockResolvedValue(2);
      const result = await service.reset();
      expect(result).toBe(2);
    });
  });
});
