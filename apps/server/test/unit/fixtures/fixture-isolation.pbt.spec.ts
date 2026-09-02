/**
 * Fixture 工厂属性测试
 *
 * @description
 * 验证测试数据工厂生成的数据满足隔离性要求
 *
 * **Property 3: 测试数据隔离**
 * **Validates: Requirements 4.4**
 */

import * as fc from 'fast-check';
import { createBatchUsers, createUserFixture } from 'test/fixtures/user.fixture';
import { createBatchRoles, createRoleFixture } from 'test/fixtures/role.fixture';
import { createBatchTenants, createTenantFixture } from 'test/fixtures/tenant.fixture';

describe('Fixture 工厂 - 属性测试', () => {
  describe('Property 3: 测试数据隔离', () => {
    /**
     * **Validates: Requirements 4.4**
     * 对于任意两次调用 fixture 工厂，生成的数据应该相互独立
     */
    describe('用户 Fixture 隔离性', () => {
      it('多次调用 createUserFixture 应该生成不同的用户 ID', () => {
        fc.assert(
          fc.property(fc.integer({ min: 2, max: 10 }), (count) => {
            const users = Array.from({ length: count }, () => createUserFixture());
            const userIds = users.map((u) => u.userId);
            const uniqueIds = new Set(userIds);

            // 所有用户 ID 应该唯一
            return uniqueIds.size === count;
          }),
          { numRuns: 100 },
        );
      });

      it('多次调用 createUserFixture 应该生成不同的用户名', () => {
        fc.assert(
          fc.property(fc.integer({ min: 2, max: 10 }), (count) => {
            const users = Array.from({ length: count }, () => createUserFixture());
            const userNames = users.map((u) => u.userName);
            const uniqueNames = new Set(userNames);

            // 所有用户名应该唯一
            return uniqueNames.size === count;
          }),
          { numRuns: 100 },
        );
      });

      it('createBatchUsers 生成的用户应该相互独立', () => {
        fc.assert(
          fc.property(fc.integer({ min: 2, max: 20 }), (count) => {
            const users = createBatchUsers(count);

            // 验证数量正确
            if (users.length !== count) return false;

            // 验证邮箱唯一
            const emails = users.map((u) => u.email);
            const uniqueEmails = new Set(emails);

            return uniqueEmails.size === count;
          }),
          { numRuns: 100 },
        );
      });
    });

    describe('角色 Fixture 隔离性', () => {
      it('多次调用 createRoleFixture 应该生成不同的角色 ID', () => {
        fc.assert(
          fc.property(fc.integer({ min: 2, max: 10 }), (count) => {
            const roles = Array.from({ length: count }, () => createRoleFixture());
            const roleIds = roles.map((r) => r.roleId);
            const uniqueIds = new Set(roleIds);

            return uniqueIds.size === count;
          }),
          { numRuns: 100 },
        );
      });

      it('createBatchRoles 生成的角色应该相互独立', () => {
        fc.assert(
          fc.property(fc.integer({ min: 2, max: 20 }), (count) => {
            const roles = createBatchRoles(count);

            if (roles.length !== count) return false;

            // 验证角色 ID 唯一
            const roleIds = roles.map((r) => r.roleId);
            const uniqueIds = new Set(roleIds);

            return uniqueIds.size === count;
          }),
          { numRuns: 100 },
        );
      });
    });

    describe('租户 Fixture 隔离性', () => {
      it('多次调用 createTenantFixture 应该生成不同的租户 ID', () => {
        fc.assert(
          fc.property(fc.integer({ min: 2, max: 10 }), (count) => {
            const tenants = Array.from({ length: count }, () => createTenantFixture());
            const tenantIds = tenants.map((t) => t.tenantId);
            const uniqueIds = new Set(tenantIds);

            return uniqueIds.size === count;
          }),
          { numRuns: 100 },
        );
      });

      it('createBatchTenants 生成的租户应该相互独立', () => {
        fc.assert(
          fc.property(fc.integer({ min: 2, max: 20 }), (count) => {
            const tenants = createBatchTenants(count);

            if (tenants.length !== count) return false;

            // 验证租户 ID 唯一
            const tenantIds = tenants.map((t) => t.tenantId);
            const uniqueIds = new Set(tenantIds);

            return uniqueIds.size === count;
          }),
          { numRuns: 100 },
        );
      });
    });

    describe('跨类型数据隔离', () => {
      it('不同类型的 Fixture 应该可以独立使用', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 5 }),
            fc.integer({ min: 1, max: 5 }),
            fc.integer({ min: 1, max: 5 }),
            (userCount, roleCount, tenantCount) => {
              const users = createBatchUsers(userCount);
              const roles = createBatchRoles(roleCount);
              const tenants = createBatchTenants(tenantCount);

              // 验证各自数量正确
              return users.length === userCount && roles.length === roleCount && tenants.length === tenantCount;
            },
          ),
          { numRuns: 100 },
        );
      });
    });
  });

  describe('Fixture 数据完整性', () => {
    it('createUserFixture 应该生成完整的用户数据', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const user = createUserFixture();

          // 验证必要字段存在
          return (
            typeof user.userId === 'number' &&
            typeof user.userName === 'string' &&
            typeof user.nickName === 'string' &&
            typeof user.email === 'string' &&
            typeof user.phonenumber === 'string' &&
            typeof user.status === 'string' &&
            typeof user.tenantId === 'string'
          );
        }),
        { numRuns: 100 },
      );
    });

    it('createRoleFixture 应该生成完整的角色数据', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const role = createRoleFixture();

          return (
            typeof role.roleId === 'number' &&
            typeof role.roleName === 'string' &&
            typeof role.roleKey === 'string' &&
            typeof role.roleSort === 'number' &&
            typeof role.status === 'string' &&
            typeof role.tenantId === 'string'
          );
        }),
        { numRuns: 100 },
      );
    });

    it('createTenantFixture 应该生成完整的租户数据', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const tenant = createTenantFixture();

          return (
            typeof tenant.id === 'number' &&
            typeof tenant.tenantId === 'string' &&
            typeof tenant.companyName === 'string' &&
            typeof tenant.contactUserName === 'string' &&
            typeof tenant.status === 'string'
          );
        }),
        { numRuns: 100 },
      );
    });
  });
});
