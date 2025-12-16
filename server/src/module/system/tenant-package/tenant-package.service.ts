import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ResultData } from 'src/common/utils/result';
import { ExportTable } from 'src/common/utils/export';
import { FormatDateFields } from 'src/common/utils/index';
import { Response } from 'express';
import { CreateTenantPackageDto, UpdateTenantPackageDto, ListTenantPackageDto } from './dto/index';
import { PrismaService } from 'src/prisma/prisma.service';
import { IgnoreTenant } from 'src/common/tenant/tenant.decorator';

@Injectable()
export class TenantPackageService {
    private readonly logger = new Logger(TenantPackageService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * 创建租户套餐
     */
    @IgnoreTenant()
    async create(createTenantPackageDto: CreateTenantPackageDto) {
        // 检查套餐名称是否已存在
        const existPackage = await this.prisma.sysTenantPackage.findFirst({
            where: { packageName: createTenantPackageDto.packageName, delFlag: '0' },
        });

        if (existPackage) {
            throw new HttpException('套餐名称已存在', HttpStatus.BAD_REQUEST);
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
                createBy: '',
                updateBy: '',
            },
        });

        return ResultData.ok();
    }

    /**
     * 分页查询租户套餐列表
     */
    @IgnoreTenant()
    async findAll(query: ListTenantPackageDto) {
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

        const pageSize = Number(query.pageSize ?? 10);
        const pageNum = Number(query.pageNum ?? 1);

        const [list, total] = await this.prisma.$transaction([
            this.prisma.sysTenantPackage.findMany({
                where,
                skip: pageSize * (pageNum - 1),
                take: pageSize,
                orderBy: { createTime: 'desc' },
            }),
            this.prisma.sysTenantPackage.count({ where }),
        ]);

        return ResultData.ok({
            rows: FormatDateFields(list),
            total,
        });
    }

    /**
     * 获取租户套餐选择框列表
     */
    @IgnoreTenant()
    async selectList() {
        const list = await this.prisma.sysTenantPackage.findMany({
            where: {
                status: '0',
                delFlag: '0',
            },
            select: {
                packageId: true,
                packageName: true,
            },
            orderBy: { createTime: 'desc' },
        });

        return ResultData.ok(list);
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
            throw new HttpException('租户套餐不存在', HttpStatus.NOT_FOUND);
        }

        return ResultData.ok(tenantPackage);
    }

    /**
     * 更新租户套餐
     */
    @IgnoreTenant()
    async update(updateTenantPackageDto: UpdateTenantPackageDto) {
        const { packageId, menuIds, ...updateData } = updateTenantPackageDto;

        // 检查套餐是否存在
        const existPackage = await this.prisma.sysTenantPackage.findUnique({
            where: { packageId },
        });

        if (!existPackage) {
            throw new HttpException('租户套餐不存在', HttpStatus.NOT_FOUND);
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
                throw new HttpException('套餐名称已存在', HttpStatus.BAD_REQUEST);
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

        return ResultData.ok();
    }

    /**
     * 批量删除租户套餐
     */
    @IgnoreTenant()
    async remove(packageIds: number[]) {
        // 检查是否有租户正在使用这些套餐
        const tenantsUsingPackage = await this.prisma.sysTenant.findFirst({
            where: {
                packageId: { in: packageIds },
                delFlag: '0',
            },
        });

        if (tenantsUsingPackage) {
            throw new HttpException('存在租户正在使用该套餐，无法删除', HttpStatus.BAD_REQUEST);
        }

        await this.prisma.sysTenantPackage.updateMany({
            where: {
                packageId: { in: packageIds },
            },
            data: {
                delFlag: '1',
            },
        });

        return ResultData.ok();
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
            throw new HttpException('租户套餐不存在', HttpStatus.NOT_FOUND);
        }

        await this.prisma.sysTenantPackage.update({
            where: { packageId },
            data: { status },
        });

        return ResultData.ok();
    }

    /**
     * 导出租户套餐数据
     */
    @IgnoreTenant()
    async export(res: Response, body: ListTenantPackageDto) {
        delete body.pageNum;
        delete body.pageSize;
        const list = await this.findAll(body);
        const options = {
            sheetName: '租户套餐数据',
            data: list.data.rows,
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
