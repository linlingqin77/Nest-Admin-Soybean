import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequireFeatureGuard } from '@/core/tenancy/guards/require-feature.guard';
import { FeatureToggleService } from '@/core/tenancy/services/feature-toggle.service';
import { TenantContext } from '@/core/tenancy/context/tenant.context';
import { REQUIRE_FEATURE_KEY, RequireFeatureOptions } from '@/core/tenancy/decorators/require-feature.decorator';

describe('RequireFeatureGuard', () => {
  let guard: RequireFeatureGuard;
  let reflector: Reflector;
  let featureToggleService: jest.Mocked<FeatureToggleService>;

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
        RequireFeatureGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: FeatureToggleService,
          useValue: {
            isEnabled: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = modules.get<RequireFeatureGuard>(RequireFeatureGuard);
    reflector = modules.get<Reflector>(Reflector);
    featureToggleService = modules.get(FeatureToggleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate - 无装饰器场景', () => {
    it('当没有 @RequireFeature 装饰器时应返回 true', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = await guard.canActivate(createMockContext());

      expect(result).toBe(true);
      expect(featureToggleService.isEnabled).not.toHaveBeenCalled();
    });

    it('当装饰器返回 null 时应返回 true', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const result = await guard.canActivate(createMockContext());

      expect(result).toBe(true);
    });
  });

  describe('canActivate - 无租户上下文场景', () => {
    it('当没有租户上下文时应抛出 ForbiddenException', async () => {
      const options: RequireFeatureOptions = { feature: 'test-feature' };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);

      // 在没有 TenantContext.run 的情况下调用
      await expect(guard.canActivate(createMockContext())).rejects.toThrow(ForbiddenException);
    });

    it('当没有租户上下文时应使用默认错误消息', async () => {
      const options: RequireFeatureOptions = { feature: 'test-feature' };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);

      await expect(guard.canActivate(createMockContext())).rejects.toThrow('功能 test-feature 需要租户上下文');
    });

    it('当没有租户上下文时应使用自定义错误消息', async () => {
      const options: RequireFeatureOptions = {
        feature: 'test-feature',
        message: '自定义错误消息',
      };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);

      await expect(guard.canActivate(createMockContext())).rejects.toThrow('自定义错误消息');
    });
  });

  describe('canActivate - 功能启用场景', () => {
    it('当功能已启用时应返回 true', async () => {
      const options: RequireFeatureOptions = { feature: 'test-feature' };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      featureToggleService.isEnabled.mockResolvedValue(true);

      const result = await TenantContext.run({ tenantId: '123456' }, async () => {
        return guard.canActivate(createMockContext());
      });

      expect(result).toBe(true);
      expect(featureToggleService.isEnabled).toHaveBeenCalledWith('123456', 'test-feature');
    });

    it('应使用正确的租户ID检查功能', async () => {
      const options: RequireFeatureOptions = { feature: 'advanced-analytics' };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      featureToggleService.isEnabled.mockResolvedValue(true);

      await TenantContext.run({ tenantId: '654321' }, async () => {
        await guard.canActivate(createMockContext());
      });

      expect(featureToggleService.isEnabled).toHaveBeenCalledWith('654321', 'advanced-analytics');
    });
  });

  describe('canActivate - 功能未启用场景', () => {
    it('当功能未启用时应抛出 ForbiddenException', async () => {
      const options: RequireFeatureOptions = { feature: 'test-feature' };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      featureToggleService.isEnabled.mockResolvedValue(false);

      await expect(
        TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('当功能未启用时应使用默认错误消息', async () => {
      const options: RequireFeatureOptions = { feature: 'export' };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      featureToggleService.isEnabled.mockResolvedValue(false);

      await expect(
        TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        }),
      ).rejects.toThrow('功能 export 未启用，请联系管理员');
    });

    it('当功能未启用时应使用自定义错误消息', async () => {
      const options: RequireFeatureOptions = {
        feature: 'export',
        message: '导出功能需要升级套餐',
      };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      featureToggleService.isEnabled.mockResolvedValue(false);

      await expect(
        TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        }),
      ).rejects.toThrow('导出功能需要升级套餐');
    });
  });

  describe('canActivate - 装饰器检查', () => {
    it('应同时检查 handler 和 class 上的装饰器', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const handler = jest.fn();
      class TestController {}
      const context = createMockContext(handler, TestController);

      await guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(REQUIRE_FEATURE_KEY, [handler, TestController]);
    });
  });

  describe('canActivate - 不同功能名称', () => {
    const testCases = ['advanced-analytics', 'export', 'import', 'api-access', 'custom-reports', 'multi-language'];

    testCases.forEach((feature) => {
      it(`应正确检查功能: ${feature}`, async () => {
        const options: RequireFeatureOptions = { feature };
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
        featureToggleService.isEnabled.mockResolvedValue(true);

        const result = await TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        });

        expect(result).toBe(true);
        expect(featureToggleService.isEnabled).toHaveBeenCalledWith('123456', feature);
      });
    });
  });

  describe('canActivate - 超级租户场景', () => {
    it('超级租户也应检查功能开关', async () => {
      const options: RequireFeatureOptions = { feature: 'test-feature' };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      featureToggleService.isEnabled.mockResolvedValue(true);

      // @ts-expect-error
      const result = await TenantContext.run({ tenantId: '000000', isSuperTenant: true }, async () => {
        return guard.canActivate(createMockContext());
      });

      expect(result).toBe(true);
      expect(featureToggleService.isEnabled).toHaveBeenCalledWith('000000', 'test-feature');
    });
  });

  describe('canActivate - 服务异常处理', () => {
    it('当 FeatureToggleService 抛出异常时应传播异常', async () => {
      const options: RequireFeatureOptions = { feature: 'test-feature' };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      featureToggleService.isEnabled.mockRejectedValue(new Error('Service error'));

      await expect(
        TenantContext.run({ tenantId: '123456' }, async () => {
          return guard.canActivate(createMockContext());
        }),
      ).rejects.toThrow('Service error');
    });
  });

  describe('边界条件', () => {
    it('空字符串功能名应正常处理', async () => {
      const options: RequireFeatureOptions = { feature: '' };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      featureToggleService.isEnabled.mockResolvedValue(true);

      const result = await TenantContext.run({ tenantId: '123456' }, async () => {
        return guard.canActivate(createMockContext());
      });

      expect(result).toBe(true);
      expect(featureToggleService.isEnabled).toHaveBeenCalledWith('123456', '');
    });

    it('特殊字符功能名应正常处理', async () => {
      const options: RequireFeatureOptions = { feature: 'feature.with.dots' };
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(options);
      featureToggleService.isEnabled.mockResolvedValue(true);

      const result = await TenantContext.run({ tenantId: '123456' }, async () => {
        return guard.canActivate(createMockContext());
      });

      expect(result).toBe(true);
      expect(featureToggleService.isEnabled).toHaveBeenCalledWith('123456', 'feature.with.dots');
    });
  });
});
