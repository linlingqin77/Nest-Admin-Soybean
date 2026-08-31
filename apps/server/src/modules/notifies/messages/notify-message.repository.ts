import { Injectable } from '@nestjs/common';
import { Prisma, SysNotifyMessage } from '@prisma/client';
import { PrismaService } from 'src/platform/prisma';

/**
 * 站内信消息仓储层
 * 注意：站内信消息使用软删除，但不继承SoftDeleteRepository，因为需要特殊处理BigInt类型的ID
 */
@Injectable()
export class NotifyMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建站内信消息
   */
  async create(data: Prisma.SysNotifyMessageCreateInput): Promise<SysNotifyMessage> {
    return this.prisma.sysNotifyMessage.create({ data });
  }

  /**
   * 批量创建站内信消息
   */
  async createMany(data: Prisma.SysNotifyMessageCreateManyInput[]): Promise<number> {
    const result = await this.prisma.sysNotifyMessage.createMany({ data });
    return result.count;
  }

  /**
   * 根据ID查询消息
   */
  async findById(id: bigint): Promise<SysNotifyMessage | null> {
    return this.prisma.sysNotifyMessage.findFirst({
      where: { id, delFlag: '0' },
    });
  }

  /**
   * 分页查询消息列表
   */
  async findPageWithFilter(
    where: Prisma.SysNotifyMessageWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysNotifyMessage[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysNotifyMessage.findMany({
        where: { ...where, delFlag: '0' },
        skip,
        take,
        orderBy: { createTime: 'desc' },
      }),
      this.prisma.sysNotifyMessage.count({ where: { ...where, delFlag: '0' } }),
    ]);

    return { list, total };
  }

  /**
   * 获取用户未读消息数量
   */
  async getUnreadCount(userId: number, tenantId?: string): Promise<number> {
    const where: Prisma.SysNotifyMessageWhereInput = {
      userId,
      readStatus: false,
      delFlag: '0',
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.sysNotifyMessage.count({ where });
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(id: bigint): Promise<SysNotifyMessage> {
    return this.prisma.sysNotifyMessage.update({
      where: { id },
      data: {
        readStatus: true,
        readTime: new Date(),
      },
    });
  }

  /**
   * 批量标记消息为已读
   */
  async markAsReadBatch(ids: bigint[]): Promise<number> {
    const result = await this.prisma.sysNotifyMessage.updateMany({
      where: { id: { in: ids }, delFlag: '0' },
      data: {
        readStatus: true,
        readTime: new Date(),
      },
    });
    return result.count;
  }

  /**
   * 标记用户所有消息为已读
   */
  async markAllAsRead(userId: number, tenantId?: string): Promise<number> {
    const where: Prisma.SysNotifyMessageWhereInput = {
      userId,
      readStatus: false,
      delFlag: '0',
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    const result = await this.prisma.sysNotifyMessage.updateMany({
      where,
      data: {
        readStatus: true,
        readTime: new Date(),
      },
    });
    return result.count;
  }

  /**
   * 软删除消息
   */
  async softDelete(id: bigint): Promise<SysNotifyMessage> {
    return this.prisma.sysNotifyMessage.update({
      where: { id },
      data: { delFlag: '1' },
    });
  }

  /**
   * 批量软删除消息
   */
  async softDeleteBatch(ids: bigint[]): Promise<number> {
    const result = await this.prisma.sysNotifyMessage.updateMany({
      where: { id: { in: ids } },
      data: { delFlag: '1' },
    });
    return result.count;
  }

  /**
   * 根据ID查询消息（包含已删除的，用于验证软删除）
   */
  async findByIdIncludeDeleted(id: bigint): Promise<SysNotifyMessage | null> {
    return this.prisma.sysNotifyMessage.findUnique({
      where: { id },
    });
  }

  /**
   * 获取用户最近的消息列表
   */
  async findRecentByUserId(userId: number, limit: number = 10, tenantId?: string): Promise<SysNotifyMessage[]> {
    const where: Prisma.SysNotifyMessageWhereInput = {
      userId,
      delFlag: '0',
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.sysNotifyMessage.findMany({
      where,
      take: limit,
      orderBy: { createTime: 'desc' },
    });
  }
}
