import { Injectable } from '@nestjs/common';
import { DelFlagEnum } from 'src/common/enum/index';
import { Prisma, SysUser } from '@prisma/client';
import { SoftDeleteRepository } from '../../../common/repository/base.repository';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * 用户仓储层
 *
 * @description 封装用户相关的数据访问逻辑
 */
@Injectable()
export class UserRepository extends SoftDeleteRepository<SysUser, Prisma.SysUserDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysUser');
  }

  /**
   * 覆盖主键名称
   */
  protected getPrimaryKeyName(): string {
    return 'userId';
  }

  /**
   * 根据用户名查询用户
   */
  async findByUserName(userName: string): Promise<SysUser | null> {
    return this.findOne({ userName, delFlag: DelFlagEnum.NORMAL });
  }

  /**
   * 根据手机号查询用户
   */
  async findByPhoneNumber(phonenumber: string): Promise<SysUser | null> {
    return this.findOne({ phonenumber, delFlag: DelFlagEnum.NORMAL });
  }

  /**
   * 根据邮箱查询用户
   */
  async findByEmail(email: string): Promise<SysUser | null> {
    return this.findOne({ email, delFlag: DelFlagEnum.NORMAL });
  }

  /**
   * 检查用户名是否存在
   */
  async existsByUserName(userName: string, excludeUserId?: number): Promise<boolean> {
    const where: Prisma.SysUserWhereInput = {
      userName,
      delFlag: DelFlagEnum.NORMAL,
    };

    if (excludeUserId) {
      where.userId = { not: excludeUserId };
    }

    return this.exists(where);
  }

  /**
   * 检查手机号是否存在
   */
  async existsByPhoneNumber(phonenumber: string, excludeUserId?: number): Promise<boolean> {
    const where: Prisma.SysUserWhereInput = {
      phonenumber,
      delFlag: DelFlagEnum.NORMAL,
    };

    if (excludeUserId) {
      where.userId = { not: excludeUserId };
    }

    return this.exists(where);
  }

  /**
   * 检查邮箱是否存在
   */
  async existsByEmail(email: string, excludeUserId?: number): Promise<boolean> {
    const where: Prisma.SysUserWhereInput = {
      email,
      delFlag: DelFlagEnum.NORMAL,
    };

    if (excludeUserId) {
      where.userId = { not: excludeUserId };
    }

    return this.exists(where);
  }

  /**
   * 分页查询用户列表（带部门信息）
   */
  async findPageWithDept(
    where: Prisma.SysUserWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.SysUserOrderByWithRelationInput,
  ): Promise<{ list: any[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      (this.prisma.sysUser.findMany as any)({
        where,
        skip,
        take,
        orderBy: orderBy || { createTime: 'desc' },
        include: {
          dept: {
            select: {
              deptId: true,
              deptName: true,
            },
          },
        },
      }),
      this.prisma.sysUser.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 更新用户最后登录时间
   */
  async updateLoginTime(userId: number): Promise<void> {
    await this.delegate.update({
      where: { userId },
      data: { loginDate: new Date() },
    });
  }

  /**
   * 重置用户密码
   */
  async resetPassword(userId: number, newPassword: string): Promise<void> {
    await this.delegate.update({
      where: { userId },
      data: { password: newPassword },
    });
  }

  /**
   * 批量删除用户（软删除）
   */
  async softDeleteBatch(userIds: number[]): Promise<number> {
    const result = await this.delegate.updateMany({
      where: {
        userId: { in: userIds },
        delFlag: DelFlagEnum.NORMAL,
      },
      data: { delFlag: '2' },
    });

    return result.count;
  }
}
