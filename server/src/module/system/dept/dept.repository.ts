import { Injectable } from '@nestjs/common';
import { DelFlagEnum } from 'src/common/enum/index';
import { Prisma, SysDept } from '@prisma/client';
import { SoftDeleteRepository } from '../../../common/repository/base.repository';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * 部门仓储层
 */
@Injectable()
export class DeptRepository extends SoftDeleteRepository<SysDept, Prisma.SysDeptDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysDept');
  }

  /**
   * 根据部门名称查询
   */
  async findByDeptName(deptName: string): Promise<SysDept | null> {
    return this.findOne({ deptName, delFlag: DelFlagEnum.NORMAL });
  }

  /**
   * 检查部门名称是否存在
   */
  async existsByDeptName(deptName: string, parentId: number, excludeDeptId?: number): Promise<boolean> {
    const where: Prisma.SysDeptWhereInput = {
      deptName,
      parentId,
      delFlag: DelFlagEnum.NORMAL,
    };

    if (excludeDeptId) {
      where.deptId = { not: excludeDeptId };
    }

    return this.exists(where);
  }

  /**
   * 查询所有部门（树形结构用）
   */
  async findAllDepts(status?: string): Promise<SysDept[]> {
    const where: Prisma.SysDeptWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
    };

    if (status) {
      where.status = status;
    }

    return this.delegate.findMany({
      where,
      orderBy: [{ parentId: 'asc' }, { orderNum: 'asc' }],
    });
  }

  /**
   * 查询子部门数量
   */
  async countChildren(parentId: number): Promise<number> {
    return this.delegate.count({
      where: { parentId, delFlag: DelFlagEnum.NORMAL },
    });
  }

  /**
   * 查询部门下的用户数量
   */
  async countUsers(deptId: number): Promise<number> {
    return this.prisma.sysUser.count({
      where: { deptId, delFlag: DelFlagEnum.NORMAL },
    });
  }

  /**
   * 查询角色关联的部门ID列表
   */
  async findRoleDeptIds(roleId: number): Promise<number[]> {
    const roleDepts = await this.prisma.sysRoleDept.findMany({
      where: { roleId },
      select: { deptId: true },
    });

    return roleDepts.map((rd) => rd.deptId);
  }

  /**
   * 查询用户数据权限范围内的部门列表
   */
  async findUserDataScope(userId: number, deptIds: number[]): Promise<SysDept[]> {
    return this.delegate.findMany({
      where: {
        deptId: { in: deptIds },
        delFlag: DelFlagEnum.NORMAL,
      },
      orderBy: [{ parentId: 'asc' }, { orderNum: 'asc' }],
    });
  }

  /**
   * 批量删除部门（软删除）
   */
  async softDeleteBatch(deptIds: number[]): Promise<number> {
    const result = await this.delegate.updateMany({
      where: {
        deptId: { in: deptIds },
        delFlag: DelFlagEnum.NORMAL,
      },
      data: { delFlag: '2' },
    });

    return result.count;
  }
}
