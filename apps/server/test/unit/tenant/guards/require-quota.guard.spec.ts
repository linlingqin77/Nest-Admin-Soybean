import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RequireQuotaGuard,
  RequireQuotaOptions,
  REQUIRE_QUOTA_KEY,
} from '@/core/tenancy/guards/require-quota.guard';
import { TenantQuotaService, QuotaResource } from '@/core/tenancy/services/quota.service';
import { TenantContext } from '@/core/tenancy/context/tenant.context';

describe('RequireQuotaGuard', () => {
  let guard: RequireQuotaGuard;
  let reflector: Reflector;
  let quotaService: jest.Mocked<TenantQuotaService>;

  const createMockContext = (handler?: any, classRef?: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
      getHandler: () => handler || jest.fn(),
      getClass: () => classRef || class TestClass {},
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        RequireQuotaGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: TenantQuotaService,
          useValue: {
            checkQuota: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = modules.get<RequireQuotaGuard>(RequireQuotaGuard);
    reflector = modules.get<Reflector>(Reflector);
    quotaService = modules.get(TenantQuotaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate - 无装饰器场景', () => {
    it('当没有 @RequireQuota 装饰器时应返回 true', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = await guard.canActivate(createMockContext());

      expect(result).toBe(true);
      expect(quotaService.checkQuota).not.toHaveBeenCalled();
    });

    it('当装饰器返回 null 时应返回 true', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const result = await guard.canActivate(createMockContext());

      expect(result).toBe(true);
    });
  });

  describe('canActivate - 无租户上下文场景', () => {
    it('当没有租户上下文时应抛出 ForbiddenException', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.USERS };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);

      await expect(guard.canActivate(createMockContext())).rejects.toThrow(ForbiddenException);
    });

    it('当没有租户上下文时应使用默认错误消息', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.USERS };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);

      await expect(guard.canActivate(createMockContext())).rejects.toThrow('配额检查需要租户上下文');
    });

    it('当没有租户上下文时应使用自定义错误消息', async () => {
      const options: RequireQuotaOptions = {
        resource: QuotaResource.USERS,
        message: '自定义错误消息',
      };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);

      await expect(guard.canActivate(createMockContext())).rejects.toThrow('自定义错误消息');
    });
  });

  describe('canActivate - 超级租户场景', () => {
    it('超级租户应跳过配额检查', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.USERS };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);

      // @ts-expect-error
      const result = await TenantContext.run({ tenantId: '000000', isSuperTenant: true }, async () => {
        return guard.canActivate(createMockContext());
      });

      expect(result).toBe(true);
      expect(quotaService.checkQuota).not.toHaveBeenCalled();
    });

    it('超级租户即使配额为0也应通过', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.USERS };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);

      // @ts-expect-error
      const result = await TenantContext.run({ tenantId: '000000', isSuperTenant: true }, async () => {
        return guard.canActivate(createMockContext());
      });

      expect(result).toBe(true);
    });
  });

  describe('canActivate - 配额充足场景', () => {
    it('当配额充足时应返回 true', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.USERS };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      quotaService.checkQuota.mockResolvedValue({
        allowed: true,
        currentUsage: 5,
        quota: 10,
        remaining: 5,
      });

      const result = await TenantContext.run({ tenantId: '123456' }, async () => {
        return guard.canActivate(createMockContext());
      });

      expect(result).toBe(true);
      expect(quotaService.checkQuota).toHaveBeenCalledWith('123456', QuotaResource.USERS);
    });

    it('应使用正确的租户ID检查配额', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.STORAGE };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      quotaService.checkQuota.mockResolvedValue({
        allowed: true,
        currentUsage: 100,
        quota: 1000,
        remaining: 900,
      });

      await TenantContext.run({ tenantId: '654321' }, async () => {
        await guard.canActivate(createMockContext());
      });

      expect(quotaService.checkQuota).toHaveBeenCalledWith('654321', QuotaResource.STORAGE);
    });
  });

  describe('canActivate - 配额不足场景', () => {
    it('当配额不足时应抛出 ForbiddenException', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.USERS };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      quotaService.checkQuota.mockResolvedValue({
        allowed: false,
        currentUsage: 10,
        quota: 10,
        remaining: 0,
      });

      await expect(
        TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('当用户数配额不足时应显示正确的错误消息', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.USERS };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      quotaService.checkQuota.mockResolvedValue({
        allowed: false,
        currentUsage: 10,
        quota: 10,
        remaining: 0,
      });

      await expect(
        TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        }),
      ).rejects.toThrow('用户数配额已用尽，当前使用: 10，配额上限: 10');
    });

    it('当存储配额不足时应显示正确的错误消息', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.STORAGE };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      quotaService.checkQuota.mockResolvedValue({
        allowed: false,
        currentUsage: 1000,
        quota: 1000,
        remaining: 0,
      });

      await expect(
        TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        }),
      ).rejects.toThrow('存储空间配额已用尽，当前使用: 1000，配额上限: 1000');
    });

    it('当API调用配额不足时应显示正确的错误消息', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.API_CALLS };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      quotaService.checkQuota.mockResolvedValue({
        allowed: false,
        currentUsage: 10000,
        quota: 10000,
        remaining: 0,
      });

      await expect(
        TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        }),
      ).rejects.toThrow('API调用量配额已用尽，当前使用: 10000，配额上限: 10000');
    });

    it('当配额不足时应使用自定义错误消息', async () => {
      const options: RequireQuotaOptions = {
        resource: QuotaResource.USERS,
        message: '用户数已达上限，请升级套餐',
      };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      quotaService.checkQuota.mockResolvedValue({
        allowed: false,
        currentUsage: 10,
        quota: 10,
        remaining: 0,
      });

      await expect(
        TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        }),
      ).rejects.toThrow('用户数已达上限，请升级套餐');
    });
  });

  describe('canActivate - 装饰器检查', () => {
    it('应同时检查 handler 和 class 上的装饰器', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const handler = jest.fn();
      class TestController {}
      const context = createMockContext(handler, TestController);

      await guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(REQUIRE_QUOTA_KEY, [handler, TestController]);
    });
  });

  describe('canActivate - 不同资源类型', () => {
    const resourceTestCases = [
      { resource: QuotaResource.USERS, displayName: '用户数' },
      { resource: QuotaResource.STORAGE, displayName: '存储空间' },
      { resource: QuotaResource.API_CALLS, displayName: 'API调用量' },
    ];

    resourceTestCases.forEach(({ resource, displayName }) => {
      it(`应正确检查资源: ${resource}`, async () => {
        const options: RequireQuotaOptions = { resource };
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
        quotaService.checkQuota.mockResolvedValue({
          allowed: true,
          currentUsage: 5,
          quota: 10,
          remaining: 5,
        });

        const result = await TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        });

        expect(result).toBe(true);
        expect(quotaService.checkQuota).toHaveBeenCalledWith('123456', resource);
      });

      it(`资源 ${resource} 配额不足时应显示 ${displayName}`, async () => {
        const options: RequireQuotaOptions = { resource };
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
        quotaService.checkQuota.mockResolvedValue({
          allowed: false,
          currentUsage: 10,
          quota: 10,
          remaining: 0,
        });

        await expect(
          TenantContext.run({ tenantId: '123456' }, async () => {
            return guard.canActivate(createMockContext());
          }),
        ).rejects.toThrow(new RegExp(`${displayName}配额已用尽`));
      });
    });
  });

  describe('canActivate - 服务异常处理', () => {
    it('当 QuotaService 抛出异常时应传播异常', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.USERS };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      quotaService.checkQuota.mockRejectedValue(new Error('Service error'));

      await expect(
        TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        }),
      ).rejects.toThrow('Service error');
    });
  });

  describe('边界条件', () => {
    it('配额为0且使用为0时应允许', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.USERS };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      quotaService.checkQuota.mockResolvedValue({
        allowed: true,
        currentUsage: 0,
        quota: 0,
        remaining: 0,
      });

      const result = await TenantContext.run({ tenantId: '123456' }, async () => {
        return guard.canActivate(createMockContext());
      });

      expect(result).toBe(true);
    });

    it('剩余配额为1时应允许', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.USERS };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      quotaService.checkQuota.mockResolvedValue({
        allowed: true,
        currentUsage: 9,
        quota: 10,
        remaining: 1,
      });

      const result = await TenantContext.run({ tenantId: '123456' }, async () => {
        return guard.canActivate(createMockContext());
      });

      expect(result).toBe(true);
    });

    it('大数值配额应正常处理', async () => {
      const options: RequireQuotaOptions = { resource: QuotaResource.API_CALLS };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      quotaService.checkQuota.mockResolvedValue({
        allowed: true,
        currentUsage: 999999,
        quota: 1000000,
        remaining: 1,
      });

      const result = await TenantContext.run({ tenantId: '123456' }, async () => {
        return guard.canActivate(createMockContext());
      });

      expect(result).toBe(true);
    });
  });

  describe('getResourceDisplayName - 私有方法测试', () => {
    // 通过错误消息间接测试 getResourceDisplayName
    it('未知资源类型应显示"资源"', async () => {
      const options: RequireQuotaOptions = { resource: 'unknown' as QuotaResource };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      quotaService.checkQuota.mockResolvedValue({
        allowed: false,
        currentUsage: 10,
        quota: 10,
        remaining: 0,
      });

      await expect(
        TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        }),
      ).rejects.toThrow('资源配额已用尽');
    });
  });
});
