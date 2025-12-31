import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequireFeatureGuard } from './require-feature.guard';
import { FeatureToggleService } from './feature-toggle.service';
import { TenantContext } from './tenant.context';
import { REQUIRE_FEATURE_KEY } from './require-feature.decorator';

describe('RequireFeatureGuard', () => {
  let guard: RequireFeatureGuard;
  let reflector: jest.Mocked<Reflector>;
  let featureToggleService: jest.Mocked<FeatureToggleService>;

  const createMockExecutionContext = (): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const mockFeatureToggleService = {
      isEnabled: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequireFeatureGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: FeatureToggleService,
          useValue: mockFeatureToggleService,
        },
      ],
    }).compile();

    guard = module.get<RequireFeatureGuard>(RequireFeatureGuard);
    reflector = module.get(Reflector);
    featureToggleService = module.get(FeatureToggleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no feature requirement is set', async () => {
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(featureToggleService.isEnabled).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when no tenant context', async () => {
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue({ feature: 'test-feature' });

      // Run without tenant context
      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
      await expect(guard.canActivate(context)).rejects.toThrow('功能 test-feature 需要租户上下文');
    });

    it('should throw ForbiddenException with custom message when no tenant context', async () => {
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue({
        feature: 'test-feature',
        message: '自定义错误消息',
      });

      await expect(guard.canActivate(context)).rejects.toThrow('自定义错误消息');
    });

    it('should allow access when feature is enabled', async () => {
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue({ feature: 'test-feature' });
      featureToggleService.isEnabled.mockResolvedValue(true);

      // Run within tenant context
      const result = await TenantContext.run({ tenantId: 'tenant1' }, async () => {
        return guard.canActivate(context);
      });

      expect(result).toBe(true);
      expect(featureToggleService.isEnabled).toHaveBeenCalledWith('tenant1', 'test-feature');
    });

    it('should throw ForbiddenException when feature is disabled', async () => {
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue({ feature: 'test-feature' });
      featureToggleService.isEnabled.mockResolvedValue(false);

      // Run within tenant context
      await expect(
        TenantContext.run({ tenantId: 'tenant1' }, async () => {
          return guard.canActivate(context);
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException with custom message when feature is disabled', async () => {
      const context = createMockExecutionContext();
      reflector.getAllAndOverride.mockReturnValue({
        feature: 'test-feature',
        message: '此功能需要升级套餐',
      });
      featureToggleService.isEnabled.mockResolvedValue(false);

      // Run within tenant context
      await expect(
        TenantContext.run({ tenantId: 'tenant1' }, async () => {
          return guard.canActivate(context);
        }),
      ).rejects.toThrow('此功能需要升级套餐');
    });

    it('should use reflector to get metadata from handler and class', async () => {
      const context = createMockExecutionContext();
      const handler = jest.fn();
      const classRef = jest.fn();
      (context.getHandler as jest.Mock).mockReturnValue(handler);
      (context.getClass as jest.Mock).mockReturnValue(classRef);
      reflector.getAllAndOverride.mockReturnValue(undefined);

      await guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(REQUIRE_FEATURE_KEY, [
        handler,
        classRef,
      ]);
    });
  });
});
