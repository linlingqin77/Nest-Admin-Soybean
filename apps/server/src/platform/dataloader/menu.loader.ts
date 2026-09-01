import { Injectable, Scope } from '@nestjs/common';
import { SysMenu } from '@prisma/client';
import { PrismaService } from 'src/platform/prisma';
import { BaseLoader } from './base.loader';
import { DelFlagEnum } from 'src/shared/enums';

/**
 * 菜单数据加载器
 *
 * @description 批量加载菜单数据，解决 N+1 查询问题
 * 在同一请求周期内，多次调用 load() 会被合并为一次批量查询
 *
 * @example
 * ```typescript
 * // 在 Service 中注入使用
 * constructor(private readonly menuLoader: MenuLoader) {}
 *
 * async getMenusByIds(menuIds: number[]) {
 *   // 这些调用会被合并为一次数据库查询
 *   const menus = await Promise.all(
 *     menuIds.map(id => this.menuLoader.load(id))
 *   );
 *   return menus;
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class MenuLoader extends BaseLoader<number, SysMenu> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * 批量加载菜单数据
   *
   * @param menuIds - 菜单 ID 数组
   * @returns 与 menuIds 顺序对应的菜单数组
   */
  protected async batchLoad(menuIds: readonly number[]): Promise<(SysMenu | null)[]> {
    const menus = await this.prisma.sysMenu.findMany({
      where: {
        menuId: { in: [...menuIds] },
        delFlag: '0',
      },
    });

    // 创建 ID 到菜单的映射
    const menuMap = new Map<number, SysMenu>(menus.map((menu) => [menu.menuId, menu]));

    // 按照输入顺序返回结果
    return menuIds.map((id) => menuMap.get(id) ?? null);
  }

  /**
   * 批量加载角色的菜单列表
   *
   * @param roleIds - 角色 ID 数组
   * @returns 角色 ID 到菜单数组的映射
   */
  async loadByRoleIds(roleIds: number[]): Promise<Map<number, SysMenu[]>> {
    // 查询角色-菜单关联
    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: {
        roleId: { in: roleIds },
      },
      select: {
        roleId: true,
        menuId: true,
      },
    });

    // 收集所有菜单 ID
    const menuIds = [...new Set(roleMenus.map((rm) => rm.menuId))];

    // 批量查询菜单
    const menus =
      menuIds.length > 0
        ? await this.prisma.sysMenu.findMany({
            where: {
              menuId: { in: menuIds },
              delFlag: '0',
            },
            orderBy: [{ parentId: 'asc' }, { orderNum: 'asc' }],
          })
        : [];

    const menuMap = new Map<number, SysMenu>(menus.map((m) => [m.menuId, m]));

    // 按角色 ID 分组
    const result = new Map<number, SysMenu[]>();
    for (const roleId of roleIds) {
      result.set(roleId, []);
    }
    for (const rm of roleMenus) {
      const menu = menuMap.get(rm.menuId);
      if (menu) {
        const roleMenuList = result.get(rm.roleId);
        if (roleMenuList) {
          roleMenuList.push(menu);
        }
      }
    }

    return result;
  }

  /**
   * 批量加载菜单的子菜单
   *
   * @param parentIds - 父菜单 ID 数组
   * @returns 父菜单 ID 到子菜单数组的映射
   */
  async loadChildren(parentIds: number[]): Promise<Map<number, SysMenu[]>> {
    const children = await this.prisma.sysMenu.findMany({
      where: {
        parentId: { in: parentIds },
        delFlag: '0',
      },
      orderBy: { orderNum: 'asc' },
    });

    // 按父菜单 ID 分组
    const result = new Map<number, SysMenu[]>();
    for (const parentId of parentIds) {
      result.set(parentId, []);
    }
    for (const menu of children) {
      const list = result.get(menu.parentId);
      if (list) {
        list.push(menu);
      }
    }

    return result;
  }

  /**
   * 批量加载菜单的权限标识
   *
   * @param menuIds - 菜单 ID 数组
   * @returns 菜单 ID 到权限标识的映射
   */
  async loadPermissions(menuIds: number[]): Promise<Map<number, string>> {
    const menus = await this.prisma.sysMenu.findMany({
      where: {
        menuId: { in: menuIds },
        delFlag: '0',
      },
      select: {
        menuId: true,
        perms: true,
      },
    });

    const result = new Map<number, string>();
    for (const menu of menus) {
      result.set(menu.menuId, menu.perms || '');
    }

    return result;
  }

  /**
   * 批量加载菜单树（包含所有子菜单）
   *
   * @param rootIds - 根菜单 ID 数组
   * @returns 根菜单 ID 到完整菜单树的映射
   */
  async loadMenuTree(rootIds: number[]): Promise<Map<number, SysMenu[]>> {
    // 获取所有菜单
    const allMenus = await this.prisma.sysMenu.findMany({
      where: {
        delFlag: '0',
      },
      orderBy: [{ parentId: 'asc' }, { orderNum: 'asc' }],
    });

    // 构建菜单树
    const result = new Map<number, SysMenu[]>();

    for (const rootId of rootIds) {
      const tree: SysMenu[] = [];
      const collectChildren = (parentId: number) => {
        const children = allMenus.filter((m) => m.parentId === parentId);
        for (const child of children) {
          tree.push(child);
          collectChildren(child.menuId);
        }
      };

      // 添加根菜单
      const rootMenu = allMenus.find((m) => m.menuId === rootId);
      if (rootMenu) {
        tree.push(rootMenu);
      }
      collectChildren(rootId);

      result.set(rootId, tree);
    }

    return result;
  }
}
