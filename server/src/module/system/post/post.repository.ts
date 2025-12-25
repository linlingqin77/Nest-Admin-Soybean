import { Injectable } from '@nestjs/common';
import { Prisma, SysPost } from '@prisma/client';
import { SoftDeleteRepository } from '../../../common/repository/soft-delete.repository';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * 岗位仓储层
 */
@Injectable()
export class PostRepository extends SoftDeleteRepository<SysPost, Prisma.SysPostDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysPost');
  }

  /**
   * 根据岗位编码查询
   */
  async findByPostCode(postCode: string): Promise<SysPost | null> {
    return this.findOne({ postCode });
  }

  /**
   * 检查岗位编码是否存在
   */
  async existsByPostCode(postCode: string, excludePostId?: number): Promise<boolean> {
    const where: Prisma.SysPostWhereInput = { postCode };

    if (excludePostId) {
      where.postId = { not: excludePostId };
    }

    return this.exists(where);
  }

  /**
   * 检查岗位名称是否存在
   */
  async existsByPostName(postName: string, excludePostId?: number): Promise<boolean> {
    const where: Prisma.SysPostWhereInput = { postName };

    if (excludePostId) {
      where.postId = { not: excludePostId };
    }

    return this.exists(where);
  }

  /**
   * 分页查询岗位列表
   */
  async findPageWithFilter(
    where: Prisma.SysPostWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysPost[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.delegate.findMany({
        where,
        skip,
        take,
        orderBy: { postSort: 'asc' },
      }),
      this.delegate.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 查询岗位选择框列表
   */
  async findForSelect(deptId?: number, postIds?: number[]): Promise<SysPost[]> {
    const where: Prisma.SysPostWhereInput = {};

    if (deptId) {
      where.deptId = deptId;
    }

    if (postIds && postIds.length > 0) {
      where.postId = { in: postIds };
    }

    return this.findMany({
      where,
      orderBy: { postSort: 'asc' },
    });
  }

  /**
   * 查询用户的岗位
   */
  async findUserPosts(userId: number): Promise<SysPost[]> {
    return this.prisma.sysPost.findMany({
      where: {
        userPosts: {
          some: { userId },
        },
      } as any,
      orderBy: { postSort: 'asc' },
    });
  }

  /**
   * 统计岗位下的用户数
   */
  async countUsers(postId: number): Promise<number> {
    return this.prisma.sysUserPost.count({
      where: { postId },
    });
  }
}
