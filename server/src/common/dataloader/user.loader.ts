import { Injectable, Scope } from '@nestjs/common';
import { SysUser } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseLoader } from './base.loader';
import { DelFlagEnum } from '../enum';

/**
 * 用户数据加载器
 *
 * @description 批量加载用户数据，解决 N+1 查询问题
 * 在同一请求周期内，多次调用 load() 会被合并为一次批量查询
 *
 * @example
 * ```typescript
 * // 在 Service 中注入使用
 * constructor(private readonly userLoader: UserLoader) {}
 *
 * async getUsersWithDept(userIds: number[]) {
 *   // 这些调用会被合并为一次数据库查询
 *   const users = await Promise.all(
 *     userIds.map(id => this.userLoader.load(id))
 *   );
 *   return users;
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class UserLoader extends BaseLoader<number, SysUser> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * 批量加载用户数据
   *
   * @param userIds - 用户 ID 数组
   * @returns 与 userIds 顺序对应的用户数组
   */
  protected async batchLoad(userIds: readonly number[]): Promise<(SysUser | null)[]> {
    const users = await this.prisma.sysUser.findMany({
      where: {
        userId: { in: [...userIds] },
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    // 创建 ID 到用户的映射
    const userMap = new Map<number, SysUser>(users.map((user) => [user.userId, user]));

    // 按照输入顺序返回结果
    return userIds.map((id) => userMap.get(id) ?? null);
  }

  /**
   * 批量加载用户及其部门信息
   *
   * @param userIds - 用户 ID 数组
   * @returns 包含部门信息的用户数组
   */
  async loadWithDept(userIds: number[]): Promise<Array<SysUser & { dept: unknown | null }>> {
    const users = await this.prisma.sysUser.findMany({
      where: {
        userId: { in: userIds },
        delFlag: DelFlagEnum.NORMAL,
      },
    });

    // 收集所有部门 ID
    const deptIds = [...new Set(users.map((u) => u.deptId).filter((id): id is number => id !== null))];

    // 批量查询部门
    const depts =
      deptIds.length > 0
        ? await this.prisma.sysDept.findMany({
            where: {
              deptId: { in: deptIds },
              delFlag: DelFlagEnum.NORMAL,
            },
          })
        : [];

    const deptMap = new Map(depts.map((d) => [d.deptId, d]));

    // 组装结果
    const results: Array<SysUser & { dept: unknown | null }> = [];
    for (const userId of userIds) {
      const user = users.find((u) => u.userId === userId);
      if (user) {
        results.push({
          ...user,
          dept: user.deptId ? deptMap.get(user.deptId) ?? null : null,
        });
      }
    }

    return results;
  }

  /**
   * 批量加载用户角色 ID
   *
   * @param userIds - 用户 ID 数组
   * @returns 用户 ID 到角色 ID 数组的映射
   */
  async loadUserRoleIds(userIds: number[]): Promise<Map<number, number[]>> {
    const userRoles = await this.prisma.sysUserRole.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        userId: true,
        roleId: true,
      },
    });

    // 按用户 ID 分组
    const result = new Map<number, number[]>();
    for (const userId of userIds) {
      result.set(userId, []);
    }
    for (const ur of userRoles) {
      const roles = result.get(ur.userId);
      if (roles) {
        roles.push(ur.roleId);
      }
    }

    return result;
  }

  /**
   * 批量加载用户岗位 ID
   *
   * @param userIds - 用户 ID 数组
   * @returns 用户 ID 到岗位 ID 数组的映射
   */
  async loadUserPostIds(userIds: number[]): Promise<Map<number, number[]>> {
    const userPosts = await this.prisma.sysUserPost.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        userId: true,
        postId: true,
      },
    });

    // 按用户 ID 分组
    const result = new Map<number, number[]>();
    for (const userId of userIds) {
      result.set(userId, []);
    }
    for (const up of userPosts) {
      const posts = result.get(up.userId);
      if (posts) {
        posts.push(up.postId);
      }
    }

    return result;
  }
}
