import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { TenantContext } from './tenant.context';
import { AppConfigService } from 'src/config/app-config.service';
import { IGNORE_TENANT_KEY } from './tenant.decorator';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;
  let configService: AppConfigService;

  const mockConfigService = {
    tenant: {
      enabled: true,
      superTenantId: '000000',
      defaultTenantId: '000000',
    },
  };

  const createMockContext = (): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<TenantGuard>(TenantGuard);
    reflector = module.get<Reflector>(Reflector);
    configService = module.get<AppConfigService>(AppConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should always return true when tenant is disabled', () => {
      // Temporarily disable tenant
      mockConfigService.tenant.enabled = false;

      const context = createMockContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);

      // Restore
      mockConfigService.tenant.enabled = true;
    });

    it('should return true and not set ignoreTenant when @IgnoreTenant is not set', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      // Run within tenant context
      const result = TenantContext.run({ tenantId: '123456' }, () => {
        return guard.canActivate(createMockContext());
      });

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IGNORE_TENANT_KEY, expect.any(Array));
    });

    it('should return true and set ignoreTenant when @IgnoreTenant is set', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      // Run within tenant context and verify ignoreTenant is set
      const result = TenantContext.run({ tenantId: '123456', ignoreTenant: false }, () => {
        const canActivate = guard.canActivate(createMockContext());
        const isIgnored = TenantContext.isIgnoreTenant();
        return { canActivate, isIgnored };
      });

      expect(result.canActivate).toBe(true);
      expect(result.isIgnored).toBe(true);
    });

    it('should check both handler and class for @IgnoreTenant decorator', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = createMockContext();

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IGNORE_TENANT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });
  });

  describe('tenant context integration', () => {
    it('should work correctly with TenantContext.run', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const testResult = TenantContext.run({ tenantId: '123456', ignoreTenant: false }, () => {
        // Before guard
        expect(TenantContext.isIgnoreTenant()).toBe(false);

        // Execute guard
        guard.canActivate(createMockContext());

        // After guard - should be set to true
        return TenantContext.isIgnoreTenant();
      });

      expect(testResult).toBe(true);
    });

    it('should not modify ignoreTenant when decorator is not present', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const testResult = TenantContext.run({ tenantId: '123456', ignoreTenant: false }, () => {
        guard.canActivate(createMockContext());
        return TenantContext.isIgnoreTenant();
      });

      expect(testResult).toBe(false);
    });
  });
});
