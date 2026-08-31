import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma';
import { Uniq } from 'src/shared/utils/index';

/**
 * 用户角色桥接服务
 *
 * 用于解决 UserService 和 MenuService 之间的循环依赖问题。
 * 提供获取用户角色ID等基础查询方法，不依赖任何业务 Service。
 *
 * @example
 * // 在 MenuService 中使用，避免直接依赖 UserService
 * const roleIds = await this.userRoleBridge.getRoleIdsByUserId(userId);
 */
@Injectable()
export class UserRoleBridgeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 根据用户ID获取角色ID列表
   * @param userId 用户ID
   * @returns 角色ID数组
   */
  async getRoleIdsByUserId(userId: number): Promise<number[]> {
    const userRoles = await this.prisma.sysUserRole.findMany({
      where: { userId },
      select: { roleId: true },
    });
    return userRoles.map((ur) => ur.roleId);
  }

  /**
   * 根据用户ID数组获取角色ID列表
   * @param userIds 用户ID数组
   * @returns 去重后的角色ID数组
   */
  async getRoleIdsByUserIds(userIds: number[]): Promise<number[]> {
    const userRoles = await this.prisma.sysUserRole.findMany({
      where: { userId: { in: userIds } },
      select: { roleId: true },
    });
    return Uniq(userRoles.map((ur) => ur.roleId));
  }

  /**
   * 检查用户是否有指定角色
   * @param userId 用户ID
   * @param roleId 角色ID
   * @returns 是否有该角色
   */
  async hasRole(userId: number, roleId: number): Promise<boolean> {
    const count = await this.prisma.sysUserRole.count({
      where: { userId, roleId },
    });
    return count > 0;
  }

  /**
   * 检查用户是否为超级管理员 (roleId = 1)
   * @param userId 用户ID
   * @returns 是否为超级管理员
   */
  async isSuperAdmin(userId: number): Promise<boolean> {
    return this.hasRole(userId, 1);
  }

  /**
   * 获取用户的角色详情
   * @param userId 用户ID
   * @returns 角色列表
   */
  async getUserRoles(userId: number) {
    // 先获取用户的角色ID
    const roleIds = await this.getRoleIdsByUserId(userId);

    if (roleIds.length === 0) {
      return [];
    }

    // 再获取角色详情
    return this.prisma.sysRole.findMany({
      where: {
        roleId: { in: roleIds },
        delFlag: '0',
      },
      select: {
        roleId: true,
        roleName: true,
        roleKey: true,
        dataScope: true,
      },
    });
  }

  /**
   * 获取用户的权限标识列表
   * @param userId 用户ID
   * @returns 权限标识数组
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    const roleIds = await this.getRoleIdsByUserId(userId);

    if (roleIds.length === 0) {
      return [];
    }

    // 超级管理员拥有所有权限
    if (roleIds.includes(1)) {
      return ['*:*:*'];
    }

    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: { roleId: { in: roleIds } },
      select: { menuId: true },
    });

    const menuIds = Uniq(roleMenus.map((rm) => rm.menuId));

    if (menuIds.length === 0) {
      return [];
    }

    const menus = await this.prisma.sysMenu.findMany({
      where: {
        menuId: { in: menuIds },
        delFlag: '0',
        status: '0',
      },
      select: { perms: true },
    });

    return Uniq(menus.map((m) => m.perms).filter((p) => p && p.trim() !== ''));
  }
}
