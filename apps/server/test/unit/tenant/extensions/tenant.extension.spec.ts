import { TenantContext } from '@/core/tenancy/context/tenant.context';
import { tenantExtensionHelpers } from '@/core/tenancy/extensions/tenant.extension';
import { SUPER_TENANT_ID } from '@/core/tenancy/constants/tenant-models';

const { shouldApplyFilter, addTenantFilter, setTenantId, setTenantIdForMany, validateTenantOwnership } =
  tenantExtensionHelpers;

describe('TenantExtension', () => {
  describe('shouldApplyFilter', () => {
    it('应该对需要租户隔离的模型返回 true（在租户上下文中）', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        expect(shouldApplyFilter('SysUser')).toBe(true);
        expect(shouldApplyFilter('SysRole')).toBe(true);
        expect(shouldApplyFilter('SysDept')).toBe(true);
      });
    });

    it('应该对不需要租户隔离的模型返回 false', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        expect(shouldApplyFilter('SysTenant')).toBe(false);
        expect(shouldApplyFilter('UnknownModel')).toBe(false);
      });
    });

    it('应该在超级租户时返回 false', () => {
      TenantContext.run({ tenantId: SUPER_TENANT_ID }, () => {
        expect(shouldApplyFilter('SysUser')).toBe(false);
      });
    });

    it('应该在 ignoreTenant 为 true 时返回 false', () => {
      TenantContext.run({ tenantId: '100001', ignoreTenant: true }, () => {
        expect(shouldApplyFilter('SysUser')).toBe(false);
      });
    });

    it('应该在没有租户上下文时返回 false', () => {
      expect(shouldApplyFilter('SysUser')).toBe(false);
    });
  });

  describe('addTenantFilter', () => {
    it('应该添加租户ID到空的 where 条件', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const result = addTenantFilter(undefined);
        expect(result).toEqual({ tenantId: '100001' });
      });
    });

    it('应该添加租户ID到已有的 where 条件', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const result = addTenantFilter({ status: '0' });
        expect(result).toEqual({ status: '0', tenantId: '100001' });
      });
    });

    it('应该正确处理 AND 条件', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const result = addTenantFilter({ AND: [{ status: '0' }] });
        expect(result).toEqual({
          AND: [{ status: '0' }, { tenantId: '100001' }],
        });
      });
    });

    it('应该正确处理 OR 条件', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const result = addTenantFilter({ OR: [{ status: '0' }, { status: '1' }] });
        expect(result).toEqual({
          AND: [{ tenantId: '100001' }, { OR: [{ status: '0' }, { status: '1' }] }],
        });
      });
    });

    it('应该在没有租户ID时返回原始 where 条件', () => {
      const result = addTenantFilter({ status: '0' });
      expect(result).toEqual({ status: '0' });
    });
  });

  describe('setTenantId', () => {
    it('应该设置租户ID到数据中', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const result = setTenantId({ userName: 'test' });
        expect(result).toEqual({ userName: 'test', tenantId: '100001' });
      });
    });

    it('应该不覆盖已有的租户ID', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const result = setTenantId({ userName: 'test', tenantId: '100002' });
        expect(result).toEqual({ userName: 'test', tenantId: '100002' });
      });
    });

    it('应该在没有租户上下文时使用超级租户ID', () => {
      const result = setTenantId({ userName: 'test' });
      expect(result).toEqual({ userName: 'test', tenantId: SUPER_TENANT_ID });
    });
  });

  describe('setTenantIdForMany', () => {
    it('应该为数组中的每条记录设置租户ID', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const result = setTenantIdForMany([{ userName: 'test1' }, { userName: 'test2' }]);
        expect(result).toEqual([
          { userName: 'test1', tenantId: '100001' },
          { userName: 'test2', tenantId: '100001' },
        ]);
      });
    });

    it('应该不覆盖数组中已有的租户ID', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const result = setTenantIdForMany([{ userName: 'test1' }, { userName: 'test2', tenantId: '100002' }]);
        expect(result).toEqual([
          { userName: 'test1', tenantId: '100001' },
          { userName: 'test2', tenantId: '100002' },
        ]);
      });
    });

    it('应该处理单个对象（非数组）', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const result = setTenantIdForMany({ userName: 'test' });
        expect(result).toEqual({ userName: 'test', tenantId: '100001' });
      });
    });
  });

  describe('validateTenantOwnership', () => {
    it('应该返回属于当前租户的记录', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const record = { userId: 1, userName: 'test', tenantId: '100001' };
        const result = validateTenantOwnership('SysUser', record);
        expect(result).toEqual(record);
      });
    });

    it('应该对不属于当前租户的记录返回 null', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const record = { userId: 1, userName: 'test', tenantId: '100002' };
        const result = validateTenantOwnership('SysUser', record);
        expect(result).toBeNull();
      });
    });

    it('应该对 null 结果返回 null', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const result = validateTenantOwnership('SysUser', null);
        expect(result).toBeNull();
      });
    });

    it('应该对不需要租户隔离的模型返回原始记录', () => {
      TenantContext.run({ tenantId: '100001' }, () => {
        const record = { tenantId: 1, companyName: 'test', tenantId: '100002' };
        const result = validateTenantOwnership('SysTenant', record);
        expect(result).toEqual(record);
      });
    });

    it('应该在超级租户时返回任何租户的记录', () => {
      TenantContext.run({ tenantId: SUPER_TENANT_ID }, () => {
        const record = { userId: 1, userName: 'test', tenantId: '100002' };
        const result = validateTenantOwnership('SysUser', record);
        expect(result).toEqual(record);
      });
    });

    it('应该在 ignoreTenant 为 true 时返回任何租户的记录', () => {
      TenantContext.run({ tenantId: '100001', ignoreTenant: true }, () => {
        const record = { userId: 1, userName: 'test', tenantId: '100002' };
        const result = validateTenantOwnership('SysUser', record);
        expect(result).toEqual(record);
      });
    });

    it('应该在没有租户上下文时返回原始记录', () => {
      const record = { userId: 1, userName: 'test', tenantId: '100002' };
      const result = validateTenantOwnership('SysUser', record);
      expect(result).toEqual(record);
    });
  });
});
