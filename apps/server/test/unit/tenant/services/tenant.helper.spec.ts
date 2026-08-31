import { Test, TestingModule } from '@nestjs/testing';
import { TenantHelper, SUPER_TENANT_ID, hasTenantField } from '@/core/tenancy/services/tenant.helper';
import { TenantContext } from '@/core/tenancy/context/tenant.context';
import { AppConfigService } from '@/config/app-platform/config.service';

describe('TenantHelper', () => {
  let tenantHelper: TenantHelper;
  let mockConfigService: jest.Mocked<AppConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      tenant: {
        enabled: true,
      },
    } as any;

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        TenantHelper,
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    tenantHelper = modules.get<TenantHelper>(TenantHelper);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isEnabled', () => {
    it('应该返回 true 当租户功能启用时', () => {
      expect(tenantHelper.isEnabled()).toBe(true);
    });

    it('应该返回 false 当租户功能禁用时', async () => {
      const disabledConfigService = {
        tenant: {
          enabled: false,
        },
      } as any;

      const modules: TestingModule = await Test.createTestingModule({
        providers: [
          TenantHelper,
          {
            provide: AppConfigService,
            useValue: disabledConfigService,
          },
        ],
      }).compile();

      const disabledHelper = modules.get<TenantHelper>(TenantHelper);
      expect(disabledHelper.isEnabled()).toBe(false);
    });
  });

  describe('shouldFilter', () => {
    it('应该返回 false 当租户功能禁用时', async () => {
      const disabledConfigService = {
        tenant: {
          enabled: false,
        },
      } as any;

      const modules: TestingModule = await Test.createTestingModule({
        providers: [
          TenantHelper,
          {
            provide: AppConfigService,
            useValue: disabledConfigService,
          },
        ],
      }).compile();

      const disabledHelper = modules.get<TenantHelper>(TenantHelper);
      expect(disabledHelper.shouldFilter()).toBe(false);
    });

    it('应该返回 false 当设置忽略租户时', () => {
      TenantContext.run({ tenantId: '123456', ignoreTenant: true }, () => {
        expect(tenantHelper.shouldFilter()).toBe(false);
      });
    });

    it('应该返回 false 当是超级租户时', () => {
      TenantContext.run({ tenantId: SUPER_TENANT_ID }, () => {
        expect(tenantHelper.shouldFilter()).toBe(false);
      });
    });

    it('应该返回 false 当没有租户ID时', () => {
      // 没有上下文时
      expect(tenantHelper.shouldFilter()).toBe(false);
    });

    it('应该返回 true 当有普通租户ID时', () => {
      TenantContext.run({ tenantId: '123456' }, () => {
        expect(tenantHelper.shouldFilter()).toBe(true);
      });
    });
  });

  describe('getTenantId', () => {
    it('应该返回当前租户ID', () => {
      TenantContext.run({ tenantId: '123456' }, () => {
        expect(tenantHelper.getTenantId()).toBe('123456');
      });
    });

    it('应该返回超级租户ID当没有上下文时', () => {
      expect(tenantHelper.getTenantId()).toBe(SUPER_TENANT_ID);
    });
  });

  describe('isSuperTenant', () => {
    it('应该返回 true 当是超级租户时', () => {
      TenantContext.run({ tenantId: SUPER_TENANT_ID }, () => {
        expect(tenantHelper.isSuperTenant()).toBe(true);
      });
    });

    it('应该返回 false 当是普通租户时', () => {
      TenantContext.run({ tenantId: '123456' }, () => {
        expect(tenantHelper.isSuperTenant()).toBe(false);
      });
    });
  });

  describe('静态方法', () => {
    describe('SUPER_TENANT_ID', () => {
      it('应该返回超级租户ID', () => {
        expect(TenantHelper.SUPER_TENANT_ID).toBe(SUPER_TENANT_ID);
      });
    });

    describe('hasTenantField', () => {
      it('应该正确判断模型是否有租户字段', () => {
        // 这个测试依赖于 hasTenantField 函数的实现
        expect(TenantHelper.hasTenantField('SysUser')).toBeDefined();
      });
    });
  });
});

describe('hasTenantField', () => {
  it('应该为有租户字段的模型返回 true', () => {
    // 常见的有租户字段的模型
    expect(hasTenantField('SysUser')).toBe(true);
    expect(hasTenantField('SysRole')).toBe(true);
    expect(hasTenantField('SysDept')).toBe(true);
  });

  it('应该为没有租户字段的模型返回 false', () => {
    // 系统级别的模型通常没有租户字段
    expect(hasTenantField('SysTenant')).toBe(false);
    expect(hasTenantField('SysTenantPackage')).toBe(false);
  });
});

describe('SUPER_TENANT_ID', () => {
  it('应该是 000000', () => {
    expect(SUPER_TENANT_ID).toBe('000000');
  });
});
