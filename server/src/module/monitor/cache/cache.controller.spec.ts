import { Test, TestingModule } from '@nestjs/testing';
import { CacheController } from './cache.controller';
import { CacheService } from './cache.service';
import { Result } from 'src/common/response';
import { OperlogService } from '../operlog/operlog.service';

describe('CacheController', () => {
  let controller: CacheController;
  let service: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const mockService = {
      getInfo: jest.fn(),
      getNames: jest.fn(),
      getKeys: jest.fn(),
      getValue: jest.fn(),
      clearCacheName: jest.fn(),
      clearCacheKey: jest.fn(),
      clearCacheAll: jest.fn(),
    };

    const mockOperlogService = {
      logAction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CacheController],
      providers: [
        {
          provide: CacheService,
          useValue: mockService,
        },
        {
          provide: OperlogService,
          useValue: mockOperlogService,
        },
      ],
    }).compile();

    controller = module.get<CacheController>(CacheController);
    service = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInfo', () => {
    it('should return cache monitoring information', async () => {
      const mockResult = Result.ok({
        dbSize: 150,
        info: { redis_version: '6.2.0' },
        commandStats: [],
      });
      service.getInfo.mockResolvedValue(mockResult);

      const result = await controller.getInfo();

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('dbSize');
      expect(result.data).toHaveProperty('info');
      expect(result.data).toHaveProperty('commandStats');
      expect(service.getInfo).toHaveBeenCalled();
    });
  });

  describe('getNames', () => {
    it('should return cache name list', async () => {
      const mockCaches = [
        { cacheName: 'login_tokens:', cacheKey: '', cacheValue: '', remark: '用户信息' },
        { cacheName: 'sys_config:', cacheKey: '', cacheValue: '', remark: '配置信息' },
      ];
      const mockResult = Result.ok(mockCaches);
      service.getNames.mockResolvedValue(mockResult);

      const result = await controller.getNames();

      expect(result.code).toBe(200);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBe(2);
      expect(service.getNames).toHaveBeenCalled();
    });
  });

  describe('getKeys', () => {
    it('should return cache keys for a given cache name', async () => {
      const mockKeys = ['login_tokens:user1', 'login_tokens:user2'];
      const mockResult = Result.ok(mockKeys);
      service.getKeys.mockResolvedValue(mockResult);

      const result = await controller.getKeys('login_tokens:');

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockKeys);
      expect(service.getKeys).toHaveBeenCalledWith('login_tokens:');
    });

    it('should handle empty key list', async () => {
      const mockResult = Result.ok([]);
      service.getKeys.mockResolvedValue(mockResult);

      const result = await controller.getKeys('nonexistent:');

      expect(result.code).toBe(200);
      expect(result.data).toEqual([]);
    });
  });

  describe('getValue', () => {
    it('should return cache value for specific key', async () => {
      const mockData = {
        cacheName: 'login_tokens:',
        cacheKey: 'login_tokens:user1',
        cacheValue: '{"userId":1}',
        remark: '用户信息',
      };
      const mockResult = Result.ok(mockData);
      service.getValue.mockResolvedValue(mockResult);

      const params = ['login_tokens:', 'login_tokens:user1'] as any;
      const result = await controller.getValue(params);

      expect(result.code).toBe(200);
      expect(result.data).toHaveProperty('cacheName');
      expect(result.data).toHaveProperty('cacheKey');
      expect(result.data).toHaveProperty('cacheValue');
      expect(service.getValue).toHaveBeenCalledWith(params);
    });
  });

  describe('clearCacheName', () => {
    it('should clear all keys for a cache name', async () => {
      const mockResult = Result.ok(5);
      service.clearCacheName.mockResolvedValue(mockResult);

      const result = await controller.clearCacheName('login_tokens:');

      expect(result.code).toBe(200);
      expect(result.data).toBe(5);
      expect(service.clearCacheName).toHaveBeenCalledWith('login_tokens:');
    });

    it('should return 0 when no keys to clear', async () => {
      const mockResult = Result.ok(0);
      service.clearCacheName.mockResolvedValue(mockResult);

      const result = await controller.clearCacheName('nonexistent:');

      expect(result.code).toBe(200);
      expect(result.data).toBe(0);
    });
  });

  describe('clearCacheKey', () => {
    it('should clear a specific cache key', async () => {
      const mockResult = Result.ok(1);
      service.clearCacheKey.mockResolvedValue(mockResult);

      const result = await controller.clearCacheKey('login_tokens:user1');

      expect(result.code).toBe(200);
      expect(result.data).toBe(1);
      expect(service.clearCacheKey).toHaveBeenCalledWith('login_tokens:user1');
    });

    it('should return 0 when key does not exist', async () => {
      const mockResult = Result.ok(0);
      service.clearCacheKey.mockResolvedValue(mockResult);

      const result = await controller.clearCacheKey('nonexistent:key');

      expect(result.code).toBe(200);
      expect(result.data).toBe(0);
    });
  });

  describe('clearCacheAll', () => {
    it('should clear all cache', async () => {
      const mockResult = Result.ok(100);
      service.clearCacheAll.mockResolvedValue(mockResult);

      const result = await controller.clearCacheAll();

      expect(result.code).toBe(200);
      expect(result.data).toBe(100);
      expect(service.clearCacheAll).toHaveBeenCalled();
    });
  });
});
