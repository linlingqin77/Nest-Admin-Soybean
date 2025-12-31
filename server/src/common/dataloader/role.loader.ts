import { Injectable, Scope } from '@nestjs/common';
import { SysRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseLoader } from './base.loader';
import { DelFlagEnum } from '../enum';

/**
 * 角色数据加载器
 *
 * @description 批量加载角色数据，解决 N+1 查询问题
 * 在同一请求周期内，多次调用 load() 会被合并为一次批量查询
 *
 * @example
 * ```typescript
 * // 在 Service 中注入使用
 * constructor(private readonly roleLoader: RoleLoader) {}
 *
 * async getRolesByIds(roleIds: number[]) {
 *   // 这些调用会被合并为一次数据库查询
 *   const roles = await Promise.all(
 *     roleIds.map(id => this.roleLoader.load(id))
 *   );
 *   return roles;
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class RoleLoader extends BaseLoader<number, SysRole> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * 批量加载角色数据
   *
   * @param roleIds - 角色 ID 数组
   * @returns 与 roleIds 顺序对应的角色数组
   */
  protected async batchLoad(roleIds: readonly number[]): Promise<(SysRole | null)[]> {
    const roles = await this.prisma.sysRole.findMany({
      where: {
        roleId: { in: [...roleIds] },
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    // 创建 ID 到角色的映射
    const roleMap = new Map<number, SysRole>(roles.map((role) => [role.roleId, role]));

    // 按照输入顺序返回结果
    return roleIds.map((id) => roleMap.get(id) ?? null);
  }

  /**
   * 批量加载用户的角色列表
   *
   * @param userIds - 用户 ID 数组
   * @returns 用户 ID 到角色数组的映射
   */
  async loadByUserIds(userIds: number[]): Promise<Map<number, SysRole[]>> {
    // 查询用户-角色关联
    const userRoles = await this.prisma.sysUserRole.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        userId: true,
        roleId: true,
      },
    });

    // 收集所有角色 ID
    const roleIds = [...new Set(userRoles.map((ur) => ur.roleId))];

    // 批量查询角色
    const roles =
      roleIds.length > 0
        ? await this.prisma.sysRole.findMany({
            where: {
              roleId: { in: roleIds },
              delFlag: DelFlagEnum.NORMAL,
            },
          })
        : [];

    const roleMap = new Map<number, SysRole>(roles.map((r) => [r.roleId, r]));

    // 按用户 ID 分组
    const result = new Map<number, SysRole[]>();
    for (const userId of userIds) {
      result.set(userId, []);
    }
    for (const ur of userRoles) {
      const role = roleMap.get(ur.roleId);
      if (role) {
        const userRoleList = result.get(ur.userId);
        if (userRoleList) {
          userRoleList.push(role);
        }
      }
    }

    return result;
  }

  /**
   * 批量加载角色的菜单 ID 列表
   *
   * @param roleIds - 角色 ID 数组
   * @returns 角色 ID 到菜单 ID 数组的映射
   */
  async loadMenuIds(roleIds: number[]): Promise<Map<number, number[]>> {
    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: {
        roleId: { in: roleIds },
      },
      select: {
        roleId: true,
        menuId: true,
      },
    });

    // 按角色 ID 分组
    const result = new Map<number, number[]>();
    for (const roleId of roleIds) {
      result.set(roleId, []);
    }
    for (const rm of roleMenus) {
      const menuIds = result.get(rm.roleId);
      if (menuIds) {
        menuIds.push(rm.menuId);
      }
    }

    return result;
  }

  /**
   * 批量加载角色的部门 ID 列表（数据权限）
   *
   * @param roleIds - 角色 ID 数组
   * @returns 角色 ID 到部门 ID 数组的映射
   */
  async loadDeptIds(roleIds: number[]): Promise<Map<number, number[]>> {
    const roleDepts = await this.prisma.sysRoleDept.findMany({
      where: {
        roleId: { in: roleIds },
      },
      select: {
        roleId: true,
        deptId: true,
      },
    });

    // 按角色 ID 分组
    const result = new Map<number, number[]>();
    for (const roleId of roleIds) {
      result.set(roleId, []);
    }
    for (const rd of roleDepts) {
      const deptIds = result.get(rd.roleId);
      if (deptIds) {
        deptIds.push(rd.deptId);
      }
    }

    return result;
  }

  /**
   * 批量加载角色的权限列表
   *
   * @param roleIds - 角色 ID 数组
   * @returns 角色 ID 到权限字符串数组的映射
   */
  async loadPermissions(roleIds: number[]): Promise<Map<number, string[]>> {
    // 超级管理员角色拥有所有权限
    if (roleIds.includes(1)) {
      const result = new Map<number, string[]>();
      for (const roleId of roleIds) {
        result.set(roleId, roleId === 1 ? ['*:*:*'] : []);
      }
      // 如果只有超级管理员，直接返回
      if (roleIds.length === 1) {
        return result;
      }
    }

    // 查询角色-菜单关联
    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: {
        roleId: { in: roleIds.filter((id) => id !== 1) },
      },
      select: {
        roleId: true,
        menuId: true,
      },
    });

    // 收集所有菜单 ID
    const menuIds = [...new Set(roleMenus.map((rm) => rm.menuId))];

    // 批量查询菜单权限
    const menus =
      menuIds.length > 0
        ? await this.prisma.sysMenu.findMany({
            where: {
              menuId: { in: menuIds },
              delFlag: DelFlagEnum.NORMAL,
            },
            select: {
              menuId: true,
              perms: true,
            },
          })
        : [];

    const menuPermMap = new Map<number, string>(
      menus.filter((m) => m.perms).map((m) => [m.menuId, m.perms as string]),
    );

    // 按角色 ID 分组
    const result = new Map<number, string[]>();
    for (const roleId of roleIds) {
      if (roleId === 1) {
        result.set(roleId, ['*:*:*']);
      } else {
        result.set(roleId, []);
      }
    }

    for (const rm of roleMenus) {
      const perm = menuPermMap.get(rm.menuId);
      if (perm) {
        const perms = result.get(rm.roleId);
        if (perms && !perms.includes(perm)) {
          perms.push(perm);
        }
      }
    }

    return result;
  }

  /**
   * 批量加载角色的用户数量
   *
   * @param roleIds - 角色 ID 数组
   * @returns 角色 ID 到用户数量的映射
   */
  async loadUserCounts(roleIds: number[]): Promise<Map<number, number>> {
    const counts = await this.prisma.sysUserRole.groupBy({
      by: ['roleId'],
      where: {
        roleId: { in: roleIds },
      },
      _count: {
        userId: true,
      },
    });

    const result = new Map<number, number>();
    for (const roleId of roleIds) {
      result.set(roleId, 0);
    }
    for (const count of counts) {
      result.set(count.roleId, count._count.userId);
    }

    return result;
  }
}
