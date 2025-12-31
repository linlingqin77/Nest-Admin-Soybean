import { SysUser } from '@prisma/client';

/**
 * 用户测试数据工厂
 *
 * @description
 * 提供创建测试用户数据的工厂方法
 */

/**
 * 默认用户数据
 */
export const defaultUser: SysUser = {
  userId: 1,
  tenantId: '000000',
  deptId: 100,
  userName: 'testuser',
  nickName: '测试用户',
  userType: '00',
  email: 'test@example.com',
  phonenumber: '13800138000',
  sex: '0',
  avatar: '',
  password: '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', // 123456
  status: '0',
  delFlag: '0',
  loginIp: '127.0.0.1',
  loginDate: new Date(),
  createBy: 'admin',
  createTime: new Date(),
  updateBy: 'admin',
  updateTime: new Date(),
  remark: null,
};

/**
 * 创建用户测试数据
 *
 * @param overrides 要覆盖的字段
 * @returns 用户数据
 *
 * @example
 * ```typescript
 * const user = createUser({ userName: 'custom' });
 * const adminUser = createUser({ userType: '01', userName: 'admin' });
 * ```
 */
export const createUser = (overrides: Partial<SysUser> = {}): SysUser => {
  return {
    ...defaultUser,
    ...overrides,
  };
};

/**
 * 创建多个用户测试数据
 *
 * @param count 用户数量
 * @param overrides 要覆盖的字段（可以是函数）
 * @returns 用户数据数组
 *
 * @example
 * ```typescript
 * const users = createUsers(5);
 * const usersWithDept = createUsers(3, (i) => ({ deptId: 100 + i }));
 * ```
 */
export const createUsers = (
  count: number,
  overrides: Partial<SysUser> | ((index: number) => Partial<SysUser>) = {},
): SysUser[] => {
  return Array.from({ length: count }, (_, index) => {
    const override = typeof overrides === 'function' ? overrides(index) : overrides;
    return createUser({
      userId: index + 1,
      userName: `testuser${index + 1}`,
      nickName: `测试用户${index + 1}`,
      email: `test${index + 1}@example.com`,
      phonenumber: `1380013800${index}`,
      ...override,
    });
  });
};

/**
 * 创建管理员用户
 */
export const createAdminUser = (overrides: Partial<SysUser> = {}): SysUser => {
  return createUser({
    userId: 1,
    userName: 'admin',
    nickName: '超级管理员',
    userType: '00',
    ...overrides,
  });
};

/**
 * 创建普通用户
 */
export const createNormalUser = (overrides: Partial<SysUser> = {}): SysUser => {
  return createUser({
    userId: 2,
    userName: 'normal',
    nickName: '普通用户',
    userType: '01',
    ...overrides,
  });
};

/**
 * 创建禁用用户
 */
export const createDisabledUser = (overrides: Partial<SysUser> = {}): SysUser => {
  return createUser({
    userId: 3,
    userName: 'disabled',
    nickName: '禁用用户',
    status: '1',
    ...overrides,
  });
};

/**
 * 创建已删除用户
 */
export const createDeletedUser = (overrides: Partial<SysUser> = {}): SysUser => {
  return createUser({
    userId: 4,
    userName: 'deleted',
    nickName: '已删除用户',
    delFlag: '2',
    ...overrides,
  });
};

/**
 * 创建不同租户的用户
 */
export const createTenantUser = (tenantId: string, overrides: Partial<SysUser> = {}): SysUser => {
  return createUser({
    tenantId,
    ...overrides,
  });
};

/**
 * 用户创建 DTO 数据
 */
export interface CreateUserDto {
  userName: string;
  nickName: string;
  password: string;
  deptId?: number;
  email?: string;
  phonenumber?: string;
  sex?: string;
  status?: string;
  roleIds?: number[];
  postIds?: number[];
  remark?: string;
}

/**
 * 创建用户 DTO 测试数据
 */
export const createUserDto = (overrides: Partial<CreateUserDto> = {}): CreateUserDto => {
  return {
    userName: 'newuser',
    nickName: '新用户',
    password: '123456',
    deptId: 100,
    email: 'newuser@example.com',
    phonenumber: '13900139000',
    sex: '0',
    status: '0',
    roleIds: [2],
    postIds: [1],
    remark: '',
    ...overrides,
  };
};

/**
 * 用户更新 DTO 数据
 */
export interface UpdateUserDto {
  userId: number;
  nickName?: string;
  deptId?: number;
  email?: string;
  phonenumber?: string;
  sex?: string;
  status?: string;
  roleIds?: number[];
  postIds?: number[];
  remark?: string;
}

/**
 * 创建用户更新 DTO 测试数据
 */
export const createUpdateUserDto = (overrides: Partial<UpdateUserDto> = {}): UpdateUserDto => {
  return {
    userId: 1,
    nickName: '更新后的用户',
    deptId: 101,
    email: 'updated@example.com',
    phonenumber: '13900139001',
    sex: '1',
    status: '0',
    roleIds: [2, 3],
    postIds: [1, 2],
    remark: '已更新',
    ...overrides,
  };
};
