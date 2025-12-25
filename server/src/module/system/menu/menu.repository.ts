import { Injectable } from '@nestjs/common';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { Prisma, SysMenu } from '@prisma/client';
import { BaseRepository } from '../../../common/repository/base.repository';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * 菜单仓储层
 */
@Injectable()
export class MenuRepository extends BaseRepository<SysMenu, Prisma.SysMenuDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysMenu');
  }

  /**
   * 根据菜单名称查询
   */
  async findByMenuName(menuName: string): Promise<SysMenu | null> {
    return this.findOne({ menuName });
  }

  /**
   * 根据权限标识查询
   */
  async findByPermission(perms: string): Promise<SysMenu | null> {
    return this.findOne({ perms });
  }

  /**
   * 检查菜单名称是否存在
   */
  async existsByMenuName(menuName: string, parentId: number, excludeMenuId?: number): Promise<boolean> {
    const where: Prisma.SysMenuWhereInput = {
      menuName,
      parentId,
    };

    if (excludeMenuId) {
      where.menuId = { not: excludeMenuId };
    }

    return this.exists(where);
  }

  /**
   * 查询用户的所有菜单权限
   */
  async findUserMenus(userId: number): Promise<SysMenu[]> {
    return this.prisma.sysMenu.findMany({
      where: {
        roleMenus: {
          some: {
            role: {
              userRoles: {
                some: { userId },
              },
              delFlag: DelFlagEnum.NORMAL,
              status: StatusEnum.NORMAL,
            },
          },
        },
        status: StatusEnum.NORMAL,
      } as any,
      orderBy: [{ orderNum: 'asc' }, { createTime: 'asc' }],
    });
  }

  /**
   * 查询角色的菜单列表
   */
  async findRoleMenus(roleId: number): Promise<SysMenu[]> {
    // 先查询角色拥有的菜单ID
    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: { roleId },
      select: { menuId: true },
    });

    const menuIds = roleMenus.map((rm) => rm.menuId);

    if (menuIds.length === 0) {
      return [];
    }

    // 再查询这些菜单的详细信息
    return this.prisma.sysMenu.findMany({
      where: {
        menuId: { in: menuIds },
      },
      orderBy: [{ parentId: 'asc' }, { orderNum: 'asc' }],
    });
  }

  /**
   * 查询所有菜单（树形结构用）
   */
  async findAllMenus(query?: { status?: string; parentId?: number; menuType?: string }): Promise<SysMenu[]> {
    const where: Prisma.SysMenuWhereInput = {};

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.parentId !== undefined) {
      where.parentId = query.parentId;
    }

    if (query?.menuType) {
      where.menuType = query.menuType;
    }

    return this.delegate.findMany({
      where,
      orderBy: [{ parentId: 'asc' }, { orderNum: 'asc' }],
    });
  }

  /**
   * 查询子菜单数量
   */
  async countChildren(parentId: number): Promise<number> {
    return this.delegate.count({
      where: { parentId },
    });
  }

  /**
   * 检查菜单是否被角色使用
   */
  async isMenuUsedByRole(menuId: number): Promise<boolean> {
    const count = await this.prisma.sysRoleMenu.count({
      where: { menuId },
    });

    return count > 0;
  }

  /**
   * 根据角色ID列表查找菜单ID
   */
  async findUserMenuIds(roleIds: number[]): Promise<number[]> {
    const menuWithRoleList = await this.prisma.sysRoleMenu.findMany({
      where: {
        roleId: {
          in: roleIds,
        },
      },
      select: {
        menuId: true,
      },
    });
    return [...new Set(menuWithRoleList.map((item) => item.menuId))];
  }

  /**
   * 根据菜单ID列表查找菜单
   */
  async findByIds(menuIds: number[]): Promise<SysMenu[]> {
    return await this.delegate.findMany({
      where: {
        menuId: {
          in: menuIds,
        },
        status: StatusEnum.NORMAL,
      },
    });
  }

  /**
   * 批量删除菜单
   */
  async deleteBatch(menuIds: number[]): Promise<number> {
    const result = await this.delegate.deleteMany({
      where: {
        menuId: { in: menuIds },
      },
    });

    return result.count;
  }
}
