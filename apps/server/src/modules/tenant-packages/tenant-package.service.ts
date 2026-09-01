import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { StructuredLoggerService } from 'src/platform/logger/structured-logger.service';
import { Prisma } from '@prisma/client';
import { Result, ResponseCode } from 'src/shared/response';
import { DelFlagEnum, StatusEnum } from 'src/shared/enums/index';
import { BusinessException } from 'src/shared/exceptions';
import { ExportTable } from 'src/shared/utils/export';
import { Response } from 'express';
import {
  CreateTenantPackageRequestDto,
  UpdateTenantPackageRequestDto,
  ListTenantPackageRequestDto,
  TenantPackageResponseDto,
  TenantPackageSelectResponseDto,
} from './dto/index';
import { toDto, toDtoList } from 'src/shared/utils/serialize.util';
import { IgnoreTenant } from 'src/core/tenancy/decorators/tenant.decorator';
import { InjectTransactionHost, Transactional, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';

@Injectable()
export class TenantPackageService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly logger: StructuredLoggerService,
  ) {
    this.logger.setContext(TenantPackageService.name);
  }
  private get prisma() { return this.txHost.tx; }

  /**
   * 创建租户套餐
   */
  @IgnoreTenant()
  @Transactional()
  async create(createTenantPackageDto: CreateTenantPackageRequestDto) {
    // 检查套餐名称是否已存在
    const existPackage = await this.prisma.sysTenantPackage.findFirst({
      where: { packageName: createTenantPackageDto.packageName, delFlag: '0' },
    });

    if (existPackage) {
      throw new BusinessException(ResponseCode.BAD_REQUEST, '套餐名称已存在');
    }

    const menuIds = createTenantPackageDto.menuIds ? createTenantPackageDto.menuIds.join(',') : '';

    await this.prisma.sysTenantPackage.create({
      data: {
        packageName: createTenantPackageDto.packageName,
        menuIds,
        menuCheckStrictly: createTenantPackageDto.menuCheckStrictly ?? false,
        status: createTenantPackageDto.status ?? '0',
        remark: createTenantPackageDto.remark,
        delFlag: '0',
      },
    });

    return Result.ok();
  }

  /**
   * 分页查询租户套餐列表
   */
  @IgnoreTenant()
  async findAll(query: ListTenantPackageRequestDto) {
    const where: Prisma.SysTenantPackageWhereInput = {
      delFlag: '0',
    };

    if (query.packageName) {
      where.packageName = {
        contains: query.packageName,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysTenantPackage.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createTime: 'desc' },
      }),
      this.prisma.sysTenantPackage.count({ where }),
    ]);

    return Result.page(toDtoList(TenantPackageResponseDto, list), total, query.pageNum, query.pageSize);
  }

  /**
   * 获取租户套餐选择框列表
   */
  @IgnoreTenant()
  async selectList() {
    const list = await this.prisma.sysTenantPackage.findMany({
      where: {
        status: StatusEnum.NORMAL,
        delFlag: '0',
      },
      select: {
        packageId: true,
        packageName: true,
      },
      orderBy: { createTime: 'desc' },
    });

    return Result.ok(toDtoList(TenantPackageSelectResponseDto, list));
  }

  /**
   * 根据ID查询租户套餐详情
   */
  @IgnoreTenant()
  async findOne(packageId: number) {
    const tenantPackage = await this.prisma.sysTenantPackage.findUnique({
      where: { packageId },
    });

    if (!tenantPackage) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '租户套餐不存在');
    }

    return Result.ok(toDto(TenantPackageResponseDto, tenantPackage));
  }

  /**
   * 更新租户套餐
   */
  @IgnoreTenant()
  @Transactional()
  async update(updateTenantPackageDto: UpdateTenantPackageRequestDto) {
    const { packageId, menuIds, ...updateData } = updateTenantPackageDto;

    // 检查套餐是否存在
    const existPackage = await this.prisma.sysTenantPackage.findUnique({
      where: { packageId },
    });

    if (!existPackage) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '租户套餐不存在');
    }

    // 如果修改了套餐名称，检查是否与其他套餐重复
    if (updateData.packageName && updateData.packageName !== existPackage.packageName) {
      const duplicateName = await this.prisma.sysTenantPackage.findFirst({
        where: {
          packageName: updateData.packageName,
          packageId: { not: packageId },
          delFlag: '0',
        },
      });

      if (duplicateName) {
        throw new BusinessException(ResponseCode.BAD_REQUEST, '套餐名称已存在');
      }
    }

    const menuIdsStr = menuIds ? menuIds.join(',') : undefined;

    await this.prisma.sysTenantPackage.update({
      where: { packageId },
      data: {
        ...updateData,
        menuIds: menuIdsStr,
      },
    });

    return Result.ok();
  }

  /**
   * 批量删除租户套餐
   */
  @IgnoreTenant()
  @Transactional()
  async remove(packageIds: number[]) {
    // 检查是否有租户正在使用这些套餐
    const tenantsUsingPackage = await this.prisma.sysTenant.findFirst({
      where: {
        packageId: { in: packageIds },
        delFlag: '0',
      },
    });

    if (tenantsUsingPackage) {
      throw new BusinessException(ResponseCode.BAD_REQUEST, '存在租户正在使用该套餐，无法删除');
    }

    await this.prisma.sysTenantPackage.updateMany({
      where: {
        packageId: { in: packageIds },
      },
      data: {
        delFlag: '1',
      },
    });

    return Result.ok();
  }

  /**
   * 修改租户套餐状态
   */
  @IgnoreTenant()
  async changeStatus(packageId: number, status: string) {
    const existPackage = await this.prisma.sysTenantPackage.findUnique({
      where: { packageId },
    });

    if (!existPackage) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '租户套餐不存在');
    }

    await this.prisma.sysTenantPackage.update({
      where: { packageId },
      data: { status },
    });

    return Result.ok();
  }

  /**
   * 导出租户套餐数据
   */
  @IgnoreTenant()
  async export(res: Response, body: ListTenantPackageRequestDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '租户套餐数据',
      data: ((list.data as { rows?: unknown[] })?.rows ?? []) as unknown as Record<string, unknown>[],
      header: [
        { title: '套餐ID', dataIndex: 'packageId' },
        { title: '套餐名称', dataIndex: 'packageName' },
        { title: '关联菜单', dataIndex: 'menuIds' },
        { title: '状态', dataIndex: 'status' },
        { title: '创建时间', dataIndex: 'createTime' },
        { title: '备注', dataIndex: 'remark' },
      ],
    };
    return await ExportTable(options, res);
  }
}
