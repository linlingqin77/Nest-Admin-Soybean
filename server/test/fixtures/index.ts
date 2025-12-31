/**
 * 测试数据工厂
 *
 * @description
 * 提供创建测试数据的工厂方法，用于单元测试和集成测试
 *
 * @example
 * ```typescript
 * import {
 *   createUser,
 *   createRole,
 *   createTenant,
 * } from 'test/fixtures';
 *
 * const user = createUser({ userName: 'testuser' });
 * const role = createRole({ roleName: '测试角色' });
 * const tenant = createTenant({ companyName: '测试公司' });
 * ```
 */

// 用户相关
export {
  defaultUser,
  createUser,
  createUsers,
  createAdminUser,
  createNormalUser,
  createDisabledUser,
  createDeletedUser,
  createTenantUser,
  createUserDto,
  createUpdateUserDto,
  type CreateUserDto,
  type UpdateUserDto,
} from './user.fixture';

// 角色相关
export {
  defaultRole,
  createRole,
  createRoles,
  createSuperAdminRole,
  createNormalRole,
  createDisabledRole,
  createDeletedRole,
  createTenantRole,
  createRoleMenu,
  createRoleMenus,
  createRoleDept,
  createRoleDepts,
  createRoleDto,
  createUpdateRoleDto,
  DataScope,
  type CreateRoleDto,
  type UpdateRoleDto,
} from './role.fixture';

// 租户相关
export {
  defaultTenant,
  createTenant,
  createTenants,
  createSuperTenant,
  createNormalTenant,
  createDisabledTenant,
  createExpiredTenant,
  createDeletedTenant,
  createQuotaFullTenant,
  defaultTenantPackage,
  createTenantPackage,
  createTenantPackages,
  createTenantDto,
  createUpdateTenantDto,
  TenantStatus,
  DelFlag,
  type CreateTenantDto,
  type UpdateTenantDto,
} from './tenant.fixture';
