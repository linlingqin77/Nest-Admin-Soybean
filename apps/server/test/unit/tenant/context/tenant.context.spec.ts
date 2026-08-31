import { TenantContext, TenantContextData } from '@/core/tenancy/context/tenant.context';

describe('TenantContext', () => {
  describe('run', () => {
    it('应该在上下文中执行回调', () => {
      const result = TenantContext.run({ tenantId: '123456' }, () => {
        return TenantContext.getTenantId();
      });

      expect(result).toBe('123456');
    });

    it('应该自动生成 requestId', () => {
      TenantContext.run({ tenantId: '123456' }, () => {
        const requestId = TenantContext.getRequestId();
        expect(requestId).toBeDefined();
        expect(typeof requestId).toBe('string');
      });
    });

    it('应该使用提供的 requestId', () => {
      const customRequestId = 'custom-request-id';
      TenantContext.run({ tenantId: '123456', requestId: customRequestId }, () => {
        expect(TenantContext.getRequestId()).toBe(customRequestId);
      });
    });

    it('应该支持嵌套上下文', () => {
      TenantContext.run({ tenantId: '111111' }, () => {
        expect(TenantContext.getTenantId()).toBe('111111');

        TenantContext.run({ tenantId: '222222' }, () => {
          expect(TenantContext.getTenantId()).toBe('222222');
        });

        expect(TenantContext.getTenantId()).toBe('111111');
      });
    });
  });

  describe('runWithTenant', () => {
    it('应该临时切换租户', () => {
      TenantContext.run({ tenantId: '111111' }, () => {
        expect(TenantContext.getTenantId()).toBe('111111');

        TenantContext.runWithTenant('222222', () => {
          expect(TenantContext.getTenantId()).toBe('222222');
        });

        expect(TenantContext.getTenantId()).toBe('111111');
      });
    });

    it('应该支持忽略租户选项', () => {
      TenantContext.run({ tenantId: '111111' }, () => {
        TenantContext.runWithTenant(
          '222222',
          () => {
            expect(TenantContext.isIgnoreTenant()).toBe(true);
          },
          { ignoreTenant: true },
        );
      });
    });

    it('应该保留原始 requestId', () => {
      const originalRequestId = 'original-request-id';
      TenantContext.run({ tenantId: '111111', requestId: originalRequestId }, () => {
        TenantContext.runWithTenant('222222', () => {
          expect(TenantContext.getRequestId()).toBe(originalRequestId);
        });
      });
    });
  });

  describe('runIgnoringTenant', () => {
    it('应该设置忽略租户标志', () => {
      TenantContext.run({ tenantId: '123456' }, () => {
        TenantContext.runIgnoringTenant(() => {
          expect(TenantContext.isIgnoreTenant()).toBe(true);
        });
      });
    });

    it('应该保留原始租户ID', () => {
      TenantContext.run({ tenantId: '123456' }, () => {
        TenantContext.runIgnoringTenant(() => {
          expect(TenantContext.getTenantId()).toBe('123456');
        });
      });
    });

    it('应该在没有上下文时使用超级租户ID', () => {
      // 在没有上下文的情况下调用
      const result = TenantContext.runIgnoringTenant(() => {
        return TenantContext.getTenantId();
      });
      expect(result).toBe(TenantContext.SUPER_TENANT_ID);
    });
  });

  describe('getTenantId', () => {
    it('应该返回当前租户ID', () => {
      TenantContext.run({ tenantId: '123456' }, () => {
        expect(TenantContext.getTenantId()).toBe('123456');
      });
    });

    it('应该在没有上下文时返回 undefined', () => {
      expect(TenantContext.getTenantId()).toBeUndefined();
    });
  });

  describe('setTenantId', () => {
    it('应该更新租户ID', () => {
      TenantContext.run({ tenantId: '111111' }, () => {
        TenantContext.setTenantId('222222');
        expect(TenantContext.getTenantId()).toBe('222222');
      });
    });

    it('应该在没有上下文时不做任何操作', () => {
      // 不应该抛出错误
      expect(() => TenantContext.setTenantId('123456')).not.toThrow();
    });
  });

  describe('isIgnoreTenant', () => {
    it('应该返回 false 当未设置忽略时', () => {
      TenantContext.run({ tenantId: '123456' }, () => {
        expect(TenantContext.isIgnoreTenant()).toBe(false);
      });
    });

    it('应该返回 true 当设置忽略时', () => {
      TenantContext.run({ tenantId: '123456', ignoreTenant: true }, () => {
        expect(TenantContext.isIgnoreTenant()).toBe(true);
      });
    });

    it('应该在没有上下文时返回 false', () => {
      expect(TenantContext.isIgnoreTenant()).toBe(false);
    });
  });

  describe('setIgnoreTenant', () => {
    it('应该设置忽略租户标志', () => {
      TenantContext.run({ tenantId: '123456' }, () => {
        expect(TenantContext.isIgnoreTenant()).toBe(false);
        TenantContext.setIgnoreTenant(true);
        expect(TenantContext.isIgnoreTenant()).toBe(true);
      });
    });

    it('应该在没有上下文时不做任何操作', () => {
      expect(() => TenantContext.setIgnoreTenant(true)).not.toThrow();
    });
  });

  describe('getStore', () => {
    it('应该返回完整的上下文数据', () => {
      TenantContext.run({ tenantId: '123456', ignoreTenant: true, requestId: 'test-id' }, () => {
        const store = TenantContext.getStore();
        expect(store?.tenantId).toBe('123456');
        expect(store?.ignoreTenant).toBe(true);
        expect(store?.requestId).toBe('test-id');
      });
    });

    it('应该在没有上下文时返回 undefined', () => {
      expect(TenantContext.getStore()).toBeUndefined();
    });
  });

  describe('isSuperTenant', () => {
    it('应该返回 true 当是超级租户时', () => {
      TenantContext.run({ tenantId: TenantContext.SUPER_TENANT_ID }, () => {
        expect(TenantContext.isSuperTenant()).toBe(true);
      });
    });

    it('应该返回 false 当是普通租户时', () => {
      TenantContext.run({ tenantId: '123456' }, () => {
        expect(TenantContext.isSuperTenant()).toBe(false);
      });
    });

    it('应该返回 false 当没有上下文时', () => {
      expect(TenantContext.isSuperTenant()).toBe(false);
    });
  });

  describe('hasContext', () => {
    it('应该返回 true 当有上下文时', () => {
      TenantContext.run({ tenantId: '123456' }, () => {
        expect(TenantContext.hasContext()).toBe(true);
      });
    });

    it('应该返回 false 当没有上下文时', () => {
      expect(TenantContext.hasContext()).toBe(false);
    });
  });

  describe('shouldApplyTenantFilter', () => {
    it('应该返回 false 当没有上下文时', () => {
      expect(TenantContext.shouldApplyTenantFilter()).toBe(false);
    });

    it('应该返回 false 当设置忽略租户时', () => {
      TenantContext.run({ tenantId: '123456', ignoreTenant: true }, () => {
        expect(TenantContext.shouldApplyTenantFilter()).toBe(false);
      });
    });

    it('应该返回 false 当是超级租户时', () => {
      TenantContext.run({ tenantId: TenantContext.SUPER_TENANT_ID }, () => {
        expect(TenantContext.shouldApplyTenantFilter()).toBe(false);
      });
    });

    it('应该返回 true 当是普通租户且未忽略时', () => {
      TenantContext.run({ tenantId: '123456' }, () => {
        expect(TenantContext.shouldApplyTenantFilter()).toBe(true);
      });
    });
  });

  describe('SUPER_TENANT_ID', () => {
    it('应该是 000000', () => {
      expect(TenantContext.SUPER_TENANT_ID).toBe('000000');
    });
  });
});
