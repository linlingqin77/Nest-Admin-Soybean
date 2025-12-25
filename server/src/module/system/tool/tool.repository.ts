import { Injectable } from '@nestjs/common';
import { Prisma, GenTable } from '@prisma/client';
import { SoftDeleteRepository } from 'src/common/repository/base.repository';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * 代码生成表仓储层
 *
 * @description 封装代码生成表的数据访问逻辑
 */
@Injectable()
export class ToolRepository extends SoftDeleteRepository<GenTable, Prisma.GenTableDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'genTable');
  }

  /**
   * 分页查询生成表列表
   */
  async findPageWithColumns(
    where: Prisma.GenTableWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.GenTableOrderByWithRelationInput,
  ): Promise<{ list: GenTable[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.delegate.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { tableId: 'desc' },
      }),
      this.delegate.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 查询生成表详情（包含列信息）
   */
  async findByIdWithColumns(tableId: number): Promise<(GenTable & { columns: any[] }) | null> {
    return this.prisma.genTable.findUnique({
      where: { tableId },
      include: {
        columns: {
          orderBy: { sort: 'asc' },
        },
      },
    }) as any;
  }

  /**
   * 根据表名查询生成表（包含列信息）
   */
  async findByTableNameWithColumns(tableName: string): Promise<(GenTable & { columns: any[] }) | null> {
    return this.prisma.genTable.findFirst({
      where: { tableName },
      include: {
        columns: {
          orderBy: { sort: 'asc' },
        },
      },
    }) as any;
  }

  /**
   * 批量查询生成表（包含列信息）
   */
  async findManyWithColumns(tableIds: number[]): Promise<Array<GenTable & { columns: any[] }>> {
    return this.prisma.genTable.findMany({
      where: {
        tableId: { in: tableIds },
      },
      include: {
        columns: {
          orderBy: { sort: 'asc' },
        },
      },
    }) as any;
  }

  /**
   * 检查表名是否已存在
   */
  async existsByTableName(tableName: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.GenTableWhereInput = {
      tableName,
      delFlag: '0',
    };

    if (excludeId) {
      where.tableId = { not: excludeId };
    }

    const count = await this.delegate.count({ where });
    return count > 0;
  }
}
