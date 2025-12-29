import { SysUser, Status, DelFlag, UserType, Gender } from '@prisma/client';
import { BaseFactory } from './base.factory';
import * as bcrypt from 'bcryptjs';

/**
 * 用户测试数据工厂
 * 
 * @description
 * 提供创建 SysUser 测试数据的方法
 * 
 * @example
 * ```typescript
 * const user = UserFactory.create({ userName: 'testuser' });
 * const users = UserFactory.createMany(5);
 * ```
 */
export class UserFactory extends BaseFactory<SysUser> {
  protected getDefaults(): SysUser {
    return {
      userId: 1,
      tenantId: '000000',
      deptId: 100,
      userName: 'testuser',
      nickName: '测试用户',
      userType: UserType.NORMAL,
      email: 'test@example.com',
      phonenumber: '13800138000',
      sex: Gender.MALE,
      avatar: '',
      password: bcrypt.hashSync('password123', 10),
      status: Status.NORMAL,
      delFlag: DelFlag.NORMAL,
      loginIp: '127.0.0.1',
      loginDate: new Date(),
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
    };
  }

  protected getSequentialOverrides(index: number): Partial<SysUser> {
    return {
      userId: index + 1,
      userName: `user${index + 1}`,
      nickName: `测试用户${index + 1}`,
      email: `user${index + 1}@example.com`,
      phonenumber: `1380013800${index}`,
    };
  }

  /**
   * 创建管理员用户
   */
  static createAdmin(overrides?: Partial<SysUser>): SysUser {
    const factory = new UserFactory();
    return factory.create({
      userName: 'admin',
      nickName: '管理员',
      userType: UserType.SYSTEM,
      email: 'admin@example.com',
      ...overrides,
    });
  }

  /**
   * 创建普通用户
   */
  static createNormalUser(overrides?: Partial<SysUser>): SysUser {
    const factory = new UserFactory();
    return factory.create({
      userType: UserType.NORMAL,
      ...overrides,
    });
  }

  /**
   * 创建禁用用户
   */
  static createDisabledUser(overrides?: Partial<SysUser>): SysUser {
    const factory = new UserFactory();
    return factory.create({
      status: Status.DISABLED,
      ...overrides,
    });
  }

  /**
   * 创建已删除用户
   */
  static createDeletedUser(overrides?: Partial<SysUser>): SysUser {
    const factory = new UserFactory();
    return factory.create({
      delFlag: DelFlag.DELETED,
      ...overrides,
    });
  }

  /**
   * 创建单个用户（静态方法）
   */
  static create(overrides?: Partial<SysUser>): SysUser {
    const factory = new UserFactory();
    return factory.create(overrides);
  }

  /**
   * 批量创建用户（静态方法）
   */
  static createMany(count: number, overrides?: Partial<SysUser>): SysUser[] {
    const factory = new UserFactory();
    return factory.createMany(count, overrides);
  }

  /**
   * 创建带关联的用户（静态方法）
   */
  static createWithRelations(relations: Record<string, any>): SysUser {
    const factory = new UserFactory();
    return factory.createWithRelations(relations);
  }
}
