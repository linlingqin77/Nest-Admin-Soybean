import * as fc from 'fast-check';
import { TenantContext } from '@/core/tenancy/context/tenant.context';
import { tenantExtensionHelpers } from '@/core/tenancy/extensions/tenant.extension';
import { SUPER_TENANT_ID, TENANT_MODELS } from '@/core/tenancy/constants/tenant-models';

const { shouldApplyFilter, addTenantFilter, setTenantId, setTenantIdForMany, validateTenantOwnership } =
  tenantExtensionHelpers;

// 属性测试配置
const PBT_CONFIG = { numRuns: 100 };

// 生成有效的租户ID（6位数字字符串，>= 100001）
const validTenantIdArb = fc.integer({ min: 100001, max: 999999 }).map((n) => n.toString().padStart(6, '0'));

// 生成需要租户隔离的模型名称
const tenantModelArb = fc.constantFrom(...Array.from(TENANT_MODELS));

// 生成不需要租户隔离的模型名称
const nonTenantModelArb = fc.constantFrom('SysTenant', 'SysTenantPackage', 'UnknownModel');

// 生成简单的 where 条件
const simpleWhereArb = fc.record({
  status: fc.constantFrom('0', '1'),
  delFlag: fc.constantFrom('0', '1'),
});

describe('TenantExtension - Property Tests', () => {
  describe('Property 2: 租户数据隔离', () => {
    /**
     * **Validates: Requirements 3.2, 4.4**
     * 对于任意需要租户隔离的模型，在非超级租户且未设置 ignoreTenant 的情况下，
     * addTenantFilter 应该添加当前租户ID到 where 条件
     */
    it('addTenantFilter 应该为租户隔离模型添加租户过滤条件', () => {
      fc.assert(
        fc.property(validTenantIdArb, simpleWhereArb, (tenantId, where) => {
          return TenantContext.run({ tenantId }, () => {
            const result = addTenantFilter(where);
            // 结果应该包含租户ID
            return result.tenantId === tenantId;
          });
        }),
        PBT_CONFIG,
      );
    });

    /**
     * **Validates: Requirements 3.2**
     * shouldApplyFilter 对于租户隔离模型在正常租户上下文中应该返回 true
     */
    it('shouldApplyFilter 对租户隔离模型应该返回 true', () => {
      fc.assert(
        fc.property(validTenantIdArb, tenantModelArb, (tenantId, model) => {
          return TenantContext.run({ tenantId }, () => {
            return shouldApplyFilter(model) === true;
          });
        }),
        PBT_CONFIG,
      );
    });

    /**
     * **Validates: Requirements 3.2**
     * shouldApplyFilter 对于非租户隔离模型应该返回 false
     */
    it('shouldApplyFilter 对非租户隔离模型应该返回 false', () => {
      fc.assert(
        fc.property(validTenantIdArb, nonTenantModelArb, (tenantId, model) => {
          return TenantContext.run({ tenantId }, () => {
            return shouldApplyFilter(model) === false;
          });
        }),
        PBT_CONFIG,
      );
    });
  });

  describe('Property 3: 跳过租户过滤', () => {
    /**
     * **Validates: Requirements 4.2, 4.3**
     * 当设置 ignoreTenant 为 true 时，shouldApplyFilter 应该返回 false
     */
    it('ignoreTenant 为 true 时应该跳过租户过滤', () => {
      fc.assert(
        fc.property(validTenantIdArb, tenantModelArb, (tenantId, model) => {
          return TenantContext.run({ tenantId, ignoreTenant: true }, () => {
            return shouldApplyFilter(model) === false;
          });
        }),
        PBT_CONFIG,
      );
    });

    /**
     * **Validates: Requirements 4.3**
     * 超级租户应该跳过租户过滤
     */
    it('超级租户应该跳过租户过滤', () => {
      fc.assert(
        fc.property(tenantModelArb, (model) => {
          return TenantContext.run({ tenantId: SUPER_TENANT_ID }, () => {
            return shouldApplyFilter(model) === false;
          });
        }),
        PBT_CONFIG,
      );
    });
  });

  describe('Property 6: 创建记录自动设置租户ID', () => {
    /**
     * **Validates: Requirements 3.3**
     * 对于任意创建的记录，如果没有指定租户ID，应该自动设置为当前上下文的租户ID
     */
    it('setTenantId 应该自动设置当前租户ID', () => {
      fc.assert(
        fc.property(
          validTenantIdArb,
          fc.record({ userName: fc.string({ minLength: 1, maxLength: 20 }) }),
          (tenantId, data) => {
            return TenantContext.run({ tenantId }, () => {
              const result = setTenantId(data);
              return result.tenantId === tenantId;
            });
          },
        ),
        PBT_CONFIG,
      );
    });

    /**
     * **Validates: Requirements 3.3**
     * 如果记录已有租户ID，不应该被覆盖
     */
    it('setTenantId 不应该覆盖已有的租户ID', () => {
      fc.assert(
        fc.property(
          validTenantIdArb,
          validTenantIdArb,
          fc.record({ userName: fc.string({ minLength: 1, maxLength: 20 }) }),
          (contextTenantId, dataTenantId, data) => {
            return TenantContext.run({ tenantId: contextTenantId }, () => {
              const dataWithTenant = { ...data, tenantId: dataTenantId };
              const result = setTenantId(dataWithTenant);
              return result.tenantId === dataTenantId;
            });
          },
        ),
        PBT_CONFIG,
      );
    });

    /**
     * **Validates: Requirements 3.3**
     * 批量创建时，每条记录都应该设置租户ID
     */
    it('setTenantIdForMany 应该为每条记录设置租户ID', () => {
      fc.assert(
        fc.property(
          validTenantIdArb,
          fc.array(fc.record({ userName: fc.string({ minLength: 1, maxLength: 20 }) }), {
            minLength: 1,
            maxLength: 10,
          }),
          (tenantId, dataArray) => {
            return TenantContext.run({ tenantId }, () => {
              const result = setTenantIdForMany(dataArray) as any[];
              return result.every((item) => item.tenantId === tenantId);
            });
          },
        ),
        PBT_CONFIG,
      );
    });
  });

  describe('Property 7: findUnique 租户归属验证', () => {
    /**
     * **Validates: Requirements 4.5**
     * 对于 findUnique 返回的结果，如果租户ID与当前上下文不匹配，应该返回 null
     */
    it('validateTenantOwnership 应该阻止跨租户访问', () => {
      fc.assert(
        fc.property(
          validTenantIdArb,
          validTenantIdArb.filter((id) => id !== SUPER_TENANT_ID),
          tenantModelArb,
          fc.integer({ min: 1, max: 10000 }),
          (contextTenantId, recordTenantId, model, userId) => {
            // 确保两个租户ID不同
            if (contextTenantId === recordTenantId) {
              return true; // 跳过相同租户ID的情况
            }

            return TenantContext.run({ tenantId: contextTenantId }, () => {
              const record = { userId, userName: 'test', tenantId: recordTenantId };
              const result = validateTenantOwnership(model, record);
              return result === null;
            });
          },
        ),
        PBT_CONFIG,
      );
    });

    /**
     * **Validates: Requirements 4.5**
     * 对于属于当前租户的记录，应该正常返回
     */
    it('validateTenantOwnership 应该允许访问当前租户的记录', () => {
      fc.assert(
        fc.property(validTenantIdArb, tenantModelArb, fc.integer({ min: 1, max: 10000 }), (tenantId, model, userId) => {
          return TenantContext.run({ tenantId }, () => {
            const record = { userId, userName: 'test', tenantId };
            const result = validateTenantOwnership(model, record);
            return result !== null && result.tenantId === tenantId;
          });
        }),
        PBT_CONFIG,
      );
    });

    /**
     * **Validates: Requirements 4.2, 4.3**
     * 超级租户或 ignoreTenant 时应该允许访问任何租户的记录
     */
    it('validateTenantOwnership 在超级租户时应该允许跨租户访问', () => {
      fc.assert(
        fc.property(
          validTenantIdArb,
          tenantModelArb,
          fc.integer({ min: 1, max: 10000 }),
          (recordTenantId, model, userId) => {
            return TenantContext.run({ tenantId: SUPER_TENANT_ID }, () => {
              const record = { userId, userName: 'test', tenantId: recordTenantId };
              const result = validateTenantOwnership(model, record);
              return result !== null;
            });
          },
        ),
        PBT_CONFIG,
      );
    });

    it('validateTenantOwnership 在 ignoreTenant 时应该允许跨租户访问', () => {
      fc.assert(
        fc.property(
          validTenantIdArb,
          validTenantIdArb,
          tenantModelArb,
          fc.integer({ min: 1, max: 10000 }),
          (contextTenantId, recordTenantId, model, userId) => {
            return TenantContext.run({ tenantId: contextTenantId, ignoreTenant: true }, () => {
              const record = { userId, userName: 'test', tenantId: recordTenantId };
              const result = validateTenantOwnership(model, record);
              return result !== null;
            });
          },
        ),
        PBT_CONFIG,
      );
    });
  });

  describe('Property: addTenantFilter 幂等性', () => {
    /**
     * 多次调用 addTenantFilter 应该产生相同的结果（幂等性）
     */
    it('addTenantFilter 应该是幂等的', () => {
      fc.assert(
        fc.property(validTenantIdArb, simpleWhereArb, (tenantId, where) => {
          return TenantContext.run({ tenantId }, () => {
            const once = addTenantFilter(where);
            const twice = addTenantFilter(once);
            // 第二次调用不应该再添加租户ID（因为已经存在）
            return JSON.stringify(once) === JSON.stringify(twice);
          });
        }),
        PBT_CONFIG,
      );
    });
  });
});
