import { Injectable } from '@nestjs/common';
import { Prisma, SysTenantPackage } from '@prisma/client';
import { SoftDeleteRepository } from 'src/common/repository/base.repository';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * 租户套餐仓储层
 *
 * @description 封装租户套餐的数据访问逻辑
 */
@Injectable()
export class TenantPackageRepository extends SoftDeleteRepository<SysTenantPackage, Prisma.SysTenantPackageDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, 'sysTenantPackage');
  }

  /**
   * 分页查询租户套餐列表
   */
  async findPageWithFilter(
    where: Prisma.SysTenantPackageWhereInput,
    skip: number,
    take: number,
    orderBy?: Prisma.SysTenantPackageOrderByWithRelationInput,
  ): Promise<{ list: SysTenantPackage[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.delegate.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { createTime: 'desc' },
      }),
      this.delegate.count({ where }),
    ]);

    return { list, total };
  }

  /**
   * 根据套餐名称查询（不包括已删除的）
   */
  async findByPackageName(packageName: string, excludeId?: number): Promise<SysTenantPackage | null> {
    const where: Prisma.SysTenantPackageWhereInput = {
      packageName,
      delFlag: '0',
    };

    if (excludeId) {
      where.packageId = { not: excludeId };
    }

    return this.delegate.findFirst({ where });
  }

  /**
   * 检查套餐是否被租户使用
   */
  async isPackageInUse(packageId: number): Promise<boolean> {
    const count = await this.prisma.sysTenant.count({
      where: {
        packageId,
        delFlag: '0',
      },
    });

    return count > 0;
  }

  /**
   * 获取所有正常状态的套餐列表
   */
  async findAllNormalPackages(): Promise<SysTenantPackage[]> {
    return this.delegate.findMany({
      where: {
        status: '0',
        delFlag: '0',
      },
      orderBy: { createTime: 'desc' },
    });
  }

  /**
   * 根据套餐ID查询关联的菜单ID列表
   */
  async findMenuIdsByPackageId(packageId: number): Promise<number[]> {
    const packageData = await this.delegate.findUnique({
      where: { packageId },
      select: { menuIds: true },
    });

    if (!packageData?.menuIds) {
      return [];
    }

    // menuIds 是逗号分隔的字符串，需要转换为数字数组
    return packageData.menuIds
      .split(',')
      .filter(Boolean)
      .map((id) => parseInt(id, 10));
  }
}
