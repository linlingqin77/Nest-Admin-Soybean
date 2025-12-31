import { CacheRefreshHelper, GroupedCacheRefreshHelper } from './cache-refresh.helper';

describe('CacheRefreshHelper', () => {
  let mockRedisService: {
    set: jest.Mock;
    del: jest.Mock;
    keys: jest.Mock;
  };

  beforeEach(() => {
    mockRedisService = {
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
    };
  });

  describe('clear', () => {
    it('should clear all cache keys matching pattern', async () => {
      mockRedisService.keys.mockResolvedValue(['prefix:key1', 'prefix:key2']);

      const helper = new CacheRefreshHelper({
        cacheKeyPrefix: 'prefix:',
        loadData: async () => [],
        getCacheKey: (item: any) => item.key,
        getCacheValue: (item: any) => item.value,
        redisService: mockRedisService,
      });

      await helper.clear();

      expect(mockRedisService.keys).toHaveBeenCalledWith('prefix:*');
      expect(mockRedisService.del).toHaveBeenCalledWith(['prefix:key1', 'prefix:key2']);
    });

    it('should not call del when no keys found', async () => {
      mockRedisService.keys.mockResolvedValue([]);

      const helper = new CacheRefreshHelper({
        cacheKeyPrefix: 'prefix:',
        loadData: async () => [],
        getCacheKey: (item: any) => item.key,
        getCacheValue: (item: any) => item.value,
        redisService: mockRedisService,
      });

      await helper.clear();

      expect(mockRedisService.del).not.toHaveBeenCalled();
    });
  });

  describe('load', () => {
    it('should load all data into cache', async () => {
      const data = [
        { key: 'key1', value: 'value1' },
        { key: 'key2', value: 'value2' },
      ];

      const helper = new CacheRefreshHelper({
        cacheKeyPrefix: 'prefix:',
        loadData: async () => data,
        getCacheKey: (item) => item.key,
        getCacheValue: (item) => item.value,
        redisService: mockRedisService,
      });

      const count = await helper.load();

      expect(count).toBe(2);
      expect(mockRedisService.set).toHaveBeenCalledTimes(2);
      expect(mockRedisService.set).toHaveBeenCalledWith('prefix:key1', 'value1');
      expect(mockRedisService.set).toHaveBeenCalledWith('prefix:key2', 'value2');
    });

    it('should skip items with empty keys', async () => {
      const data = [
        { key: 'key1', value: 'value1' },
        { key: '', value: 'value2' },
      ];

      const helper = new CacheRefreshHelper({
        cacheKeyPrefix: 'prefix:',
        loadData: async () => data,
        getCacheKey: (item) => item.key,
        getCacheValue: (item) => item.value,
        redisService: mockRedisService,
      });

      const count = await helper.load();

      expect(count).toBe(1);
      expect(mockRedisService.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh', () => {
    it('should clear and load cache', async () => {
      mockRedisService.keys.mockResolvedValue(['prefix:old']);
      const data = [{ key: 'new', value: 'newValue' }];

      const helper = new CacheRefreshHelper({
        cacheKeyPrefix: 'prefix:',
        loadData: async () => data,
        getCacheKey: (item) => item.key,
        getCacheValue: (item) => item.value,
        redisService: mockRedisService,
      });

      const result = await helper.refresh();

      expect(result.data).toEqual({ cleared: true, loaded: 1 });
      expect(mockRedisService.del).toHaveBeenCalled();
      expect(mockRedisService.set).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete single cache key', async () => {
      const helper = new CacheRefreshHelper({
        cacheKeyPrefix: 'prefix:',
        loadData: async () => [],
        getCacheKey: (item: any) => item.key,
        getCacheValue: (item: any) => item.value,
        redisService: mockRedisService,
      });

      await helper.delete('key1');

      expect(mockRedisService.del).toHaveBeenCalledWith('prefix:key1');
    });
  });

  describe('set', () => {
    it('should set single cache key', async () => {
      const helper = new CacheRefreshHelper({
        cacheKeyPrefix: 'prefix:',
        loadData: async () => [],
        getCacheKey: (item: any) => item.key,
        getCacheValue: (item: any) => item.value,
        redisService: mockRedisService,
      });

      await helper.set('key1', 'value1');

      expect(mockRedisService.set).toHaveBeenCalledWith('prefix:key1', 'value1');
    });
  });
});

describe('GroupedCacheRefreshHelper', () => {
  let mockRedisService: {
    set: jest.Mock;
    del: jest.Mock;
    keys: jest.Mock;
  };

  beforeEach(() => {
    mockRedisService = {
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
    };
  });

  describe('load', () => {
    it('should group data and load into cache', async () => {
      const data = [
        { type: 'type1', value: 'value1' },
        { type: 'type1', value: 'value2' },
        { type: 'type2', value: 'value3' },
      ];

      const helper = new GroupedCacheRefreshHelper({
        cacheKeyPrefix: 'dict:',
        loadData: async () => data,
        getGroupKey: (item) => item.type,
        redisService: mockRedisService,
      });

      const count = await helper.load();

      expect(count).toBe(2); // 2 groups
      expect(mockRedisService.set).toHaveBeenCalledTimes(2);
      expect(mockRedisService.set).toHaveBeenCalledWith('dict:type1', [
        { type: 'type1', value: 'value1' },
        { type: 'type1', value: 'value2' },
      ]);
      expect(mockRedisService.set).toHaveBeenCalledWith('dict:type2', [{ type: 'type2', value: 'value3' }]);
    });
  });

  describe('refresh', () => {
    it('should clear and load grouped cache', async () => {
      mockRedisService.keys.mockResolvedValue(['dict:type1']);
      const data = [{ type: 'type1', value: 'value1' }];

      const helper = new GroupedCacheRefreshHelper({
        cacheKeyPrefix: 'dict:',
        loadData: async () => data,
        getGroupKey: (item) => item.type,
        redisService: mockRedisService,
      });

      const result = await helper.refresh();

      expect(result.data).toEqual({ cleared: true, loaded: 1 });
    });
  });
});
