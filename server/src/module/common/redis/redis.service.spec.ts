import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { getRedisToken } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';

describe('RedisService', () => {
  let service: RedisService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(async () => {
    mockRedisClient = {
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
      llen: jest.fn(),
      lset: jest.fn(),
      lindex: jest.fn(),
      lpush: jest.fn(),
      lpushx: jest.fn(),
      linsert: jest.fn(),
      rpush: jest.fn(),
      rpushx: jest.fn(),
      blpop: jest.fn(),
      brpop: jest.fn(),
      ltrim: jest.fn(),
      lrem: jest.fn(),
      brpoplpush: jest.fn(),
      expire: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: getRedisToken('default'),
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getClient', () => {
    it('should return Redis client', () => {
      const client = service.getClient();
      expect(client).toBe(mockRedisClient);
    });
  });

  describe('getInfo', () => {
    it('should parse Redis info correctly', async () => {
      const mockInfo = 'redis_version:6.2.6\r\nredis_mode:standalone\r\nuptime_in_seconds:3600\r\n';
      mockRedisClient.info.mockResolvedValue(mockInfo);

      const result = await service.getInfo();

      expect(result).toHaveProperty('redis_version', '6.2.6');
      expect(result).toHaveProperty('redis_mode', 'standalone');
      expect(result).toHaveProperty('uptime_in_seconds', '3600');
    });
  });

  describe('skipFind', () => {
    it('should return paginated data', async () => {
      const mockData = ['item1', 'item2', 'item3'];
      mockRedisClient.lrange.mockResolvedValue(mockData);

      const result = await service.skipFind({
        key: 'test:list',
        pageSize: 10,
        pageNum: 1,
      });

      expect(result).toEqual(mockData);
      expect(mockRedisClient.lrange).toHaveBeenCalledWith('test:list', 0, 10);
    });
  });

  describe('getDbSize', () => {
    it('should return database size', async () => {
      mockRedisClient.dbsize.mockResolvedValue(100);

      const result = await service.getDbSize();

      expect(result).toBe(100);
    });
  });

  describe('commandStats', () => {
    it('should parse command statistics', async () => {
      const mockStats = 'cmdstat_get:calls=100,usec=500\r\ncmdstat_set:calls=50,usec=300\r\n';
      mockRedisClient.info.mockResolvedValue(mockStats);

      const result = await service.commandStats();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'get', value: 100 });
      expect(result[1]).toEqual({ name: 'set', value: 50 });
    });
  });

  describe('String operations', () => {
    describe('set', () => {
      it('should set string value without TTL', async () => {
        mockRedisClient.set.mockResolvedValue('OK');

        const result = await service.set('key1', 'value1');

        expect(result).toBe('OK');
        expect(mockRedisClient.set).toHaveBeenCalledWith('key1', 'value1');
      });

      it('should set string value with TTL', async () => {
        mockRedisClient.set.mockResolvedValue('OK');

        const result = await service.set('key1', 'value1', 3600000);

        expect(result).toBe('OK');
        expect(mockRedisClient.set).toHaveBeenCalledWith('key1', 'value1', 'PX', 3600000);
      });

      it('should stringify object values', async () => {
        mockRedisClient.set.mockResolvedValue('OK');
        const obj = { name: 'test', value: 123 };

        await service.set('key1', obj);

        expect(mockRedisClient.set).toHaveBeenCalledWith('key1', JSON.stringify(obj));
      });

      it('should stringify array values', async () => {
        mockRedisClient.set.mockResolvedValue('OK');
        const arr = [1, 2, 3];

        await service.set('key1', arr);

        expect(mockRedisClient.set).toHaveBeenCalledWith('key1', JSON.stringify(arr));
      });
    });

    describe('get', () => {
      it('should return null for empty key', async () => {
        const result = await service.get('');

        expect(result).toBeNull();
        expect(mockRedisClient.get).not.toHaveBeenCalled();
      });

      it('should return null for wildcard key', async () => {
        const result = await service.get('*');

        expect(result).toBeNull();
        expect(mockRedisClient.get).not.toHaveBeenCalled();
      });

      it('should return null when key does not exist', async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const result = await service.get('nonexistent');

        expect(result).toBeNull();
      });

      it('should parse JSON value', async () => {
        const obj = { name: 'test', value: 123 };
        mockRedisClient.get.mockResolvedValue(JSON.stringify(obj));

        const result = await service.get('key1');

        expect(result).toEqual(obj);
      });

      it('should return raw string for non-JSON value', async () => {
        mockRedisClient.get.mockResolvedValue('plain text');

        const result = await service.get('key1');

        expect(result).toBe('plain text');
      });
    });

    describe('mget', () => {
      it('should return null for empty keys', async () => {
        const result = await service.mget(null);

        expect(result).toBeNull();
      });

      it('should parse multiple JSON values', async () => {
        const values = ['{"a":1}', '{"b":2}', '{"c":3}'];
        mockRedisClient.mget.mockResolvedValue(values);

        const result = await service.mget(['key1', 'key2', 'key3']);

        expect(result).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
      });
    });

    describe('del', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.del('');

        expect(result).toBe(0);
        expect(mockRedisClient.del).not.toHaveBeenCalled();
      });

      it('should return 0 for wildcard key', async () => {
        const result = await service.del('*');

        expect(result).toBe(0);
        expect(mockRedisClient.del).not.toHaveBeenCalled();
      });

      it('should delete single key', async () => {
        mockRedisClient.del.mockResolvedValue(1);

        const result = await service.del('key1');

        expect(result).toBe(1);
        expect(mockRedisClient.del).toHaveBeenCalledWith('key1');
      });

      it('should delete multiple keys', async () => {
        mockRedisClient.del.mockResolvedValue(3);

        const result = await service.del(['key1', 'key2', 'key3']);

        expect(result).toBe(3);
        expect(mockRedisClient.del).toHaveBeenCalledWith('key1', 'key2', 'key3');
      });
    });

    describe('ttl', () => {
      it('should return null for empty key', async () => {
        const result = await service.ttl('');

        expect(result).toBeNull();
      });

      it('should return TTL value', async () => {
        mockRedisClient.ttl.mockResolvedValue(3600);

        const result = await service.ttl('key1');

        expect(result).toBe(3600);
      });
    });

    describe('keys', () => {
      it('should return matching keys', async () => {
        const mockKeys = ['user:1', 'user:2', 'user:3'];
        mockRedisClient.keys.mockResolvedValue(mockKeys);

        const result = await service.keys('user:*');

        expect(result).toEqual(mockKeys);
      });
    });
  });

  describe('Hash operations', () => {
    describe('hset', () => {
      it('should return null for empty key or field', async () => {
        expect(await service.hset('', 'field', 'value')).toBeNull();
        expect(await service.hset('key', '', 'value')).toBeNull();
      });

      it('should set hash field', async () => {
        mockRedisClient.hset.mockResolvedValue(1);

        const result = await service.hset('hash1', 'field1', 'value1');

        expect(result).toBe(1);
        expect(mockRedisClient.hset).toHaveBeenCalledWith('hash1', 'field1', 'value1');
      });
    });

    describe('hmset', () => {
      it('should return 0 for empty key or data', async () => {
        expect(await service.hmset('', { field: 'value' })).toBe(0);
        expect(await service.hmset('key', null)).toBe(0);
      });

      it('should set multiple hash fields', async () => {
        mockRedisClient.hmset.mockResolvedValue('OK');

        const data = { field1: 'value1', field2: 'value2' };
        const result = await service.hmset('hash1', data);

        expect(result).toBe('OK');
        expect(mockRedisClient.hmset).toHaveBeenCalledWith('hash1', data);
      });

      it('should set expiration when provided', async () => {
        mockRedisClient.hmset.mockResolvedValue('OK');
        mockRedisClient.expire.mockResolvedValue(1);

        const data = { field1: 'value1' };
        await service.hmset('hash1', data, 3600);

        expect(mockRedisClient.expire).toHaveBeenCalledWith('hash1', 3600);
      });
    });

    describe('hget', () => {
      it('should return 0 for empty key or field', async () => {
        expect(await service.hget('', 'field')).toBe(0);
        expect(await service.hget('key', '')).toBe(0);
      });

      it('should get hash field value', async () => {
        mockRedisClient.hget.mockResolvedValue('value1');

        const result = await service.hget('hash1', 'field1');

        expect(result).toBe('value1');
      });
    });

    describe('hvals', () => {
      it('should return empty array for empty key', async () => {
        const result = await service.hvals('');

        expect(result).toEqual([]);
      });

      it('should return all hash values', async () => {
        const mockValues = ['value1', 'value2', 'value3'];
        mockRedisClient.hvals.mockResolvedValue(mockValues);

        const result = await service.hvals('hash1');

        expect(result).toEqual(mockValues);
      });
    });

    describe('hGetAll', () => {
      it('should return all hash fields and values', async () => {
        const mockHash = { field1: 'value1', field2: 'value2' };
        mockRedisClient.hgetall.mockResolvedValue(mockHash);

        const result = await service.hGetAll('hash1');

        expect(result).toEqual(mockHash);
      });
    });

    describe('hdel', () => {
      it('should return 0 for empty key or fields', async () => {
        expect(await service.hdel('', 'field')).toBe(0);
        expect(await service.hdel('key', [])).toBe(0);
      });

      it('should delete hash fields', async () => {
        mockRedisClient.hdel.mockResolvedValue(2);

        const result = await service.hdel('hash1', ['field1', 'field2']);

        expect(result).toBe(2);
        expect(mockRedisClient.hdel).toHaveBeenCalledWith('hash1', 'field1', 'field2');
      });
    });

    describe('hdelAll', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.hdelAll('');

        expect(result).toBe(0);
      });

      it('should delete all hash fields', async () => {
        mockRedisClient.hkeys.mockResolvedValue(['field1', 'field2']);
        mockRedisClient.hdel.mockResolvedValue(2);

        const result = await service.hdelAll('hash1');

        expect(result).toBe(2);
      });

      it('should return 0 when hash has no fields', async () => {
        mockRedisClient.hkeys.mockResolvedValue([]);

        const result = await service.hdelAll('hash1');

        expect(result).toBe(0);
      });
    });
  });

  describe('List operations', () => {
    describe('lLength', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.lLength('');

        expect(result).toBe(0);
      });

      it('should return list length', async () => {
        mockRedisClient.llen.mockResolvedValue(5);

        const result = await service.lLength('list1');

        expect(result).toBe(5);
      });
    });

    describe('lSet', () => {
      it('should return null for invalid parameters', async () => {
        expect(await service.lSet('', 0, 'value')).toBeNull();
        expect(await service.lSet('key', -1, 'value')).toBeNull();
      });

      it('should set list element by index', async () => {
        mockRedisClient.lset.mockResolvedValue('OK');

        const result = await service.lSet('list1', 0, 'newvalue');

        expect(result).toBe('OK');
      });
    });

    describe('lIndex', () => {
      it('should return null for invalid parameters', async () => {
        expect(await service.lIndex('', 0)).toBeNull();
        expect(await service.lIndex('key', -1)).toBeNull();
      });

      it('should get list element by index', async () => {
        mockRedisClient.lindex.mockResolvedValue('value1');

        const result = await service.lIndex('list1', 0);

        expect(result).toBe('value1');
      });
    });

    describe('lRange', () => {
      it('should return null for empty key', async () => {
        const result = await service.lRange('', 0, -1);

        expect(result).toBeNull();
      });

      it('should return list range', async () => {
        const mockList = ['item1', 'item2', 'item3'];
        mockRedisClient.lrange.mockResolvedValue(mockList);

        const result = await service.lRange('list1', 0, -1);

        expect(result).toEqual(mockList);
      });
    });

    describe('lLeftPush', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.lLeftPush('');

        expect(result).toBe(0);
      });

      it('should push values to list head', async () => {
        mockRedisClient.lpush.mockResolvedValue(3);

        const result = await service.lLeftPush('list1', 'val1', 'val2', 'val3');

        expect(result).toBe(3);
      });
    });

    describe('lRightPush', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.lRightPush('');

        expect(result).toBe(0);
      });

      it('should push values to list tail', async () => {
        mockRedisClient.lpush.mockResolvedValue(3);

        const result = await service.lRightPush('list1', 'val1', 'val2');

        expect(result).toBe(3);
      });
    });

    describe('lLeftPop', () => {
      it('should return null for empty key', async () => {
        const result = await service.lLeftPop('');

        expect(result).toBeNull();
      });

      it('should pop value from list head', async () => {
        mockRedisClient.blpop.mockResolvedValue(['list1', 'value1'] as any);

        const result = await service.lLeftPop('list1');

        expect(result).toBe('value1');
      });

      it('should return null when list is empty', async () => {
        mockRedisClient.blpop.mockResolvedValue(null as any);

        const result = await service.lLeftPop('list1');

        expect(result).toBeNull();
      });
    });

    describe('lRightPop', () => {
      it('should return null for empty key', async () => {
        const result = await service.lRightPop('');

        expect(result).toBeNull();
      });

      it('should pop value from list tail', async () => {
        mockRedisClient.brpop.mockResolvedValue(['list1', 'value1'] as any);

        const result = await service.lRightPop('list1');

        expect(result).toBe('value1');
      });
    });

    describe('lTrim', () => {
      it('should return null for empty key', async () => {
        const result = await service.lTrim('', 0, -1);

        expect(result).toBeNull();
      });

      it('should trim list', async () => {
        mockRedisClient.ltrim.mockResolvedValue('OK');

        const result = await service.lTrim('list1', 0, 9);

        expect(result).toBe('OK');
      });
    });

    describe('lRemove', () => {
      it('should return 0 for empty key', async () => {
        const result = await service.lRemove('', 0, 'value');

        expect(result).toBe(0);
      });

      it('should remove list elements', async () => {
        mockRedisClient.lrem.mockResolvedValue(2);

        const result = await service.lRemove('list1', 0, 'value');

        expect(result).toBe(2);
      });
    });
  });

  describe('reset', () => {
    it('should delete all keys', async () => {
      const mockKeys = ['key1', 'key2', 'key3'];
      mockRedisClient.keys.mockResolvedValue(mockKeys);
      mockRedisClient.del.mockResolvedValue(3);

      const result = await service.reset();

      expect(result).toBe(3);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(mockKeys);
    });
  });
});
