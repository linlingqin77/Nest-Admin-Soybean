import { SysRole, Status, DelFlag } from '@prisma/client';
import { BaseFactory } from './base.factory';

/**
 * 角色测试数据工厂
 * 
 * @description
 * 提供创建 SysRole 测试数据的方法
 * 
 * @example
 * ```typescript
 * const role = RoleFactory.create({ roleName: '管理员' });
 * const roles = RoleFactory.createMany(5);
 * ```
 */
export class RoleFactory extends BaseFactory<SysRole> {
  protected getDefaults(): SysRole {
    return {
      roleId: 1,
      tenantId: '000000',
      roleName: '测试角色',
      roleKey: 'test_role',
      roleSort: 1,
      dataScope: '1',
      menuCheckStrictly: false,
      deptCheckStrictly: false,
      status: Status.NORMAL,
      delFlag: DelFlag.NORMAL,
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
    };
  }

  protected getSequentialOverrides(index: number): Partial<SysRole> {
    return {
      roleId: index + 1,
      roleName: `测试角色${index + 1}`,
      roleKey: `test_role_${index + 1}`,
      roleSort: index + 1,
    };
  }

  /**
   * 创建管理员角色
   */
  static createAdminRole(overrides?: Partial<SysRole>): SysRole {
    const factory = new RoleFactory();
    return factory.create({
      roleName: '管理员',
      roleKey: 'admin',
      roleSort: 1,
      dataScope: '1', // 全部数据权限
      ...overrides,
    });
  }

  /**
   * 创建普通角色
   */
  static createNormalRole(overrides?: Partial<SysRole>): SysRole {
    const factory = new RoleFactory();
    return factory.create({
      roleName: '普通角色',
      roleKey: 'common',
      roleSort: 2,
      dataScope: '2', // 自定义数据权限
      ...overrides,
    });
  }

  /**
   * 创建部门角色
   */
  static createDeptRole(overrides?: Partial<SysRole>): SysRole {
    const factory = new RoleFactory();
    return factory.create({
      roleName: '部门角色',
      roleKey: 'dept',
      roleSort: 3,
      dataScope: '3', // 本部门数据权限
      ...overrides,
    });
  }

  /**
   * 创建自定义数据权限角色
   */
  static createCustomDataScopeRole(overrides?: Partial<SysRole>): SysRole {
    const factory = new RoleFactory();
    return factory.create({
      dataScope: '2',
      menuCheckStrictly: true,
      deptCheckStrictly: true,
      ...overrides,
    });
  }

  /**
   * 创建禁用角色
   */
  static createDisabledRole(overrides?: Partial<SysRole>): SysRole {
    const factory = new RoleFactory();
    return factory.create({
      status: Status.DISABLED,
      ...overrides,
    });
  }

  /**
   * 创建单个角色（静态方法）
   */
  static create(overrides?: Partial<SysRole>): SysRole {
    const factory = new RoleFactory();
    return factory.create(overrides);
  }

  /**
   * 批量创建角色（静态方法）
   */
  static createMany(count: number, overrides?: Partial<SysRole>): SysRole[] {
    const factory = new RoleFactory();
    return factory.createMany(count, overrides);
  }

  /**
   * 创建带关联的角色（静态方法）
   */
  static createWithRelations(relations: Record<string, any>): SysRole {
    const factory = new RoleFactory();
    return factory.createWithRelations(relations);
  }
}
