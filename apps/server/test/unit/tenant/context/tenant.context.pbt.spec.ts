import * as fc from 'fast-check';
import { TenantContext } from '@/core/tenancy/context/tenant.context';

// 属性测试配置
const PBT_CONFIG = { numRuns: 100 };

// 生成有效的租户ID（6位数字字符串，>= 100001）
const validTenantIdArb = fc.integer({ min: 100001, max: 999999 }).map((n) => n.toString().padStart(6, '0'));

// 生成非超级租户ID
const nonSuperTenantIdArb = validTenantIdArb.filter((id) => id !== TenantContext.SUPER_TENANT_ID);

// 生成租户上下文数据
const tenantContextDataArb = fc.record({
  tenantId: validTenantIdArb,
  ignoreTenant: fc.boolean(),
  requestId: fc.uuid(),
});

describe('TenantContext - Property Tests', () => {
  describe('Property 1: 租户上下文切换往返一致性', () => {
    /**
     * **Validates: Requirements 1.3, 1.5, 1.6, 9.1, 9.4**
     * 对于任意有效的租户ID，在 runWithTenant 内部调用 getTenantId() 应该返回该租户ID
     */
    it('runWithTenant 内部应该返回正确的租户ID', () => {
      fc.assert(
        fc.property(validTenantIdArb, validTenantIdArb, (originalTenantId, newTenantId) => {
          return TenantContext.run({ tenantId: originalTenantId }, () => {
            let innerTenantId: string | undefined;
            TenantContext.runWithTenant(newTenantId, () => {
              innerTenantId = TenantContext.getTenantId();
            });
            return innerTenantId === newTenantId;
          });
        }),
        PBT_CONFIG,
      );
    });

    /**
     * **Validates: Requirements 1.5, 1.6**
     * runWithTenant 执行完成后，原上下文应该恢复
     */
    it('runWithTenant 执行后应该恢复原上下文', () => {
      fc.assert(
        fc.property(validTenantIdArb, validTenantIdArb, (originalTenantId, newTenantId) => {
          return TenantContext.run({ tenantId: originalTenantId }, () => {
            TenantContext.runWithTenant(newTenantId, () => {
              // 在新上下文中执行一些操作
            });
            // 验证原上下文已恢复
            return TenantContext.getTenantId() === originalTenantId;
          });
        }),
        PBT_CONFIG,
      );
    });

    /**
     * **Validates: Requirements 1.3**
     * run 方法应该正确设置租户上下文
     */
    it('run 方法应该正确设置租户上下文', () => {
      fc.assert(
        fc.property(tenantContextDataArb, (contextData) => {
          return TenantContext.run(contextData, () => {
            const tenantId = TenantContext.getTenantId();
            const ignoreTenant = TenantContext.isIgnoreTenant();
            return tenantId === contextData.tenantId && ignoreTenant === (contextData.ignoreTenant ?? false);
          });
        }),
        PBT_CONFIG,
      );
    });
  });

  describe('Property: 嵌套上下文隔离', () => {
    /**
     * 嵌套的 run 调用应该正确隔离上下文
     */
    it('嵌套 run 调用应该正确隔离上下文', () => {
      fc.assert(
        fc.property(validTenantIdArb, validTenantIdArb, validTenantIdArb, (tenant1, tenant2, tenant3) => {
          return TenantContext.run({ tenantId: tenant1 }, () => {
            const level1 = TenantContext.getTenantId();

            TenantContext.run({ tenantId: tenant2 }, () => {
              const level2 = TenantContext.getTenantId();

              TenantContext.run({ tenantId: tenant3 }, () => {
                const level3 = TenantContext.getTenantId();
                if (level3 !== tenant3) return false;
              });

              if (TenantContext.getTenantId() !== tenant2) return false;
            });

            return TenantContext.getTenantId() === tenant1;
          });
        }),
        PBT_CONFIG,
      );
    });
  });

  describe('Property: runIgnoringTenant 行为', () => {
    /**
     * runIgnoringTenant 应该设置 ignoreTenant 为 true
     */
    it('runIgnoringTenant 应该设置 ignoreTenant 为 true', () => {
      fc.assert(
        fc.property(validTenantIdArb, (tenantId) => {
          return TenantContext.run({ tenantId }, () => {
            return TenantContext.runIgnoringTenant(() => {
              return TenantContext.isIgnoreTenant() === true;
            });
          });
        }),
        PBT_CONFIG,
      );
    });

    /**
     * runIgnoringTenant 应该保留原始租户ID
     */
    it('runIgnoringTenant 应该保留原始租户ID', () => {
      fc.assert(
        fc.property(validTenantIdArb, (tenantId) => {
          return TenantContext.run({ tenantId }, () => {
            return TenantContext.runIgnoringTenant(() => {
              return TenantContext.getTenantId() === tenantId;
            });
          });
        }),
        PBT_CONFIG,
      );
    });
  });

  describe('Property: shouldApplyTenantFilter 逻辑', () => {
    /**
     * 普通租户且未忽略时应该应用过滤
     */
    it('普通租户且未忽略时 shouldApplyTenantFilter 应该返回 true', () => {
      fc.assert(
        fc.property(nonSuperTenantIdArb, (tenantId) => {
          return TenantContext.run({ tenantId, ignoreTenant: false }, () => {
            return TenantContext.shouldApplyTenantFilter() === true;
          });
        }),
        PBT_CONFIG,
      );
    });

    /**
     * 设置 ignoreTenant 时不应该应用过滤
     */
    it('设置 ignoreTenant 时 shouldApplyTenantFilter 应该返回 false', () => {
      fc.assert(
        fc.property(validTenantIdArb, (tenantId) => {
          return TenantContext.run({ tenantId, ignoreTenant: true }, () => {
            return TenantContext.shouldApplyTenantFilter() === false;
          });
        }),
        PBT_CONFIG,
      );
    });

    /**
     * 超级租户不应该应用过滤
     */
    it('超级租户 shouldApplyTenantFilter 应该返回 false', () => {
      fc.assert(
        fc.property(fc.boolean(), (ignoreTenant) => {
          return TenantContext.run({ tenantId: TenantContext.SUPER_TENANT_ID, ignoreTenant }, () => {
            return TenantContext.shouldApplyTenantFilter() === false;
          });
        }),
        PBT_CONFIG,
      );
    });
  });

  describe('Property: isSuperTenant 判断', () => {
    /**
     * 只有超级租户ID才应该返回 true
     */
    it('只有超级租户ID isSuperTenant 才返回 true', () => {
      fc.assert(
        fc.property(validTenantIdArb, (tenantId) => {
          return TenantContext.run({ tenantId }, () => {
            const isSuperTenant = TenantContext.isSuperTenant();
            const expectedResult = tenantId === TenantContext.SUPER_TENANT_ID;
            return isSuperTenant === expectedResult;
          });
        }),
        PBT_CONFIG,
      );
    });
  });

  describe('Property: setTenantId 和 setIgnoreTenant 可变性', () => {
    /**
     * setTenantId 应该能够更新租户ID
     */
    it('setTenantId 应该能够更新租户ID', () => {
      fc.assert(
        fc.property(validTenantIdArb, validTenantIdArb, (originalTenantId, newTenantId) => {
          return TenantContext.run({ tenantId: originalTenantId }, () => {
            TenantContext.setTenantId(newTenantId);
            return TenantContext.getTenantId() === newTenantId;
          });
        }),
        PBT_CONFIG,
      );
    });

    /**
     * setIgnoreTenant 应该能够更新忽略标志
     */
    it('setIgnoreTenant 应该能够更新忽略标志', () => {
      fc.assert(
        fc.property(validTenantIdArb, fc.boolean(), fc.boolean(), (tenantId, initial, newValue) => {
          return TenantContext.run({ tenantId, ignoreTenant: initial }, () => {
            TenantContext.setIgnoreTenant(newValue);
            return TenantContext.isIgnoreTenant() === newValue;
          });
        }),
        PBT_CONFIG,
      );
    });
  });

  describe('Property: requestId 保持', () => {
    /**
     * runWithTenant 应该保留原始 requestId
     */
    it('runWithTenant 应该保留原始 requestId', () => {
      fc.assert(
        fc.property(validTenantIdArb, validTenantIdArb, fc.uuid(), (tenant1, tenant2, requestId) => {
          return TenantContext.run({ tenantId: tenant1, requestId }, () => {
            return TenantContext.runWithTenant(tenant2, () => {
              return TenantContext.getRequestId() === requestId;
            });
          });
        }),
        PBT_CONFIG,
      );
    });

    /**
     * runIgnoringTenant 应该保留原始 requestId
     */
    it('runIgnoringTenant 应该保留原始 requestId', () => {
      fc.assert(
        fc.property(validTenantIdArb, fc.uuid(), (tenantId, requestId) => {
          return TenantContext.run({ tenantId, requestId }, () => {
            return TenantContext.runIgnoringTenant(() => {
              return TenantContext.getRequestId() === requestId;
            });
          });
        }),
        PBT_CONFIG,
      );
    });
  });

  describe('Property: hasContext 判断', () => {
    /**
     * 在 run 内部 hasContext 应该返回 true
     */
    it('在 run 内部 hasContext 应该返回 true', () => {
      fc.assert(
        fc.property(tenantContextDataArb, (contextData) => {
          return TenantContext.run(contextData, () => {
            return TenantContext.hasContext() === true;
          });
        }),
        PBT_CONFIG,
      );
    });
  });
});
