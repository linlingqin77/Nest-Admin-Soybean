import { Injectable } from '@nestjs/common';
import { Prisma, SysDictType, SysDictData } from '@prisma/client';
import { SoftDeleteRepository } from '../../../common/repository/soft-delete.repository';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * 字典类型仓储层
 */
@Injectable()
export class DictTypeRepository extends SoftDeleteRepository<SysDictType, Prisma.SysDictTypeDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysDictType');
  }

  /**
   * 根据字典类型查询
   */
  async findByDictType(dictType: string): Promise<SysDictType | null> {
    return this.findOne({ dictType });
  }

  /**
   * 检查字典类型是否存在
   */
  async existsByDictType(dictType: string, excludeDictId?: number): Promise<boolean> {
    const where: Prisma.SysDictTypeWhereInput = { dictType };

    if (excludeDictId) {
      where.dictId = { not: excludeDictId };
    }

    return this.exists(where);
  }

  /**
   * 分页查询字典类型列表
   */
  async findPageWithFilter(
    where: Prisma.SysDictTypeWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysDictType[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.delegate.findMany({
        where,
        skip,
        take,
        orderBy: { createTime: 'desc' },
      }),
      this.delegate.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 查询所有字典类型（用于下拉选择）
   */
  async findAllForSelect(): Promise<SysDictType[]> {
    return this.findMany({
      orderBy: { dictId: 'asc' },
    });
  }

  /**
   * 批量创建字典类型
   */
  async createMany(data: Prisma.SysDictTypeCreateManyInput[]): Promise<{ count: number }> {
    const result = await this.prisma.sysDictType.createMany({
      data,
      skipDuplicates: true,
    });

    return { count: result.count };
  }
}

/**
 * 字典数据仓储层
 */
@Injectable()
export class DictDataRepository extends SoftDeleteRepository<SysDictData, Prisma.SysDictDataDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysDictData');
  }

  /**
   * 根据字典类型查询字典数据
   */
  async findByDictType(dictType: string): Promise<SysDictData[]> {
    return this.findMany({
      where: { dictType },
      orderBy: { dictSort: 'asc' },
    });
  }

  /**
   * 检查字典标签是否存在
   */
  async existsByDictLabel(dictType: string, dictLabel: string, excludeDictCode?: number): Promise<boolean> {
    const where: Prisma.SysDictDataWhereInput = {
      dictType,
      dictLabel,
    };

    if (excludeDictCode) {
      where.dictCode = { not: excludeDictCode };
    }

    return this.exists(where);
  }

  /**
   * 分页查询字典数据列表
   */
  async findPageWithFilter(
    where: Prisma.SysDictDataWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysDictData[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.delegate.findMany({
        where,
        skip,
        take,
        orderBy: [{ dictSort: 'asc' }, { dictCode: 'asc' }],
      }),
      this.delegate.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 根据字典类型批量删除字典数据
   */
  async deleteByDictType(dictType: string): Promise<number> {
    const result = await this.delegate.deleteMany({
      where: { dictType },
    });

    return result.count;
  }

  /**
   * 批量创建字典数据
   */
  async createMany(data: Prisma.SysDictDataCreateManyInput[]): Promise<{ count: number }> {
    const result = await this.prisma.sysDictData.createMany({
      data,
      skipDuplicates: true,
    });

    return { count: result.count };
  }
}
