import { Injectable, Scope } from '@nestjs/common';
import { SysDept } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseLoader } from './base.loader';
import { DelFlagEnum } from '../enum';

/**
 * 部门数据加载器
 *
 * @description 批量加载部门数据，解决 N+1 查询问题
 * 在同一请求周期内，多次调用 load() 会被合并为一次批量查询
 *
 * @example
 * ```typescript
 * // 在 Service 中注入使用
 * constructor(private readonly deptLoader: DeptLoader) {}
 *
 * async getDeptsByIds(deptIds: number[]) {
 *   // 这些调用会被合并为一次数据库查询
 *   const depts = await Promise.all(
 *     deptIds.map(id => this.deptLoader.load(id))
 *   );
 *   return depts;
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class DeptLoader extends BaseLoader<number, SysDept> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * 批量加载部门数据
   *
   * @param deptIds - 部门 ID 数组
   * @returns 与 deptIds 顺序对应的部门数组
   */
  protected async batchLoad(deptIds: readonly number[]): Promise<(SysDept | null)[]> {
    const depts = await this.prisma.sysDept.findMany({
      where: {
        deptId: { in: [...deptIds] },
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    // 创建 ID 到部门的映射
    const deptMap = new Map<number, SysDept>(depts.map((dept) => [dept.deptId, dept]));

    // 按照输入顺序返回结果
    return deptIds.map((id) => deptMap.get(id) ?? null);
  }

  /**
   * 批量加载部门及其子部门
   *
   * @param deptIds - 部门 ID 数组
   * @returns 部门 ID 到子部门数组的映射
   */
  async loadWithChildren(deptIds: number[]): Promise<Map<number, SysDept[]>> {
    // 查询所有相关部门（包括子部门）
    const allDepts = await this.prisma.sysDept.findMany({
      where: {
        delFlag: DelFlagEnum.NORMAL,
        OR: [
          { deptId: { in: deptIds } },
          ...deptIds.map((id) => ({
            ancestors: { contains: `${id}` },
          })),
        ],
      },
      orderBy: [{ parentId: 'asc' }, { orderNum: 'asc' }],
    });

    // 按父部门 ID 分组
    const result = new Map<number, SysDept[]>();
    for (const deptId of deptIds) {
      const children = allDepts.filter(
        (dept) => dept.deptId === deptId || (dept.ancestors && dept.ancestors.includes(`${deptId}`)),
      );
      result.set(deptId, children);
    }

    return result;
  }

  /**
   * 批量加载部门的直接子部门
   *
   * @param parentIds - 父部门 ID 数组
   * @returns 父部门 ID 到直接子部门数组的映射
   */
  async loadDirectChildren(parentIds: number[]): Promise<Map<number, SysDept[]>> {
    const children = await this.prisma.sysDept.findMany({
      where: {
        parentId: { in: parentIds },
        delFlag: DelFlagEnum.NORMAL,
      },
      orderBy: { orderNum: 'asc' },
    });

    // 按父部门 ID 分组
    const result = new Map<number, SysDept[]>();
    for (const parentId of parentIds) {
      result.set(parentId, []);
    }
    for (const dept of children) {
      const list = result.get(dept.parentId);
      if (list) {
        list.push(dept);
      }
    }

    return result;
  }

  /**
   * 批量加载部门的用户数量
   *
   * @param deptIds - 部门 ID 数组
   * @returns 部门 ID 到用户数量的映射
   */
  async loadUserCounts(deptIds: number[]): Promise<Map<number, number>> {
    const counts = await this.prisma.sysUser.groupBy({
      by: ['deptId'],
      where: {
        deptId: { in: deptIds },
        delFlag: DelFlagEnum.NORMAL,
      },
      _count: {
        userId: true,
      },
    });

    const result = new Map<number, number>();
    for (const deptId of deptIds) {
      result.set(deptId, 0);
    }
    for (const count of counts) {
      if (count.deptId !== null) {
        result.set(count.deptId, count._count.userId);
      }
    }

    return result;
  }

  /**
   * 批量加载部门的祖先链
   *
   * @param deptIds - 部门 ID 数组
   * @returns 部门 ID 到祖先部门数组的映射
   */
  async loadAncestors(deptIds: number[]): Promise<Map<number, SysDept[]>> {
    // 先获取所有部门的 ancestors 字段
    const depts = await this.prisma.sysDept.findMany({
      where: {
        deptId: { in: deptIds },
        delFlag: DelFlagEnum.NORMAL,
      },
      select: {
        deptId: true,
        ancestors: true,
      },
    });

    // 收集所有祖先 ID
    const allAncestorIds = new Set<number>();
    const deptAncestorMap = new Map<number, number[]>();

    for (const dept of depts) {
      const ancestorIds = dept.ancestors
        ? dept.ancestors
            .split(',')
            .filter((id) => id && id !== '0')
            .map((id) => parseInt(id, 10))
        : [];
      deptAncestorMap.set(dept.deptId, ancestorIds);
      ancestorIds.forEach((id) => allAncestorIds.add(id));
    }

    // 批量查询所有祖先部门
    const ancestors =
      allAncestorIds.size > 0
        ? await this.prisma.sysDept.findMany({
            where: {
              deptId: { in: [...allAncestorIds] },
              delFlag: DelFlagEnum.NORMAL,
            },
          })
        : [];

    const ancestorMap = new Map<number, SysDept>(ancestors.map((a) => [a.deptId, a]));

    // 组装结果
    const result = new Map<number, SysDept[]>();
    for (const deptId of deptIds) {
      const ancestorIds = deptAncestorMap.get(deptId) ?? [];
      const ancestorList = ancestorIds.map((id) => ancestorMap.get(id)).filter((a): a is SysDept => a !== undefined);
      result.set(deptId, ancestorList);
    }

    return result;
  }
}
