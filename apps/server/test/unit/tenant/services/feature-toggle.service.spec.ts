import { Test, TestingModule } from '@nestjs/testing';
import { FeatureToggleService, FeatureConfig } from '@/core/tenancy/services/feature-toggle.service';
import { PrismaService } from '@/platform/prisma';
import { RedisService } from '@/platform/redis/redis.service';

describe('FeatureToggleService', () => {
  let service: FeatureToggleService;
  let prisma: jest.Mocked<PrismaService>;
  let redis: jest.Mocked<RedisService>;

  const mockRedisClient = {
    expire: jest.fn(),
    incrby: jest.fn(),
  };

  const mockPrismaService = {
    sysTenantFeature: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    hGetAll: jest.fn(),
    hmset: jest.fn(),
    getClient: jest.fn(() => mockRedisClient),
  };

  beforeEach(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureToggleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = modules.get<FeatureToggleService>(FeatureToggleService);
    prisma = modules.get(PrismaService);
    redis = modules.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isEnabled', () => {
    const tenantId = '100001';
    const feature = 'advanced_analytics';

    it('应该在参数为空时返回 false', async () => {
      expect(await service.isEnabled('', feature)).toBe(false);
      expect(await service.isEnabled(tenantId, '')).toBe(false);
      expect(await service.isEnabled('', '')).toBe(false);
    });

    it('应该从缓存获取功能状态（启用）', async () => {
      mockRedisService.hget.mockResolvedValue('1');

      const result = await service.isEnabled(tenantId, feature);

      expect(result).toBe(true);
      expect(mockRedisService.hget).toHaveBeenCalledWith(`tenant:feature:${tenantId}`, feature);
      expect(mockPrismaService.sysTenantFeature.findUnique).not.toHaveBeenCalled();
    });

    it('应该从缓存获取功能状态（禁用）', async () => {
      mockRedisService.hget.mockResolvedValue('0');

      const result = await service.isEnabled(tenantId, feature);

      expect(result).toBe(false);
    });

    it('应该处理缓存值为 true 字符串', async () => {
      mockRedisService.hget.mockResolvedValue('true');

      const result = await service.isEnabled(tenantId, feature);

      expect(result).toBe(true);
    });

    it('应该在缓存未命中时从数据库获取', async () => {
      mockRedisService.hget.mockResolvedValue(null);
      mockPrismaService.sysTenantFeature.findUnique.mockResolvedValue({
        tenantId,
        featureKey: feature,
        enabled: true,
      });

      const result = await service.isEnabled(tenantId, feature);

      expect(result).toBe(true);
      expect(mockPrismaService.sysTenantFeature.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_featureKey: {
            tenantId,
            featureKey: feature,
          },
        },
      });
      expect(mockRedisService.hset).toHaveBeenCalledWith(`tenant:feature:${tenantId}`, feature, '1');
    });

    it('应该在数据库中不存在时返回 false', async () => {
      mockRedisService.hget.mockResolvedValue(null);
      mockPrismaService.sysTenantFeature.findUnique.mockResolvedValue(null);

      const result = await service.isEnabled(tenantId, feature);

      expect(result).toBe(false);
      expect(mockRedisService.hset).toHaveBeenCalledWith(`tenant:feature:${tenantId}`, feature, '0');
    });

    it('应该在发生错误时返回 false', async () => {
      mockRedisService.hget.mockRejectedValue(new Error('Redis error'));

      const result = await service.isEnabled(tenantId, feature);

      expect(result).toBe(false);
    });
  });

  describe('setFeature', () => {
    const tenantId = '100001';
    const feature = 'advanced_analytics';

    it('应该在参数为空时抛出错误', async () => {
      await expect(service.setFeature('', feature, true)).rejects.toThrow('tenantId and feature are required');
      await expect(service.setFeature(tenantId, '', true)).rejects.toThrow('tenantId and feature are required');
    });

    it('应该成功设置功能开关（启用）', async () => {
      mockPrismaService.sysTenantFeature.upsert.mockResolvedValue({});

      await service.setFeature(tenantId, feature, true);

      expect(mockPrismaService.sysTenantFeature.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_featureKey: {
            tenantId,
            featureKey: feature,
          },
        },
        update: {
          enabled: true,
          mockConfig: null,
          updateTime: expect.any(Date),
        },
        create: {
          tenantId,
          featureKey: feature,
          enabled: true,
          mockConfig: null,
        },
      });
      expect(mockRedisService.hset).toHaveBeenCalledWith(`tenant:feature:${tenantId}`, feature, '1');
    });

    it('应该成功设置功能开关（禁用）', async () => {
      mockPrismaService.sysTenantFeature.upsert.mockResolvedValue({});

      await service.setFeature(tenantId, feature, false);

      expect(mockRedisService.hset).toHaveBeenCalledWith(`tenant:feature:${tenantId}`, feature, '0');
    });

    it('应该支持设置功能配置', async () => {
      mockPrismaService.sysTenantFeature.upsert.mockResolvedValue({});
      const mockConfig = { maxUsers: 100, theme: 'dark' };

      await service.setFeature(tenantId, feature, true, mockConfig);

      expect(mockPrismaService.sysTenantFeature.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_featureKey: {
            tenantId,
            featureKey: feature,
          },
        },
        update: {
          enabled: true,
          mockConfig: JSON.stringify(mockConfig),
          updateTime: expect.any(Date),
        },
        create: {
          tenantId,
          featureKey: feature,
          enabled: true,
          mockConfig: JSON.stringify(mockConfig),
        },
      });
    });

    it('应该在数据库错误时抛出异常', async () => {
      const dbError = new Error('Database error');
      mockPrismaService.sysTenantFeature.upsert.mockReset();
      mockPrismaService.sysTenantFeature.upsert.mockRejectedValueOnce(dbError);

      await expect(service.setFeature(tenantId, feature, true)).rejects.toThrow(dbError);
    });
  });

  describe('getTenantFeatures', () => {
    const tenantId = '100001';

    it('应该在 tenantId 为空时返回空对象', async () => {
      const result = await service.getTenantFeatures('');

      expect(result).toEqual({});
    });

    it('应该从缓存获取所有功能开关', async () => {
      mockRedisService.hGetAll.mockResolvedValue({
        feature1: '1',
        feature2: '0',
        feature3: 'true',
      });

      const result = await service.getTenantFeatures(tenantId);

      expect(result).toEqual({
        feature1: true,
        feature2: false,
        feature3: true,
      });
      expect(mockPrismaService.sysTenantFeature.findMany).not.toHaveBeenCalled();
    });

    it('应该在缓存为空时从数据库获取', async () => {
      mockRedisService.hGetAll.mockResolvedValue({});
      mockPrismaService.sysTenantFeature.findMany.mockResolvedValue([
        { tenantId, featureKey: 'feature1', enabled: true },
        { tenantId, featureKey: 'feature2', enabled: false },
      ]);

      const result = await service.getTenantFeatures(tenantId);

      expect(result).toEqual({
        feature1: true,
        feature2: false,
      });
      expect(mockPrismaService.sysTenantFeature.findMany).toHaveBeenCalledWith({
        where: { tenantId },
      });
    });

    it('应该在发生错误时返回空对象', async () => {
      mockRedisService.hGetAll.mockRejectedValue(new Error('Redis error'));

      const result = await service.getTenantFeatures(tenantId);

      expect(result).toEqual({});
    });
  });

  describe('getFeatureConfig', () => {
    const tenantId = '100001';
    const feature = 'advanced_analytics';

    it('应该在参数为空时返回 null', async () => {
      expect(await service.getFeatureConfig('', feature)).toBeNull();
      expect(await service.getFeatureConfig(tenantId, '')).toBeNull();
    });

    it('应该返回功能配置（带配置）', async () => {
      const mockConfig = { maxUsers: 100, theme: 'dark' };
      mockPrismaService.sysTenantFeature.findUnique.mockResolvedValue({
        tenantId,
        featureKey: feature,
        enabled: true,
        mockConfig: JSON.stringify(mockConfig),
      });

      const result = await service.getFeatureConfig(tenantId, feature);

      expect(result).toEqual({
        enabled: true,
        mockConfig,
      });
    });

    it('应该返回功能配置（无配置）', async () => {
      mockPrismaService.sysTenantFeature.findUnique.mockResolvedValue({
        tenantId,
        featureKey: feature,
        enabled: false,
        mockConfig: null,
      });

      const result = await service.getFeatureConfig(tenantId, feature);

      expect(result).toEqual({
        enabled: false,
        mockConfig: undefined,
      });
    });

    it('应该在功能不存在时返回 null', async () => {
      mockPrismaService.sysTenantFeature.findUnique.mockResolvedValue(null);

      const result = await service.getFeatureConfig(tenantId, feature);

      expect(result).toBeNull();
    });

    it('应该在发生错误时返回 null', async () => {
      mockPrismaService.sysTenantFeature.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await service.getFeatureConfig(tenantId, feature);

      expect(result).toBeNull();
    });
  });

  describe('deleteFeature', () => {
    const tenantId = '100001';
    const feature = 'advanced_analytics';

    it('应该在参数为空时直接返回', async () => {
      await service.deleteFeature('', feature);
      await service.deleteFeature(tenantId, '');

      expect(mockPrismaService.sysTenantFeature.deleteMany).not.toHaveBeenCalled();
    });

    it('应该成功删除功能开关', async () => {
      mockPrismaService.sysTenantFeature.deleteMany.mockResolvedValue({ count: 1 });

      await service.deleteFeature(tenantId, feature);

      expect(mockPrismaService.sysTenantFeature.deleteMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          featureKey: feature,
        },
      });
      expect(mockRedisService.hdel).toHaveBeenCalledWith(`tenant:feature:${tenantId}`, feature);
    });

    it('应该在数据库错误时抛出异常', async () => {
      const dbError = new Error('Database error');
      mockPrismaService.sysTenantFeature.deleteMany.mockRejectedValue(dbError);

      await expect(service.deleteFeature(tenantId, feature)).rejects.toThrow(dbError);
    });
  });

  describe('clearCache', () => {
    const tenantId = '100001';

    it('应该在 tenantId 为空时直接返回', async () => {
      await service.clearCache('');

      expect(mockRedisService.del).not.toHaveBeenCalled();
    });

    it('应该成功清除缓存', async () => {
      mockRedisService.del.mockResolvedValue(1);

      await service.clearCache(tenantId);

      expect(mockRedisService.del).toHaveBeenCalledWith(`tenant:feature:${tenantId}`);
    });

    it('应该在缓存清除失败时不抛出异常', async () => {
      mockRedisService.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.clearCache(tenantId)).resolves.not.toThrow();
    });
  });

  describe('setFeatures', () => {
    const tenantId = '100001';

    it('应该在参数为空时直接返回', async () => {
      await service.setFeatures('', { feature1: true });
      await service.setFeatures(tenantId, {});

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('应该批量设置功能开关', async () => {
      const features = {
        feature1: true,
        feature2: false,
        feature3: true,
      };
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.setFeatures(tenantId, features);

      expect(mockPrismaService.$transaction).toHaveBeenCalledWith([
        expect.objectContaining({}),
        expect.objectContaining({}),
        expect.objectContaining({}),
      ]);
      expect(mockRedisService.hmset).toHaveBeenCalledWith(
        `tenant:feature:${tenantId}`,
        {
          feature1: '1',
          feature2: '0',
          feature3: '1',
        },
        300,
      );
    });

    it('应该在数据库错误时抛出异常', async () => {
      mockPrismaService.$transaction.mockRejectedValue(new Error('Transaction error'));

      await expect(service.setFeatures(tenantId, { feature1: true })).rejects.toThrow('Transaction error');
    });
  });

  describe('租户隔离验证', () => {
    it('不同租户的功能开关应该独立', async () => {
      const tenant1 = '100001';
      const tenant2 = '100002';
      const feature = 'advanced_analytics';

      // 设置租户1的功能为启用
      mockPrismaService.sysTenantFeature.upsert.mockResolvedValue({});
      await service.setFeature(tenant1, feature, true);

      // 设置租户2的功能为禁用
      await service.setFeature(tenant2, feature, false);

      // 验证缓存键是独立的
      expect(mockRedisService.hset).toHaveBeenCalledWith(`tenant:feature:${tenant1}`, feature, '1');
      expect(mockRedisService.hset).toHaveBeenCalledWith(`tenant:feature:${tenant2}`, feature, '0');
    });

    it('获取功能状态时应该使用正确的租户ID', async () => {
      const tenant1 = '100001';
      const tenant2 = '100002';
      const feature = 'advanced_analytics';

      mockRedisService.hget.mockResolvedValue('1');

      await service.isEnabled(tenant1, feature);
      await service.isEnabled(tenant2, feature);

      expect(mockRedisService.hget).toHaveBeenCalledWith(`tenant:feature:${tenant1}`, feature);
      expect(mockRedisService.hget).toHaveBeenCalledWith(`tenant:feature:${tenant2}`, feature);
    });
  });
});
