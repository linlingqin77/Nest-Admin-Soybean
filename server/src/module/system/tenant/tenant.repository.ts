import { Injectable } from '@nestjs/common';
import { Prisma, SysTenant } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';
import { TenantContext } from 'src/common/tenant/tenant.context';

/**
 * 租户 Repository
 * 封装租户相关的数据访问逻辑
 */
@Injectable()
export class TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 根据租户ID查找租户
   */
  async findByTenantId(tenantId: string): Promise<SysTenant | null> {
    return this.prisma.sysTenant.findUnique({
      where: { tenantId },
    });
  }

  /**
   * 查找所有活跃租户
   */
  async findAllActive(): Promise<SysTenant[]> {
    return this.prisma.sysTenant.findMany({
      where: {
        status: StatusEnum.NORMAL,
        delFlag: DelFlagEnum.NORMAL,
      },
      orderBy: { createTime: 'desc' },
    });
  }

  /**
   * 查找所有非超级管理员租户
   */
  async findAllNonSuper(): Promise<Array<Pick<SysTenant, 'tenantId' | 'companyName' | 'status' | 'expireTime'>>> {
    return this.prisma.sysTenant.findMany({
      where: {
        status: StatusEnum.NORMAL,
        delFlag: DelFlagEnum.NORMAL,
        tenantId: { not: TenantContext.SUPER_TENANT_ID },
      },
      select: {
        tenantId: true,
        companyName: true,
        status: true,
        expireTime: true,
      },
    });
  }

  /**
   * 根据公司名称查找租户
   */
  async findByCompanyName(companyName: string): Promise<SysTenant | null> {
    return this.prisma.sysTenant.findFirst({
      where: {
        companyName,
        delFlag: DelFlagEnum.NORMAL,
      },
    });
  }

  /**
   * 获取最后创建的租户（用于生成新租户ID）
   */
  async findLastTenant(): Promise<SysTenant | null> {
    return this.prisma.sysTenant.findFirst({
      where: {
        tenantId: { not: TenantContext.SUPER_TENANT_ID },
      },
      orderBy: { id: 'desc' },
    });
  }

  /**
   * 检查租户ID是否存在
   */
  async existsByTenantId(tenantId: string): Promise<boolean> {
    const count = await this.prisma.sysTenant.count({
      where: { tenantId },
    });
    return count > 0;
  }

  /**
   * 分页查询租户列表
   */
  async findPaginated(
    where: Prisma.SysTenantWhereInput,
    skip: number,
    take: number,
  ): Promise<{ list: SysTenant[]; total: number }> {
    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysTenant.findMany({
        where,
        skip,
        take,
        orderBy: { createTime: 'desc' },
      }),
      this.prisma.sysTenant.count({ where }),
    ]);
    return { list, total };
  }

  /**
   * 创建租户
   */
  async create(data: Prisma.SysTenantCreateInput): Promise<SysTenant> {
    return this.prisma.sysTenant.create({ data });
  }

  /**
   * 更新租户
   */
  async update(tenantId: string, data: Prisma.SysTenantUpdateInput): Promise<SysTenant> {
    return this.prisma.sysTenant.update({
      where: { tenantId },
      data,
    });
  }

  /**
   * 更新租户状态
   */
  async updateStatus(tenantId: string, status: StatusEnum): Promise<SysTenant> {
    return this.prisma.sysTenant.update({
      where: { tenantId },
      data: { status },
    });
  }

  /**
   * 软删除
   */
  async softDelete(tenantId: string): Promise<SysTenant> {
    return this.prisma.sysTenant.update({
      where: { tenantId },
      data: { delFlag: DelFlagEnum.DELETE },
    });
  }

  /**
   * 批量更新租户套餐
   */
  async updatePackageForTenants(tenantIds: string[], packageId: number): Promise<number> {
    const result = await this.prisma.sysTenant.updateMany({
      where: {
        tenantId: { in: tenantIds },
      },
      data: {
        packageId,
      },
    });
    return result.count;
  }
}
