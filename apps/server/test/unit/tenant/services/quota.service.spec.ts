import { Test, TestingModule } from '@nestjs/testing';
import { TenantQuotaService, QuotaResource, QuotaCheckResult } from '@/core/tenancy/services/quota.service';
import { PrismaService } from '@/platform/prisma';
import { RedisService } from '@/platform/redis/redis.service';
import { BusinessException } from '@/shared/exceptions';

describe('TenantQuotaService', () => {
  let service: TenantQuotaService;

  const mockRedisClient = {
    expire: jest.fn().mockResolvedValue(1),
    incrby: jest.fn().mockResolvedValue(1),
  };

  const mockPrismaService = {
    sysTenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    sysUser: {
      count: jest.fn(),
    },
    sysTenantUsage: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getClient: jest.fn(() => mockRedisClient),
  };

  beforeEach(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        TenantQuotaService,
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

    service = modules.get<TenantQuotaService>(TenantQuotaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkQuota', () => {
    const tenantId = '100001';

    it('应该在 tenantId 为空时抛出异常', async () => {
      await expect(service.checkQuota('', QuotaResource.USERS)).rejects.toThrow(BusinessException);
    });

    it('应该在租户不存在时抛出异常', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenant.findUnique.mockResolvedValue(null);

      await expect(service.checkQuota(tenantId, QuotaResource.USERS)).rejects.toThrow(BusinessException);
    });

    it('应该返回允许当使用量小于配额', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        accountCount: 20,
        storageQuota: 1024,
        apiQuota: 1000,
      });
      mockPrismaService.sysUser.count.mockResolvedValue(10);

      const result = await service.checkQuota(tenantId, QuotaResource.USERS);

      expect(result.allowed).toBe(true);
      expect(result.currentUsage).toBe(10);
      expect(result.quota).toBe(20);
      expect(result.remaining).toBe(10);
    });

    it('应该返回不允许当使用量等于配额', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        accountCount: 20,
        storageQuota: 1024,
        apiQuota: 1000,
      });
      mockPrismaService.sysUser.count.mockResolvedValue(20);

      const result = await service.checkQuota(tenantId, QuotaResource.USERS);

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(20);
      expect(result.quota).toBe(20);
      expect(result.remaining).toBe(0);
    });

    it('应该返回不允许当使用量大于配额', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        accountCount: 20,
        storageQuota: 1024,
        apiQuota: 1000,
      });
      mockPrismaService.sysUser.count.mockResolvedValue(25);

      const result = await service.checkQuota(tenantId, QuotaResource.USERS);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('应该返回允许当配额为 -1（无限制）', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        accountCount: -1,
        storageQuota: 1024,
        apiQuota: 1000,
      });
      mockPrismaService.sysUser.count.mockResolvedValue(1000);

      const result = await service.checkQuota(tenantId, QuotaResource.USERS);

      expect(result.allowed).toBe(true);
      expect(result.quota).toBe(-1);
      expect(result.remaining).toBe(-1);
    });

    it('应该正确检查存储配额', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        accountCount: 20,
        storageQuota: 1024,
        apiQuota: 1000,
        storageUsed: 500,
      });

      const result = await service.checkQuota(tenantId, QuotaResource.STORAGE);

      expect(result.allowed).toBe(true);
      expect(result.currentUsage).toBe(500);
      expect(result.quota).toBe(1024);
      expect(result.remaining).toBe(524);
    });

    it('应该正确检查 API 调用配额', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        accountCount: 20,
        storageQuota: 1024,
        apiQuota: 1000,
      });
      mockPrismaService.sysTenantUsage.findUnique.mockResolvedValue({
        apiCalls: 800,
      });

      const result = await service.checkQuota(tenantId, QuotaResource.API_CALLS);

      expect(result.allowed).toBe(true);
      expect(result.currentUsage).toBe(800);
      expect(result.quota).toBe(1000);
      expect(result.remaining).toBe(200);
    });

    it('应该从缓存获取配额信息', async () => {
      mockRedisService.get.mockResolvedValueOnce(
        JSON.stringify({
          accountCount: 20,
          storageQuota: 1024,
          apiQuota: 1000,
        }),
      );
      mockRedisService.get.mockResolvedValueOnce('10');

      const result = await service.checkQuota(tenantId, QuotaResource.USERS);

      expect(result.allowed).toBe(true);
      expect(mockPrismaService.sysTenant.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('getResourceUsage', () => {
    const tenantId = '100001';

    it('应该从缓存获取使用量', async () => {
      mockRedisService.get.mockResolvedValue('15');

      const result = await service.getResourceUsage(tenantId, QuotaResource.USERS);

      expect(result).toBe(15);
    });

    it('应该在缓存未命中时从数据库获取用户数', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysUser.count.mockResolvedValue(25);

      const result = await service.getResourceUsage(tenantId, QuotaResource.USERS);

      expect(result).toBe(25);
      expect(mockPrismaService.sysUser.count).toHaveBeenCalledWith({
        where: {
          tenantId,
          delFlag: '0',
        },
      });
    });

    it('应该在缓存未命中时从数据库获取存储使用量', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        storageUsed: 512,
      });

      const result = await service.getResourceUsage(tenantId, QuotaResource.STORAGE);

      expect(result).toBe(512);
    });

    it('应该在缓存未命中时从数据库获取 API 调用次数', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenantUsage.findUnique.mockResolvedValue({
        apiCalls: 500,
      });

      const result = await service.getResourceUsage(tenantId, QuotaResource.API_CALLS);

      expect(result).toBe(500);
    });

    it('应该在没有使用记录时返回 0', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenantUsage.findUnique.mockResolvedValue(null);

      const result = await service.getResourceUsage(tenantId, QuotaResource.API_CALLS);

      expect(result).toBe(0);
    });
  });

  describe('incrementUsage', () => {
    const tenantId = '100001';

    it('应该在 tenantId 为空时直接返回', async () => {
      await service.incrementUsage('', QuotaResource.API_CALLS);

      expect(mockPrismaService.sysTenantUsage.upsert).not.toHaveBeenCalled();
    });

    it('应该在 amount 为 0 或负数时直接返回', async () => {
      await service.incrementUsage(tenantId, QuotaResource.API_CALLS, 0);
      await service.incrementUsage(tenantId, QuotaResource.API_CALLS, -1);

      expect(mockPrismaService.sysTenantUsage.upsert).not.toHaveBeenCalled();
    });

    it('应该成功增加 API 调用次数', async () => {
      mockPrismaService.sysTenantUsage.upsert.mockResolvedValue({});

      await service.incrementUsage(tenantId, QuotaResource.API_CALLS, 1);

      expect(mockPrismaService.sysTenantUsage.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_date: {
            tenantId,
            date: expect.any(Date),
          },
        },
        update: {
          apiCalls: {
            increment: 1,
          },
        },
        create: {
          tenantId,
          date: expect.any(Date),
          apiCalls: 1,
        },
      });
    });

    it('应该成功增加用户数', async () => {
      mockPrismaService.sysTenantUsage.upsert.mockResolvedValue({});

      await service.incrementUsage(tenantId, QuotaResource.USERS, 5);

      expect(mockPrismaService.sysTenantUsage.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_date: {
            tenantId,
            date: expect.any(Date),
          },
        },
        update: {
          userCount: {
            increment: 5,
          },
        },
        create: {
          tenantId,
          date: expect.any(Date),
          userCount: 5,
        },
      });
    });

    it('应该更新 Redis 缓存', async () => {
      mockPrismaService.sysTenantUsage.upsert.mockResolvedValue({});

      await service.incrementUsage(tenantId, QuotaResource.API_CALLS, 1);

      expect(mockRedisClient.incrby).toHaveBeenCalled();
    });

    it('应该在数据库错误时抛出异常', async () => {
      mockPrismaService.sysTenantUsage.upsert.mockRejectedValue(new Error('Database error'));

      await expect(service.incrementUsage(tenantId, QuotaResource.API_CALLS, 1)).rejects.toThrow('Database error');
    });
  });

  describe('getUsageStats', () => {
    const tenantId = '100001';
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    it('应该在 tenantId 为空时返回空数组', async () => {
      const result = await service.getUsageStats('', startDate, endDate);

      expect(result).toEqual([]);
    });

    it('应该返回使用统计列表', async () => {
      const mockUsageRecords = [
        {
          tenantId,
          date: new Date('2024-01-01'),
          apiCalls: 100,
          storageUsed: 50,
          userCount: 10,
        },
        {
          tenantId,
          date: new Date('2024-01-02'),
          apiCalls: 150,
          storageUsed: 55,
          userCount: 11,
        },
      ];
      mockPrismaService.sysTenantUsage.findMany.mockResolvedValue(mockUsageRecords);

      const result = await service.getUsageStats(tenantId, startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result[0].apiCalls).toBe(100);
      expect(result[1].apiCalls).toBe(150);
      expect(mockPrismaService.sysTenantUsage.findMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('getTodayUsage', () => {
    const tenantId = '100001';

    it('应该在 tenantId 为空时返回 null', async () => {
      const result = await service.getTodayUsage('');

      expect(result).toBeNull();
    });

    it('应该返回今日使用统计', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      mockPrismaService.sysTenantUsage.findUnique.mockResolvedValue({
        tenantId,
        date: today,
        apiCalls: 200,
        storageUsed: 100,
        userCount: 15,
      });

      const result = await service.getTodayUsage(tenantId);

      expect(result).not.toBeNull();
      expect(result!.apiCalls).toBe(200);
      expect(result!.storageUsed).toBe(100);
      expect(result!.userCount).toBe(15);
    });

    it('应该在没有今日记录时返回默认值', async () => {
      mockPrismaService.sysTenantUsage.findUnique.mockResolvedValue(null);
      mockPrismaService.sysUser.count.mockResolvedValue(10);

      const result = await service.getTodayUsage(tenantId);

      expect(result).not.toBeNull();
      expect(result!.apiCalls).toBe(0);
      expect(result!.storageUsed).toBe(0);
      expect(result!.userCount).toBe(10);
    });
  });

  describe('updateStorageUsage', () => {
    const tenantId = '100001';

    it('应该在 tenantId 为空时直接返回', async () => {
      await service.updateStorageUsage('', 100);

      expect(mockPrismaService.sysTenant.update).not.toHaveBeenCalled();
    });

    it('应该更新租户存储使用量', async () => {
      mockPrismaService.sysTenant.update.mockResolvedValue({});
      mockPrismaService.sysTenantUsage.upsert.mockResolvedValue({});

      await service.updateStorageUsage(tenantId, 512);

      expect(mockPrismaService.sysTenant.update).toHaveBeenCalledWith({
        where: { tenantId },
        data: { storageUsed: 512 },
      });
    });

    it('应该更新今日统计', async () => {
      mockPrismaService.sysTenant.update.mockResolvedValue({});
      mockPrismaService.sysTenantUsage.upsert.mockResolvedValue({});

      await service.updateStorageUsage(tenantId, 512);

      expect(mockPrismaService.sysTenantUsage.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_date: {
            tenantId,
            date: expect.any(Date),
          },
        },
        update: {
          storageUsed: 512,
        },
        create: {
          tenantId,
          date: expect.any(Date),
          storageUsed: 512,
        },
      });
    });

    it('应该清除缓存', async () => {
      mockPrismaService.sysTenant.update.mockResolvedValue({});
      mockPrismaService.sysTenantUsage.upsert.mockResolvedValue({});

      await service.updateStorageUsage(tenantId, 512);

      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });

  describe('syncUserCount', () => {
    const tenantId = '100001';

    it('应该在 tenantId 为空时直接返回', async () => {
      await service.syncUserCount('');

      expect(mockPrismaService.sysUser.count).not.toHaveBeenCalled();
    });

    it('应该同步用户数量到使用统计', async () => {
      mockPrismaService.sysUser.count.mockResolvedValue(25);
      mockPrismaService.sysTenantUsage.upsert.mockResolvedValue({});

      await service.syncUserCount(tenantId);

      expect(mockPrismaService.sysUser.count).toHaveBeenCalledWith({
        where: {
          tenantId,
          delFlag: '0',
        },
      });
      expect(mockPrismaService.sysTenantUsage.upsert).toHaveBeenCalledWith({
        where: {
          tenantId_date: {
            tenantId,
            date: expect.any(Date),
          },
        },
        update: {
          userCount: 25,
        },
        create: {
          tenantId,
          date: expect.any(Date),
          userCount: 25,
        },
      });
    });
  });

  describe('clearQuotaCache', () => {
    const tenantId = '100001';

    it('应该在 tenantId 为空时直接返回', async () => {
      await service.clearQuotaCache('');

      expect(mockRedisService.del).not.toHaveBeenCalled();
    });

    it('应该清除所有配额相关缓存', async () => {
      await service.clearQuotaCache(tenantId);

      // 应该清除配额缓存和所有资源使用量缓存
      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });

  describe('checkQuotaOrThrow', () => {
    const tenantId = '100001';

    it('应该在配额内时不抛出异常', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        accountCount: 20,
        storageQuota: 1024,
        apiQuota: 1000,
      });
      mockPrismaService.sysUser.count.mockResolvedValue(10);

      await expect(service.checkQuotaOrThrow(tenantId, QuotaResource.USERS)).resolves.not.toThrow();
    });

    it('应该在配额超限时抛出异常', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        accountCount: 20,
        storageQuota: 1024,
        apiQuota: 1000,
      });
      mockPrismaService.sysUser.count.mockResolvedValue(20);

      await expect(service.checkQuotaOrThrow(tenantId, QuotaResource.USERS)).rejects.toThrow(BusinessException);
    });

    it('应该在配额为无限制时不抛出异常', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        accountCount: -1,
        storageQuota: 1024,
        apiQuota: 1000,
      });
      mockPrismaService.sysUser.count.mockResolvedValue(1000);

      await expect(service.checkQuotaOrThrow(tenantId, QuotaResource.USERS)).resolves.not.toThrow();
    });
  });
});
