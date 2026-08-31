import { Prisma } from '@prisma/client';
import { TenantContext } from '@/core/tenancy/context/tenant.context';
import {
  createTenantMiddleware,
  addTenantFilter,
  setTenantId,
  setTenantIdForMany,
  setTenantIdForUpsert,
  validateTenantOwnership,
  hasTenantField,
  TENANT_MODELS,
} from '@/tenant.middleware';

// 辅助函数：在租户上下文中运行测试
const runWithTenant = <T>(tenantId: string, ignoreTenant: boolean, fn: () => T): T => {
  return TenantContext.run({ tenantId, ignoreTenant }, fn);
};

// 类型定义用于测试断言
interface TestQueryArgs {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  create?: Record<string, unknown>;
  update?: Record<string, unknown>;
}

describe('Tenant Middleware', () => {
  describe('hasTenantField', () => {
    it('should return true for tenant models', () => {
      expect(hasTenantField('SysUser')).toBe(true);
      expect(hasTenantField('SysRole')).toBe(true);
      expect(hasTenantField('SysDept')).toBe(true);
      expect(hasTenantField('SysMenu')).toBe(true);
      expect(hasTenantField('SysDictType')).toBe(true);
      expect(hasTenantField('SysDictData')).toBe(true);
    });

    it('should return false for non-tenant models', () => {
      expect(hasTenantField('GenTable')).toBe(false);
      expect(hasTenantField('GenTableColumn')).toBe(false);
      expect(hasTenantField('SysTenant')).toBe(false);
    });

    it('should include all expected tenant models', () => {
      const expectedModels = [
        'SysConfig',
        'SysDept',
        'SysDictData',
        'SysDictType',
        'SysJob',
        'SysLogininfor',
        'SysMenu',
        'SysNotice',
        'SysOperLog',
        'SysPost',
        'SysRole',
        'SysUpload',
        'SysUser',
      ];
      // TENANT_MODELS 现在是 Set，验证包含所有预期模型
      expectedModels.forEach((model) => {
        expect(TENANT_MODELS.has(model)).toBe(true);
      });
    });
  });

  describe('addTenantFilter', () => {
    it('should not modify args for non-tenant models', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = { where: { id: 1 } };
        const result = addTenantFilter('GenTable', args) as TestQueryArgs;
        expect(result.where?.tenantId).toBeUndefined();
      });
    });

    it('should add tenantId to args for tenant models', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = { where: { status: '0' } };
        const result = addTenantFilter('SysUser', args) as TestQueryArgs;
        expect(result.where?.tenantId).toBe('100001');
        expect(result.where?.status).toBe('0');
      });
    });

    it('should not add tenantId when ignoreTenant is set', () => {
      runWithTenant('100001', true, () => {
        const args: TestQueryArgs = { where: { status: '0' } };
        const result = addTenantFilter('SysUser', args) as TestQueryArgs;
        expect(result.where?.tenantId).toBeUndefined();
      });
    });

    it('should not add tenantId for super tenant (000000)', () => {
      runWithTenant('000000', false, () => {
        const args: TestQueryArgs = { where: { status: '0' } };
        const result = addTenantFilter('SysUser', args) as TestQueryArgs;
        expect(result.where?.tenantId).toBeUndefined();
      });
    });

    it('should handle empty args', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = {};
        const result = addTenantFilter('SysUser', args) as TestQueryArgs;
        expect(result.where).toBeDefined();
        expect(result.where?.tenantId).toBe('100001');
      });
    });

    it('should handle null args', () => {
      runWithTenant('100001', false, () => {
        const result = addTenantFilter('SysUser', null as unknown as TestQueryArgs) as TestQueryArgs;
        expect(result.where?.tenantId).toBe('100001');
      });
    });

    it('should handle AND conditions', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = {
          where: {
            AND: [{ status: '0' }, { delFlag: '0' }],
          },
        };
        const result = addTenantFilter('SysUser', args) as TestQueryArgs;
        expect(result.where?.AND).toContainEqual({ tenantId: '100001' });
      });
    });

    it('should handle OR conditions by wrapping with AND', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = {
          where: {
            OR: [{ userName: 'admin' }, { userName: 'test' }],
          },
        };
        const result = addTenantFilter('SysUser', args) as TestQueryArgs;
        const whereAnd = result.where?.AND as unknown[];
        expect(whereAnd).toBeDefined();
        expect(whereAnd[0]).toEqual({ tenantId: '100001' });
        expect(whereAnd[1]).toEqual({
          OR: [{ userName: 'admin' }, { userName: 'test' }],
        });
      });
    });

    it('should not add tenantId when no tenant context', () => {
      const args: TestQueryArgs = { where: { status: '0' } };
      const result = addTenantFilter('SysUser', args) as TestQueryArgs;
      expect(result.where?.tenantId).toBeUndefined();
    });
  });

  describe('setTenantId', () => {
    it('should set tenantId when creating data', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = { data: { userName: 'test', nickName: 'Test' } };
        const result = setTenantId('SysUser', args) as TestQueryArgs;
        expect((result.data as Record<string, unknown>)?.tenantId).toBe('100001');
      });
    });

    it('should not override existing tenantId', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = { data: { userName: 'test', tenantId: '100002' } };
        const result = setTenantId('SysUser', args) as TestQueryArgs;
        expect((result.data as Record<string, unknown>)?.tenantId).toBe('100002');
      });
    });

    it('should not set tenantId for non-tenant models', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = { data: { tableName: 'test' } };
        const result = setTenantId('GenTable', args) as TestQueryArgs;
        expect((result.data as Record<string, unknown>)?.tenantId).toBeUndefined();
      });
    });

    it('should handle empty args', () => {
      runWithTenant('100001', false, () => {
        const result = setTenantId('SysUser', {} as TestQueryArgs) as TestQueryArgs;
        expect((result.data as Record<string, unknown>)?.tenantId).toBe('100001');
      });
    });
  });

  describe('setTenantIdForMany', () => {
    it('should set tenantId for all items in batch create', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = {
          data: [
            { userName: 'user1', nickName: 'User 1' },
            { userName: 'user2', nickName: 'User 2' },
          ],
        };
        const result = setTenantIdForMany('SysUser', args) as TestQueryArgs;
        const dataArray = result.data as Record<string, unknown>[];
        expect(dataArray[0].tenantId).toBe('100001');
        expect(dataArray[1].tenantId).toBe('100001');
      });
    });

    it('should not override existing tenantId in batch create', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = {
          data: [{ userName: 'user1', tenantId: '100002' }, { userName: 'user2' }],
        };
        const result = setTenantIdForMany('SysUser', args) as TestQueryArgs;
        const dataArray = result.data as Record<string, unknown>[];
        expect(dataArray[0].tenantId).toBe('100002');
        expect(dataArray[1].tenantId).toBe('100001');
      });
    });

    it('should not modify non-tenant models', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = {
          data: [{ tableName: 'table1' }, { tableName: 'table2' }],
        };
        const result = setTenantIdForMany('GenTable', args) as TestQueryArgs;
        const dataArray = result.data as Record<string, unknown>[];
        expect(dataArray[0].tenantId).toBeUndefined();
        expect(dataArray[1].tenantId).toBeUndefined();
      });
    });
  });

  describe('setTenantIdForUpsert', () => {
    it('should set tenantId in create data for upsert', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = {
          where: { id: 1 },
          create: { userName: 'test', nickName: 'Test' },
          update: { nickName: 'Updated' },
        };
        const result = setTenantIdForUpsert('SysUser', args) as TestQueryArgs;
        expect(result.create?.tenantId).toBe('100001');
        expect(result.where?.tenantId).toBe('100001');
      });
    });

    it('should not override existing tenantId in upsert create', () => {
      runWithTenant('100001', false, () => {
        const args: TestQueryArgs = {
          where: { id: 1 },
          create: { userName: 'test', tenantId: '100002' },
          update: { nickName: 'Updated' },
        };
        const result = setTenantIdForUpsert('SysUser', args) as TestQueryArgs;
        expect(result.create?.tenantId).toBe('100002');
      });
    });
  });

  describe('validateTenantOwnership', () => {
    it('should return result if tenant matches', () => {
      runWithTenant('100001', false, () => {
        const result = { id: 1, userName: 'test', tenantId: '100001' };
        const validated = validateTenantOwnership('SysUser', result);
        expect(validated).toEqual(result);
      });
    });

    it('should return null if tenant does not match', () => {
      runWithTenant('100001', false, () => {
        const result = { id: 1, userName: 'test', tenantId: '100002' };
        const validated = validateTenantOwnership('SysUser', result);
        expect(validated).toBeNull();
      });
    });

    it('should return result for super tenant', () => {
      runWithTenant('000000', false, () => {
        const result = { id: 1, userName: 'test', tenantId: '100002' };
        const validated = validateTenantOwnership('SysUser', result);
        expect(validated).toEqual(result);
      });
    });

    it('should return result when ignoreTenant is set', () => {
      runWithTenant('100001', true, () => {
        const result = { id: 1, userName: 'test', tenantId: '100002' };
        const validated = validateTenantOwnership('SysUser', result);
        expect(validated).toEqual(result);
      });
    });

    it('should return null result as-is', () => {
      runWithTenant('100001', false, () => {
        const validated = validateTenantOwnership('SysUser', null);
        expect(validated).toBeNull();
      });
    });

    it('should return result for non-tenant models', () => {
      runWithTenant('100001', false, () => {
        const result = { id: 1, tableName: 'test' };
        const validated = validateTenantOwnership('GenTable', result);
        expect(validated).toEqual(result);
      });
    });
  });

  describe('createTenantMiddleware', () => {
    let middleware: Prisma.Middleware;
    let nextFn: jest.Mock;

    beforeEach(() => {
      middleware = createTenantMiddleware();
      nextFn = jest.fn().mockResolvedValue({ id: 1 });
    });

    it('should add tenant filter for findMany', async () => {
      await runWithTenant('100001', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'findMany',
          args: { where: { status: '0' } },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);

        expect(nextFn).toHaveBeenCalled();
        expect(params.args.where.tenantId).toBe('100001');
      });
    });

    it('should add tenant filter for findFirst', async () => {
      await runWithTenant('100001', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'findFirst',
          args: { where: { userName: 'admin' } },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);

        expect(params.args.where.tenantId).toBe('100001');
      });
    });

    it('should add tenant filter for count', async () => {
      await runWithTenant('100001', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'count',
          args: { where: {} },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);

        expect(params.args.where.tenantId).toBe('100001');
      });
    });

    it('should add tenant filter for update', async () => {
      await runWithTenant('100001', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'update',
          args: { where: { id: 1 }, data: { nickName: 'Updated' } },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);

        expect(params.args.where.tenantId).toBe('100001');
      });
    });

    it('should add tenant filter for delete', async () => {
      await runWithTenant('100001', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'delete',
          args: { where: { id: 1 } },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);

        expect(params.args.where.tenantId).toBe('100001');
      });
    });

    it('should set tenantId for create', async () => {
      await runWithTenant('100001', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'create',
          args: { data: { userName: 'test', nickName: 'Test' } },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);

        expect(params.args.data.tenantId).toBe('100001');
      });
    });

    it('should set tenantId for createMany', async () => {
      await runWithTenant('100001', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'createMany',
          args: {
            data: [{ userName: 'user1' }, { userName: 'user2' }],
          },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);

        expect(params.args.data[0].tenantId).toBe('100001');
        expect(params.args.data[1].tenantId).toBe('100001');
      });
    });

    it('should handle upsert', async () => {
      await runWithTenant('100001', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'upsert',
          args: {
            where: { id: 1 },
            create: { userName: 'test' },
            update: { nickName: 'Updated' },
          },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);

        expect(params.args.create.tenantId).toBe('100001');
        expect(params.args.where.tenantId).toBe('100001');
      });
    });

    it('should validate tenant ownership for findUnique', async () => {
      nextFn.mockResolvedValue({ id: 1, userName: 'test', tenantId: '100002' });

      const result = await runWithTenant('100001', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'findUnique',
          args: { where: { id: 1 } },
          dataPath: [],
          runInTransaction: false,
        };

        return middleware(params, nextFn);
      });

      // 租户不匹配，应返回 null
      expect(result).toBeNull();
    });

    it('should return result for findUnique when tenant matches', async () => {
      const mockResult = { id: 1, userName: 'test', tenantId: '100001' };
      nextFn.mockResolvedValue(mockResult);

      const result = await runWithTenant('100001', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'findUnique',
          args: { where: { id: 1 } },
          dataPath: [],
          runInTransaction: false,
        };

        return middleware(params, nextFn);
      });

      expect(result).toEqual(mockResult);
    });

    it('should not modify args for non-tenant models', async () => {
      await runWithTenant('100001', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'GenTable',
          action: 'findMany',
          args: { where: { status: '0' } },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);

        expect(params.args.where.tenantId).toBeUndefined();
      });
    });

    it('should pass through when model is undefined', async () => {
      const params: Prisma.MiddlewareParams = {
        model: undefined,
        action: 'queryRaw',
        args: {},
        dataPath: [],
        runInTransaction: false,
      };

      await middleware(params, nextFn);

      expect(nextFn).toHaveBeenCalledWith(params);
    });

    it('should not filter for super tenant', async () => {
      await runWithTenant('000000', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'findMany',
          args: { where: { status: '0' } },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);

        expect(params.args.where.tenantId).toBeUndefined();
      });
    });

    it('should not filter when ignoreTenant is set', async () => {
      await runWithTenant('100001', true, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'findMany',
          args: { where: { status: '0' } },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);

        expect(params.args.where.tenantId).toBeUndefined();
      });
    });
  });

  describe('Multi-tenant isolation scenarios', () => {
    let middleware: Prisma.Middleware;
    let nextFn: jest.Mock;

    beforeEach(() => {
      middleware = createTenantMiddleware();
      nextFn = jest.fn().mockResolvedValue([]);
    });

    it('should isolate data between different tenants', async () => {
      // 租户 A 查询
      await runWithTenant('tenant_a', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'findMany',
          args: { where: {} },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);
        expect(params.args.where.tenantId).toBe('tenant_a');
      });

      // 租户 B 查询
      await runWithTenant('tenant_b', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'findMany',
          args: { where: {} },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);
        expect(params.args.where.tenantId).toBe('tenant_b');
      });
    });

    it('should prevent tenant A from accessing tenant B data via findUnique', async () => {
      // 模拟返回租户 B 的数据
      nextFn.mockResolvedValue({ id: 1, userName: 'user_b', tenantId: 'tenant_b' });

      const result = await runWithTenant('tenant_a', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'findUnique',
          args: { where: { id: 1 } },
          dataPath: [],
          runInTransaction: false,
        };

        return middleware(params, nextFn);
      });

      // 租户 A 不应该能访问租户 B 的数据
      expect(result).toBeNull();
    });

    it('should allow super tenant to access all data', async () => {
      nextFn.mockResolvedValue({ id: 1, userName: 'user_b', tenantId: 'tenant_b' });

      const result = await runWithTenant('000000', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'findUnique',
          args: { where: { id: 1 } },
          dataPath: [],
          runInTransaction: false,
        };

        return middleware(params, nextFn);
      });

      // 超级租户可以访问任何租户的数据
      expect(result).toEqual({ id: 1, userName: 'user_b', tenantId: 'tenant_b' });
    });

    it('should create data with correct tenant', async () => {
      await runWithTenant('tenant_a', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'create',
          args: { data: { userName: 'new_user' } },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);
        expect(params.args.data.tenantId).toBe('tenant_a');
      });
    });

    it('should prevent update of other tenant data', async () => {
      await runWithTenant('tenant_a', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'update',
          args: { where: { id: 1 }, data: { nickName: 'Hacked' } },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);
        // where 条件会包含 tenantId，所以只能更新自己租户的数据
        expect(params.args.where.tenantId).toBe('tenant_a');
      });
    });

    it('should prevent delete of other tenant data', async () => {
      await runWithTenant('tenant_a', false, async () => {
        const params: Prisma.MiddlewareParams = {
          model: 'SysUser',
          action: 'delete',
          args: { where: { id: 1 } },
          dataPath: [],
          runInTransaction: false,
        };

        await middleware(params, nextFn);
        expect(params.args.where.tenantId).toBe('tenant_a');
      });
    });
  });
});
