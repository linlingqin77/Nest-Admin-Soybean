import { Injectable } from '@nestjs/common';
import { DelFlagEnum } from 'src/common/enum/index';
import { Prisma, SysRole } from '@prisma/client';
import { SoftDeleteRepository } from '../../../common/repository/base.repository';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * 角色仓储层
 */
@Injectable()
export class RoleRepository extends SoftDeleteRepository<SysRole, Prisma.SysRoleDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysRole');
  }

  /**
   * 根据角色key查询角色
   */
  async findByRoleKey(roleKey: string): Promise<SysRole | null> {
    return this.findOne({ roleKey, delFlag: DelFlagEnum.NORMAL });
  }

  /**
   * 根据角色名称查询角色
   */
  async findByRoleName(roleName: string): Promise<SysRole | null> {
    return this.findOne({ roleName, delFlag: DelFlagEnum.NORMAL });
  }

  /**
   * 检查角色key是否存在
   */
  async existsByRoleKey(roleKey: string, excludeRoleId?: number): Promise<boolean> {
    const where: Prisma.SysRoleWhereInput = {
      roleKey,
      delFlag: DelFlagEnum.NORMAL,
    };

    if (excludeRoleId) {
      where.roleId = { not: excludeRoleId };
    }

    return this.exists(where);
  }

  /**
   * 检查角色名称是否存在
   */
  async existsByRoleName(roleName: string, excludeRoleId?: number): Promise<boolean> {
    const where: Prisma.SysRoleWhereInput = {
      roleName,
      delFlag: DelFlagEnum.NORMAL,
    };

    if (excludeRoleId) {
      where.roleId = { not: excludeRoleId };
    }

    return this.exists(where);
  }

  /**
   * 查询用户的所有角色
   */
  async findUserRoles(userId: number): Promise<SysRole[]> {
    return this.prisma.sysRole.findMany({
      where: {
        delFlag: DelFlagEnum.NORMAL,
        userRoles: {
          some: { userId },
        },
      } as any,
    });
  }

  /**
   * 查询角色列表（带菜单数量）
   */
  async findPageWithMenuCount(
    where: Prisma.SysRoleWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.SysRoleOrderByWithRelationInput,
  ): Promise<{ list: any[]; total: number }> {
    // 先查询角色列表
    const [roles, total] = await this.prisma.$transaction([
      this.prisma.sysRole.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { createTime: 'desc' },
      }),
      this.prisma.sysRole.count({ where }),
    ]);

    // 再查询每个角色的菜单数量
    const roleIds = roles.map((role) => role.roleId);
    const menuCounts = await this.prisma.sysRoleMenu.groupBy({
      by: ['roleId'],
      where: {
        roleId: { in: roleIds },
      },
      _count: {
        menuId: true,
      },
    });

    const menuCountMap = new Map(menuCounts.map((item) => [item.roleId, item._count.menuId]));

    const list = roles.map((role: any) => ({
      ...role,
      menuCount: menuCountMap.get(role.roleId) || 0,
    }));

    return { list, total };
  }

  /**
   * 批量删除角色（软删除）
   */
  async softDeleteBatch(roleIds: number[]): Promise<number> {
    const result = await this.delegate.updateMany({
      where: {
        roleId: { in: roleIds },
        delFlag: DelFlagEnum.NORMAL,
      },
      data: { delFlag: '2' },
    });

    return result.count;
  }

  /**
   * 查询角色关联的菜单ID列表
   */
  async findRoleMenuIds(roleId: number): Promise<number[]> {
    const roleMenus = await this.prisma.sysRoleMenu.findMany({
      where: { roleId },
      select: { menuId: true },
    });

    return roleMenus.map((rm) => rm.menuId);
  }
}
