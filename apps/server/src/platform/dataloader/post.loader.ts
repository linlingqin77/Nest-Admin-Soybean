import { Injectable, Scope } from '@nestjs/common';
import { SysPost } from '@prisma/client';
import { PrismaService } from 'src/platform/prisma';
import { BaseLoader } from './base.loader';
import { DelFlagEnum } from 'src/shared/enums';

/**
 * 岗位数据加载器
 *
 * @description 批量加载岗位数据，解决 N+1 查询问题
 * 在同一请求周期内，多次调用 load() 会被合并为一次批量查询
 *
 * @example
 * ```typescript
 * // 在 Service 中注入使用
 * constructor(private readonly postLoader: PostLoader) {}
 *
 * async getPostsByIds(postIds: number[]) {
 *   // 这些调用会被合并为一次数据库查询
 *   const posts = await Promise.all(
 *     postIds.map(id => this.postLoader.load(id))
 *   );
 *   return posts;
 * }
 * ```
 */
@Injectable({ scope: Scope.REQUEST })
export class PostLoader extends BaseLoader<number, SysPost> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * 批量加载岗位数据
   *
   * @param postIds - 岗位 ID 数组
   * @returns 与 postIds 顺序对应的岗位数组
   */
  protected async batchLoad(postIds: readonly number[]): Promise<(SysPost | null)[]> {
    const posts = await this.prisma.sysPost.findMany({
      where: {
        postId: { in: [...postIds] },
        delFlag: '0',
      },
    });

    // 创建 ID 到岗位的映射
    const postMap = new Map<number, SysPost>(posts.map((post) => [post.postId, post]));

    // 按照输入顺序返回结果
    return postIds.map((id) => postMap.get(id) ?? null);
  }

  /**
   * 批量加载用户的岗位列表
   *
   * @param userIds - 用户 ID 数组
   * @returns 用户 ID 到岗位数组的映射
   */
  async loadByUserIds(userIds: number[]): Promise<Map<number, SysPost[]>> {
    // 查询用户-岗位关联
    const userPosts = await this.prisma.sysUserPost.findMany({
      where: {
        userId: { in: userIds },
      },
      select: {
        userId: true,
        postId: true,
      },
    });

    // 收集所有岗位 ID
    const postIds = [...new Set(userPosts.map((up) => up.postId))];

    // 批量查询岗位
    const posts =
      postIds.length > 0
        ? await this.prisma.sysPost.findMany({
            where: {
              postId: { in: postIds },
              delFlag: '0',
            },
            orderBy: { postSort: 'asc' },
          })
        : [];

    const postMap = new Map<number, SysPost>(posts.map((p) => [p.postId, p]));

    // 按用户 ID 分组
    const result = new Map<number, SysPost[]>();
    for (const userId of userIds) {
      result.set(userId, []);
    }
    for (const up of userPosts) {
      const post = postMap.get(up.postId);
      if (post) {
        const userPostList = result.get(up.userId);
        if (userPostList) {
          userPostList.push(post);
        }
      }
    }

    return result;
  }

  /**
   * 批量加载部门的岗位列表
   *
   * @param deptIds - 部门 ID 数组
   * @returns 部门 ID 到岗位数组的映射
   */
  async loadByDeptIds(deptIds: number[]): Promise<Map<number, SysPost[]>> {
    const posts = await this.prisma.sysPost.findMany({
      where: {
        deptId: { in: deptIds },
        delFlag: '0',
      },
      orderBy: { postSort: 'asc' },
    });

    // 按部门 ID 分组
    const result = new Map<number, SysPost[]>();
    for (const deptId of deptIds) {
      result.set(deptId, []);
    }
    for (const post of posts) {
      if (post.deptId !== null) {
        const list = result.get(post.deptId);
        if (list) {
          list.push(post);
        }
      }
    }

    return result;
  }

  /**
   * 批量加载岗位的用户数量
   *
   * @param postIds - 岗位 ID 数组
   * @returns 岗位 ID 到用户数量的映射
   */
  async loadUserCounts(postIds: number[]): Promise<Map<number, number>> {
    const counts = await this.prisma.sysUserPost.groupBy({
      by: ['postId'],
      where: {
        postId: { in: postIds },
      },
      _count: {
        userId: true,
      },
    });

    const result = new Map<number, number>();
    for (const postId of postIds) {
      result.set(postId, 0);
    }
    for (const count of counts) {
      result.set(count.postId, count._count.userId);
    }

    return result;
  }

  /**
   * 批量加载用户的岗位 ID 列表
   *
   * @param userIds - 用户 ID 数组
   * @returns 用户 ID 到岗位 ID 数组的映射
   */
  async loadPostIdsByUserIds(userIds: number[]): Promise<Map<number, number[]>> {
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
      const postIds = result.get(up.userId);
      if (postIds) {
        postIds.push(up.postId);
      }
    }

    return result;
  }

  /**
   * 按岗位编码批量加载岗位
   *
   * @param postCodes - 岗位编码数组
   * @returns 岗位编码到岗位的映射
   */
  async loadByPostCodes(postCodes: string[]): Promise<Map<string, SysPost>> {
    const posts = await this.prisma.sysPost.findMany({
      where: {
        postCode: { in: postCodes },
        delFlag: '0',
      },
    });

    const result = new Map<string, SysPost>();
    for (const post of posts) {
      result.set(post.postCode, post);
    }

    return result;
  }
}
