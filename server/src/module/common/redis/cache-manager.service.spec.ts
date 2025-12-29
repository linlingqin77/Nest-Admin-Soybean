import { Test, TestingModule } from '@nestjs/testing';
import { CacheManagerService } from './cache-manager.service';
import { RedisService } from './redis.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MockServiceFactory } from 'src/test-utils/mocks/service.mock';
import { StatusEnum, DelFlagEnum } from 'src/common/enum/index';
import { createPrismaMock } from 'src/test-utils/prisma-mock';

describe('CacheManagerService', () => {
  let service: CacheManagerService;
  let redis: jest.Mocked<RedisService>;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheManagerService,
        {
          provide: RedisService,
          useValue: MockServiceFactory.createRedisService(),
        },
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CacheManagerService>(CacheManagerService);
    redis = module.get(RedisService);

    // Prevent onModuleInit from running during tests
    jest.spyOn(service, 'onModuleInit').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should call warmupAll on module initialization', async () => {
      const warmupAllSpy = jest.spyOn(service, 'warmupAll').mockResolvedValue(undefined);
      
      // Restore the original implementation temporarily
      jest.spyOn(service, 'onModuleInit').mockRestore();
      
      await service.onModuleInit();

      expect(warmupAllSpy).toHaveBeenCalled();
    });
  });

  describe('warmupAll', () => {
    it('should warmup all configured caches', async () => {
      const mockDictTypes = [
        { dictType: 'sys_user_sex' },
        { dictType: 'sys_normal_disable' },
      ];
      const mockDictData = [
        { dictType: 'sys_user_sex', dictLabel: '男', dictValue: '0', dictSort: 1, status: StatusEnum.NORMAL },
        { dictType: 'sys_user_sex', dictLabel: '女', dictValue: '1', dictSort: 2, status: StatusEnum.NORMAL },
      ];
      const mockConfigs = [
        { configKey: 'sys.user.initPassword', configValue: '123456', status: StatusEnum.NORMAL, delFlag: DelFlagEnum.NORMAL },
      ];

      (prisma.sysDictType.findMany as jest.Mock).mockResolvedValue(mockDictTypes as any);
      (prisma.sysDictData.findMany as jest.Mock).mockResolvedValue(mockDictData as any);
      (prisma.sysConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs as any);

      await service.warmupAll();

      expect(redis.set).toHaveBeenCalled();
    });

    it('should handle errors during warmup gracefully', async () => {
      (prisma.sysDictType.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.warmupAll()).resolves.not.toThrow();
    });
  });

  describe('warmup', () => {
    it('should warmup dict cache', async () => {
      const mockDictTypes = [{ dictType: 'sys_user_sex' }];
      const mockDictData = [
        { dictType: 'sys_user_sex', dictLabel: '男', dictValue: '0', dictSort: 1, status: StatusEnum.NORMAL },
      ];

      (prisma.sysDictType.findMany as jest.Mock).mockResolvedValue(mockDictTypes as any);
      (prisma.sysDictData.findMany as jest.Mock).mockResolvedValue(mockDictData as any);

      await service.warmup('dict');

      expect(prisma.sysDictType.findMany).toHaveBeenCalled();
      expect(prisma.sysDictData.findMany).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
    });

    it('should warmup config cache', async () => {
      const mockConfigs = [
        { configKey: 'sys.user.initPassword', configValue: '123456', status: StatusEnum.NORMAL, delFlag: DelFlagEnum.NORMAL },
      ];

      (prisma.sysConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs as any);

      await service.warmup('config');

      expect(prisma.sysConfig.findMany).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
    });

    it('should log warning for unknown cache name', async () => {
      const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

      await service.warmup('unknown');

      expect(loggerWarnSpy).toHaveBeenCalledWith('Cache config not found: unknown');
    });

    it('should add jitter to TTL values', async () => {
      const mockConfigs = [
        { configKey: 'test.key', configValue: 'test', status: StatusEnum.NORMAL, delFlag: DelFlagEnum.NORMAL },
      ];

      (prisma.sysConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs as any);

      await service.warmup('config');

      // Verify that set was called with a TTL value (should be base + jitter)
      expect(redis.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Number),
      );

      // Get the TTL value that was used
      const setCall = (redis.set as jest.Mock).mock.calls[0];
      const ttl = setCall[2];

      // TTL should be between base (3600) and base + jitter (3600 + 300)
      expect(ttl).toBeGreaterThanOrEqual(3600);
      expect(ttl).toBeLessThanOrEqual(3900);
    });
  });

  describe('set', () => {
    it('should set cache with jitter added to TTL', async () => {
      await service.set('test:key', 'value', 1000);

      expect(redis.set).toHaveBeenCalledWith(
        'test:key',
        'value',
        expect.any(Number),
      );

      // Verify jitter was added
      const setCall = (redis.set as jest.Mock).mock.calls[0];
      const ttl = setCall[2];
      expect(ttl).toBeGreaterThanOrEqual(1000);
      expect(ttl).toBeLessThanOrEqual(1300);
    });
  });

  describe('get', () => {
    it('should get cache value', async () => {
      redis.get.mockResolvedValue('cached-value');

      const result = await service.get('test:key');

      expect(result).toBe('cached-value');
      expect(redis.get).toHaveBeenCalledWith('test:key');
    });

    it('should return null when key does not exist', async () => {
      redis.get.mockResolvedValue(null);

      const result = await service.get('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('del', () => {
    it('should delete cache key', async () => {
      await service.del('test:key');

      expect(redis.del).toHaveBeenCalledWith('test:key');
    });
  });

  describe('delByPrefix', () => {
    it('should delete all keys with prefix', async () => {
      const mockKeys = ['user:1', 'user:2', 'user:3'];
      redis.keys.mockResolvedValue(mockKeys);

      await service.delByPrefix('user:');

      expect(redis.keys).toHaveBeenCalledWith('user:*');
      expect(redis.del).toHaveBeenCalledWith(mockKeys);
    });

    it('should not delete when no keys match prefix', async () => {
      redis.keys.mockResolvedValue([]);

      await service.delByPrefix('nonexistent:');

      expect(redis.keys).toHaveBeenCalledWith('nonexistent:*');
      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should delete old cache and warmup new data', async () => {
      const mockConfigs = [
        { configKey: 'test.key', configValue: 'test', status: StatusEnum.NORMAL, delFlag: DelFlagEnum.NORMAL },
      ];

      redis.keys.mockResolvedValue(['sys:config:test.key']);
      (prisma.sysConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs as any);

      await service.refresh('config');

      expect(redis.keys).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
      expect(prisma.sysConfig.findMany).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
    });

    it('should log warning for unknown cache name', async () => {
      const loggerWarnSpy = jest.spyOn(service['logger'], 'warn');

      await service.refresh('unknown');

      expect(loggerWarnSpy).toHaveBeenCalledWith('Cache config not found: unknown');
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      redis.keys
        .mockResolvedValueOnce(['sys:dict:type1', 'sys:dict:type2'])
        .mockResolvedValueOnce(['sys:config:key1']);

      const stats = await service.getStats();

      expect(stats).toHaveProperty('dict');
      expect(stats).toHaveProperty('config');
      expect(stats.dict.count).toBe(2);
      expect(stats.config.count).toBe(1);
    });

    it('should return zero count when no keys exist', async () => {
      redis.keys.mockResolvedValue([]);

      const stats = await service.getStats();

      expect(stats.dict.count).toBe(0);
      expect(stats.config.count).toBe(0);
    });
  });

  describe('Cache invalidation', () => {
    it('should invalidate dict cache when refreshed', async () => {
      const mockDictTypes = [{ dictType: 'sys_user_sex' }];
      const mockDictData = [
        { dictType: 'sys_user_sex', dictLabel: '男', dictValue: '0', dictSort: 1, status: StatusEnum.NORMAL },
      ];

      redis.keys.mockResolvedValue(['sys:dict:sys_user_sex']);
      (prisma.sysDictType.findMany as jest.Mock).mockResolvedValue(mockDictTypes as any);
      (prisma.sysDictData.findMany as jest.Mock).mockResolvedValue(mockDictData as any);

      await service.refresh('dict');

      // Verify old cache was deleted
      expect(redis.del).toHaveBeenCalledWith(['sys:dict:sys_user_sex']);
      
      // Verify new cache was set
      expect(redis.set).toHaveBeenCalled();
    });

    it('should invalidate config cache when refreshed', async () => {
      const mockConfigs = [
        { configKey: 'test.key', configValue: 'new-value', status: StatusEnum.NORMAL, delFlag: DelFlagEnum.NORMAL },
      ];

      redis.keys.mockResolvedValue(['sys:config:test.key']);
      (prisma.sysConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs as any);

      await service.refresh('config');

      expect(redis.del).toHaveBeenCalledWith(['sys:config:test.key']);
      expect(redis.set).toHaveBeenCalled();
    });
  });
});
