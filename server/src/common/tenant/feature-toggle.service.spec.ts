import { Test, TestingModule } from '@nestjs/testing';
import { FeatureToggleService } from './feature-toggle.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('FeatureToggleService', () => {
  let service: FeatureToggleService;
  let redisService: jest.Mocked<RedisService>;
  let prismaService: jest.Mocked<PrismaService>;

  const mockRedisClient = {
    expire: jest.fn().mockResolvedValue(1),
  };

  beforeEach(async () => {
    const mockRedisService = {
      hget: jest.fn(),
      hset: jest.fn(),
      hGetAll: jest.fn(),
      hdel: jest.fn(),
      hmset: jest.fn(),
      del: jest.fn(),
      getClient: jest.fn().mockReturnValue(mockRedisClient),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureToggleService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FeatureToggleService>(FeatureToggleService);
    redisService = module.get(RedisService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isEnabled', () => {
    it('should return false for empty tenantId', async () => {
      const result = await service.isEnabled('', 'feature1');
      expect(result).toBe(false);
    });

    it('should return false for empty feature', async () => {
      const result = await service.isEnabled('tenant1', '');
      expect(result).toBe(false);
    });

    it('should return cached value when available (true)', async () => {
      redisService.hget.mockResolvedValue('1');

      const result = await service.isEnabled('tenant1', 'feature1');

      expect(result).toBe(true);
      expect(redisService.hget).toHaveBeenCalledWith('tenant:feature:tenant1', 'feature1');
      expect(prismaService.sysTenantFeature.findUnique).not.toHaveBeenCalled();
    });

    it('should return cached value when available (false)', async () => {
      redisService.hget.mockResolvedValue('0');

      const result = await service.isEnabled('tenant1', 'feature1');

      expect(result).toBe(false);
    });

    it('should query database when cache miss and cache the result', async () => {
      redisService.hget.mockResolvedValue(null);
      (prismaService.sysTenantFeature.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        tenantId: 'tenant1',
        featureKey: 'feature1',
        enabled: true,
      });

      const result = await service.isEnabled('tenant1', 'feature1');

      expect(result).toBe(true);
      expect(prismaService.sysTenantFeature.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_featureKey: {
            tenantId: 'tenant1',
            featureKey: 'feature1',
          },
        },
      });
      expect(redisService.hset).toHaveBeenCalledWith('tenant:feature:tenant1', 'feature1', '1');
      expect(mockRedisClient.expire).toHaveBeenCalled();
    });

    it('should return false when feature not found in database', async () => {
      redisService.hget.mockResolvedValue(null);
      (prismaService.sysTenantFeature.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.isEnabled('tenant1', 'feature1');

      expect(result).toBe(false);
      expect(redisService.hset).toHaveBeenCalledWith('tenant:feature:tenant1', 'feature1', '0');
    });

    it('should return false on error', async () => {
      redisService.hget.mockRejectedValue(new Error('Redis error'));

      const result = await service.isEnabled('tenant1', 'feature1');

      expect(result).toBe(false);
    });
  });

  describe('setFeature', () => {
    it('should throw error for empty tenantId', async () => {
      await expect(service.setFeature('', 'feature1', true)).rejects.toThrow(
        'tenantId and feature are required',
      );
    });

    it('should throw error for empty feature', async () => {
      await expect(service.setFeature('tenant1', '', true)).rejects.toThrow(
        'tenantId and feature are required',
      );
    });

    it('should upsert feature and update cache', async () => {
      (prismaService.sysTenantFeature.upsert as jest.Mock).mockResolvedValue({
        id: 1,
        tenantId: 'tenant1',
        featureKey: 'feature1',
        enabled: true,
      });

      await service.setFeature('tenant1', 'feature1', true);

      expect(prismaService.sysTenantFeature.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_featureKey: {
            tenantId: 'tenant1',
            featureKey: 'feature1',
          },
        },
        update: {
          enabled: true,
          config: null,
          updateTime: expect.any(Date),
        },
        create: {
          tenantId: 'tenant1',
          featureKey: 'feature1',
          enabled: true,
          config: null,
        },
      });
      expect(redisService.hset).toHaveBeenCalledWith('tenant:feature:tenant1', 'feature1', '1');
    });

    it('should store config as JSON when provided', async () => {
      (prismaService.sysTenantFeature.upsert as jest.Mock).mockResolvedValue({
        id: 1,
        tenantId: 'tenant1',
        featureKey: 'feature1',
        enabled: true,
        config: '{"maxUsers":100}',
      });

      await service.setFeature('tenant1', 'feature1', true, { maxUsers: 100 });

      expect(prismaService.sysTenantFeature.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            config: '{"maxUsers":100}',
          }),
          create: expect.objectContaining({
            config: '{"maxUsers":100}',
          }),
        }),
      );
    });

    it('should propagate database errors', async () => {
      (prismaService.sysTenantFeature.upsert as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.setFeature('tenant1', 'feature1', true)).rejects.toThrow('Database error');
    });
  });

  describe('getTenantFeatures', () => {
    it('should return empty object for empty tenantId', async () => {
      const result = await service.getTenantFeatures('');
      expect(result).toEqual({});
    });

    it('should return cached features when available', async () => {
      redisService.hGetAll.mockResolvedValue({
        feature1: '1',
        feature2: '0',
        feature3: 'true',
      });

      const result = await service.getTenantFeatures('tenant1');

      expect(result).toEqual({
        feature1: true,
        feature2: false,
        feature3: true,
      });
      expect(prismaService.sysTenantFeature.findMany).not.toHaveBeenCalled();
    });

    it('should query database when cache is empty', async () => {
      redisService.hGetAll.mockResolvedValue({});
      (prismaService.sysTenantFeature.findMany as jest.Mock).mockResolvedValue([
        { featureKey: 'feature1', enabled: true },
        { featureKey: 'feature2', enabled: false },
      ]);

      const result = await service.getTenantFeatures('tenant1');

      expect(result).toEqual({
        feature1: true,
        feature2: false,
      });
      expect(prismaService.sysTenantFeature.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant1' },
      });
    });

    it('should return empty object on error', async () => {
      redisService.hGetAll.mockRejectedValue(new Error('Redis error'));

      const result = await service.getTenantFeatures('tenant1');

      expect(result).toEqual({});
    });
  });

  describe('getFeatureConfig', () => {
    it('should return null for empty tenantId', async () => {
      const result = await service.getFeatureConfig('', 'feature1');
      expect(result).toBeNull();
    });

    it('should return null for empty feature', async () => {
      const result = await service.getFeatureConfig('tenant1', '');
      expect(result).toBeNull();
    });

    it('should return feature config from database', async () => {
      (prismaService.sysTenantFeature.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        tenantId: 'tenant1',
        featureKey: 'feature1',
        enabled: true,
        config: '{"maxUsers":100}',
      });

      const result = await service.getFeatureConfig('tenant1', 'feature1');

      expect(result).toEqual({
        enabled: true,
        config: { maxUsers: 100 },
      });
    });

    it('should return null when feature not found', async () => {
      (prismaService.sysTenantFeature.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getFeatureConfig('tenant1', 'feature1');

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (prismaService.sysTenantFeature.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getFeatureConfig('tenant1', 'feature1');

      expect(result).toBeNull();
    });
  });

  describe('deleteFeature', () => {
    it('should do nothing for empty tenantId', async () => {
      await service.deleteFeature('', 'feature1');
      expect(prismaService.sysTenantFeature.deleteMany).not.toHaveBeenCalled();
    });

    it('should do nothing for empty feature', async () => {
      await service.deleteFeature('tenant1', '');
      expect(prismaService.sysTenantFeature.deleteMany).not.toHaveBeenCalled();
    });

    it('should delete from database and cache', async () => {
      (prismaService.sysTenantFeature.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.deleteFeature('tenant1', 'feature1');

      expect(prismaService.sysTenantFeature.deleteMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant1',
          featureKey: 'feature1',
        },
      });
      expect(redisService.hdel).toHaveBeenCalledWith('tenant:feature:tenant1', 'feature1');
    });

    it('should propagate database errors', async () => {
      (prismaService.sysTenantFeature.deleteMany as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.deleteFeature('tenant1', 'feature1')).rejects.toThrow('Database error');
    });
  });

  describe('clearCache', () => {
    it('should do nothing for empty tenantId', async () => {
      await service.clearCache('');
      expect(redisService.del).not.toHaveBeenCalled();
    });

    it('should delete cache key', async () => {
      await service.clearCache('tenant1');
      expect(redisService.del).toHaveBeenCalledWith('tenant:feature:tenant1');
    });

    it('should not throw on error', async () => {
      redisService.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.clearCache('tenant1')).resolves.not.toThrow();
    });
  });

  describe('setFeatures', () => {
    it('should do nothing for empty tenantId', async () => {
      await service.setFeatures('', { feature1: true });
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should do nothing for empty features', async () => {
      await service.setFeatures('tenant1', {});
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should batch update features', async () => {
      (prismaService.$transaction as jest.Mock).mockResolvedValue([]);

      await service.setFeatures('tenant1', {
        feature1: true,
        feature2: false,
      });

      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(redisService.hmset).toHaveBeenCalledWith(
        'tenant:feature:tenant1',
        { feature1: '1', feature2: '0' },
        300,
      );
    });

    it('should propagate transaction errors', async () => {
      (prismaService.$transaction as jest.Mock).mockRejectedValue(new Error('Transaction error'));

      await expect(
        service.setFeatures('tenant1', { feature1: true }),
      ).rejects.toThrow('Transaction error');
    });
  });
});
