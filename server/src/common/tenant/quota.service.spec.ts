import { Test, TestingModule } from '@nestjs/testing';
import { TenantQuotaService, QuotaResource } from './quota.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { BusinessException } from 'src/common/exceptions';
import { createRedisMock, RedisMock } from 'src/test-utils/redis-mock';

describe('TenantQuotaService', () => {
  let service: TenantQuotaService;
  let prismaService: PrismaService;
  let redisService: RedisMock;

  const mockTenant = {
    tenantId: '100001',
    accountCount: 10,
    storageQuota: 1024,
    apiQuota: 1000,
    storageUsed: 100,
  };

  beforeEach(async () => {
    redisService = createRedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantQuotaService,
        {
          provide: PrismaService,
          useValue: {
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
          },
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    service = module.get<TenantQuotaService>(TenantQuotaService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkQuota', () => {
    it('should return allowed=true when usage is below quota', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.count as jest.Mock).mockResolvedValue(5);
      redisService.get.mockResolvedValue(null);

      const result = await service.checkQuota('100001', QuotaResource.USERS);

      expect(result.allowed).toBe(true);
      expect(result.currentUsage).toBe(5);
      expect(result.quota).toBe(10);
      expect(result.remaining).toBe(5);
    });

    it('should return allowed=false when usage equals quota', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.count as jest.Mock).mockResolvedValue(10);
      redisService.get.mockResolvedValue(null);

      const result = await service.checkQuota('100001', QuotaResource.USERS);

      expect(result.allowed).toBe(false);
      expect(result.currentUsage).toBe(10);
      expect(result.quota).toBe(10);
      expect(result.remaining).toBe(0);
    });

    it('should return allowed=true when quota is unlimited (-1)', async () => {
      const unlimitedTenant = { ...mockTenant, accountCount: -1 };
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(unlimitedTenant);
      (prismaService.sysUser.count as jest.Mock).mockResolvedValue(100);
      redisService.get.mockResolvedValue(null);

      const result = await service.checkQuota('100001', QuotaResource.USERS);

      expect(result.allowed).toBe(true);
      expect(result.quota).toBe(-1);
      expect(result.remaining).toBe(-1);
    });

    it('should throw error when tenantId is empty', async () => {
      await expect(service.checkQuota('', QuotaResource.USERS)).rejects.toThrow(BusinessException);
    });

    it('should throw error when tenant not found', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);
      redisService.get.mockResolvedValue(null);

      await expect(service.checkQuota('nonexistent', QuotaResource.USERS)).rejects.toThrow(BusinessException);
    });

    it('should check storage quota correctly', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      redisService.get.mockResolvedValue(null);

      const result = await service.checkQuota('100001', QuotaResource.STORAGE);

      expect(result.allowed).toBe(true);
      expect(result.currentUsage).toBe(100);
      expect(result.quota).toBe(1024);
    });

    it('should check API calls quota correctly', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysTenantUsage.findUnique as jest.Mock).mockResolvedValue({
        apiCalls: 500,
      });
      redisService.get.mockResolvedValue(null);

      const result = await service.checkQuota('100001', QuotaResource.API_CALLS);

      expect(result.allowed).toBe(true);
      expect(result.currentUsage).toBe(500);
      expect(result.quota).toBe(1000);
    });

    it('should use cached quota data when available', async () => {
      redisService.get.mockResolvedValueOnce(JSON.stringify({
        accountCount: 10,
        storageQuota: 1024,
        apiQuota: 1000,
      }));
      redisService.get.mockResolvedValueOnce('5'); // cached usage

      const result = await service.checkQuota('100001', QuotaResource.USERS);

      expect(result.allowed).toBe(true);
      expect(prismaService.sysTenant.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('incrementUsage', () => {
    it('should increment API calls usage', async () => {
      (prismaService.sysTenantUsage.upsert as jest.Mock).mockResolvedValue({});
      redisService.getClient.mockReturnValue({
        incrby: jest.fn().mockResolvedValue(1),
      });

      await service.incrementUsage('100001', QuotaResource.API_CALLS, 1);

      expect(prismaService.sysTenantUsage.upsert).toHaveBeenCalled();
    });

    it('should not increment when amount is 0 or negative', async () => {
      await service.incrementUsage('100001', QuotaResource.API_CALLS, 0);
      await service.incrementUsage('100001', QuotaResource.API_CALLS, -1);

      expect(prismaService.sysTenantUsage.upsert).not.toHaveBeenCalled();
    });

    it('should not increment when tenantId is empty', async () => {
      await service.incrementUsage('', QuotaResource.API_CALLS, 1);

      expect(prismaService.sysTenantUsage.upsert).not.toHaveBeenCalled();
    });
  });

  describe('getUsageStats', () => {
    it('should return usage stats for date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const mockUsage = [
        { tenantId: '100001', date: new Date('2025-01-01'), apiCalls: 100, storageUsed: 50, userCount: 5 },
        { tenantId: '100001', date: new Date('2025-01-02'), apiCalls: 150, storageUsed: 55, userCount: 5 },
      ];

      (prismaService.sysTenantUsage.findMany as jest.Mock).mockResolvedValue(mockUsage);

      const result = await service.getUsageStats('100001', startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result[0].apiCalls).toBe(100);
      expect(result[1].apiCalls).toBe(150);
    });

    it('should return empty array when tenantId is empty', async () => {
      const result = await service.getUsageStats('', new Date(), new Date());
      expect(result).toEqual([]);
    });
  });

  describe('getTodayUsage', () => {
    it('should return today usage stats', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      (prismaService.sysTenantUsage.findUnique as jest.Mock).mockResolvedValue({
        tenantId: '100001',
        date: today,
        apiCalls: 100,
        storageUsed: 50,
        userCount: 5,
      });

      const result = await service.getTodayUsage('100001');

      expect(result).not.toBeNull();
      expect(result!.apiCalls).toBe(100);
    });

    it('should return default stats when no usage record exists', async () => {
      (prismaService.sysTenantUsage.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.sysUser.count as jest.Mock).mockResolvedValue(3);

      const result = await service.getTodayUsage('100001');

      expect(result).not.toBeNull();
      expect(result!.apiCalls).toBe(0);
      expect(result!.userCount).toBe(3);
    });

    it('should return null when tenantId is empty', async () => {
      const result = await service.getTodayUsage('');
      expect(result).toBeNull();
    });
  });

  describe('updateStorageUsage', () => {
    it('should update storage usage in tenant and usage tables', async () => {
      (prismaService.sysTenant.update as jest.Mock).mockResolvedValue({});
      (prismaService.sysTenantUsage.upsert as jest.Mock).mockResolvedValue({});

      await service.updateStorageUsage('100001', 200);

      expect(prismaService.sysTenant.update).toHaveBeenCalledWith({
        where: { tenantId: '100001' },
        data: { storageUsed: 200 },
      });
      expect(prismaService.sysTenantUsage.upsert).toHaveBeenCalled();
    });

    it('should not update when tenantId is empty', async () => {
      await service.updateStorageUsage('', 200);

      expect(prismaService.sysTenant.update).not.toHaveBeenCalled();
    });
  });

  describe('syncUserCount', () => {
    it('should sync user count to usage table', async () => {
      (prismaService.sysUser.count as jest.Mock).mockResolvedValue(8);
      (prismaService.sysTenantUsage.upsert as jest.Mock).mockResolvedValue({});

      await service.syncUserCount('100001');

      expect(prismaService.sysUser.count).toHaveBeenCalled();
      expect(prismaService.sysTenantUsage.upsert).toHaveBeenCalled();
    });

    it('should not sync when tenantId is empty', async () => {
      await service.syncUserCount('');

      expect(prismaService.sysUser.count).not.toHaveBeenCalled();
    });
  });

  describe('checkQuotaOrThrow', () => {
    it('should not throw when quota is available', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.count as jest.Mock).mockResolvedValue(5);
      redisService.get.mockResolvedValue(null);

      await expect(service.checkQuotaOrThrow('100001', QuotaResource.USERS)).resolves.not.toThrow();
    });

    it('should throw BusinessException when quota exceeded', async () => {
      (prismaService.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prismaService.sysUser.count as jest.Mock).mockResolvedValue(10);
      redisService.get.mockResolvedValue(null);

      await expect(service.checkQuotaOrThrow('100001', QuotaResource.USERS)).rejects.toThrow(BusinessException);
    });
  });

  describe('clearQuotaCache', () => {
    it('should clear all quota related caches', async () => {
      await service.clearQuotaCache('100001');

      // Should delete quota cache and all resource usage caches
      expect(redisService.del).toHaveBeenCalled();
    });

    it('should not clear when tenantId is empty', async () => {
      await service.clearQuotaCache('');

      expect(redisService.del).not.toHaveBeenCalled();
    });
  });
});
