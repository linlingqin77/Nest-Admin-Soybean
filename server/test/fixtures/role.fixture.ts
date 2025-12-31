import { SysRole, SysRoleMenu, SysRoleDept } from '@prisma/client';

/**
 * 角色测试数据工厂
 *
 * @description
 * 提供创建测试角色数据的工厂方法
 */

/**
 * 默认角色数据
 */
export const defaultRole: SysRole = {
  roleId: 1,
  tenantId: '000000',
  roleName: '测试角色',
  roleKey: 'test_role',
  roleSort: 1,
  dataScope: '1',
  menuCheckStrictly: false,
  deptCheckStrictly: false,
  status: '0',
  delFlag: '0',
  createBy: 'admin',
  createTime: new Date(),
  updateBy: 'admin',
  updateTime: new Date(),
  remark: null,
};

/**
 * 创建角色测试数据
 *
 * @param overrides 要覆盖的字段
 * @returns 角色数据
 *
 * @example
 * ```typescript
 * const role = createRole({ roleName: '自定义角色' });
 * const adminRole = createRole({ roleKey: 'admin', roleName: '管理员' });
 * ```
 */
export const createRole = (overrides: Partial<SysRole> = {}): SysRole => {
  return {
    ...defaultRole,
    ...overrides,
  };
};

/**
 * 创建多个角色测试数据
 *
 * @param count 角色数量
 * @param overrides 要覆盖的字段（可以是函数）
 * @returns 角色数据数组
 *
 * @example
 * ```typescript
 * const roles = createRoles(5);
 * const rolesWithSort = createRoles(3, (i) => ({ roleSort: i + 1 }));
 * ```
 */
export const createRoles = (
  count: number,
  overrides: Partial<SysRole> | ((index: number) => Partial<SysRole>) = {},
): SysRole[] => {
  return Array.from({ length: count }, (_, index) => {
    const override = typeof overrides === 'function' ? overrides(index) : overrides;
    return createRole({
      roleId: index + 1,
      roleName: `测试角色${index + 1}`,
      roleKey: `test_role_${index + 1}`,
      roleSort: index + 1,
      ...override,
    });
  });
};

/**
 * 创建超级管理员角色
 */
export const createSuperAdminRole = (overrides: Partial<SysRole> = {}): SysRole => {
  return createRole({
    roleId: 1,
    roleName: '超级管理员',
    roleKey: 'admin',
    dataScope: '1', // 全部数据权限
    ...overrides,
  });
};

/**
 * 创建普通角色
 */
export const createNormalRole = (overrides: Partial<SysRole> = {}): SysRole => {
  return createRole({
    roleId: 2,
    roleName: '普通角色',
    roleKey: 'common',
    dataScope: '2', // 自定义数据权限
    ...overrides,
  });
};

/**
 * 创建禁用角色
 */
export const createDisabledRole = (overrides: Partial<SysRole> = {}): SysRole => {
  return createRole({
    roleId: 3,
    roleName: '禁用角色',
    roleKey: 'disabled',
    status: '1',
    ...overrides,
  });
};

/**
 * 创建已删除角色
 */
export const createDeletedRole = (overrides: Partial<SysRole> = {}): SysRole => {
  return createRole({
    roleId: 4,
    roleName: '已删除角色',
    roleKey: 'deleted',
    delFlag: '2',
    ...overrides,
  });
};

/**
 * 创建不同租户的角色
 */
export const createTenantRole = (tenantId: string, overrides: Partial<SysRole> = {}): SysRole => {
  return createRole({
    tenantId,
    ...overrides,
  });
};

/**
 * 创建角色菜单关联数据
 */
export const createRoleMenu = (roleId: number, menuId: number): SysRoleMenu => {
  return {
    roleId,
    menuId,
  };
};

/**
 * 创建多个角色菜单关联数据
 */
export const createRoleMenus = (roleId: number, menuIds: number[]): SysRoleMenu[] => {
  return menuIds.map((menuId) => createRoleMenu(roleId, menuId));
};

/**
 * 创建角色部门关联数据
 */
export const createRoleDept = (roleId: number, deptId: number): SysRoleDept => {
  return {
    roleId,
    deptId,
  };
};

/**
 * 创建多个角色部门关联数据
 */
export const createRoleDepts = (roleId: number, deptIds: number[]): SysRoleDept[] => {
  return deptIds.map((deptId) => createRoleDept(roleId, deptId));
};

/**
 * 角色创建 DTO 数据
 */
export interface CreateRoleDto {
  roleName: string;
  roleKey: string;
  roleSort: number;
  dataScope?: string;
  menuCheckStrictly?: boolean;
  deptCheckStrictly?: boolean;
  status?: string;
  menuIds?: number[];
  deptIds?: number[];
  remark?: string;
}

/**
 * 创建角色 DTO 测试数据
 */
export const createRoleDto = (overrides: Partial<CreateRoleDto> = {}): CreateRoleDto => {
  return {
    roleName: '新角色',
    roleKey: 'new_role',
    roleSort: 10,
    dataScope: '1',
    menuCheckStrictly: false,
    deptCheckStrictly: false,
    status: '0',
    menuIds: [1, 2, 3],
    deptIds: [100, 101],
    remark: '',
    ...overrides,
  };
};

/**
 * 角色更新 DTO 数据
 */
export interface UpdateRoleDto {
  roleId: number;
  roleName?: string;
  roleKey?: string;
  roleSort?: number;
  dataScope?: string;
  menuCheckStrictly?: boolean;
  deptCheckStrictly?: boolean;
  status?: string;
  menuIds?: number[];
  deptIds?: number[];
  remark?: string;
}

/**
 * 创建角色更新 DTO 测试数据
 */
export const createUpdateRoleDto = (overrides: Partial<UpdateRoleDto> = {}): UpdateRoleDto => {
  return {
    roleId: 1,
    roleName: '更新后的角色',
    roleKey: 'updated_role',
    roleSort: 5,
    dataScope: '2',
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    status: '0',
    menuIds: [1, 2, 3, 4],
    deptIds: [100, 101, 102],
    remark: '已更新',
    ...overrides,
  };
};

/**
 * 数据权限范围枚举
 */
export const DataScope = {
  /** 全部数据权限 */
  ALL: '1',
  /** 自定义数据权限 */
  CUSTOM: '2',
  /** 本部门数据权限 */
  DEPT: '3',
  /** 本部门及以下数据权限 */
  DEPT_AND_CHILD: '4',
  /** 仅本人数据权限 */
  SELF: '5',
} as const;
