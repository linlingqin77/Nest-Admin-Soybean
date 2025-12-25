import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, ResponseCode } from 'src/common/response';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { SYS_USER_TYPE } from 'src/common/constant/index';
import { BusinessException } from 'src/common/exceptions';
import { ExportTable } from 'src/common/utils/export';
import { FormatDateFields } from 'src/common/utils/index';
import { Response } from 'express';
import { CreateTenantDto, UpdateTenantDto, ListTenantDto, SyncTenantPackageDto } from './dto/index';
import { PrismaService } from 'src/prisma/prisma.service';
import { IgnoreTenant } from 'src/common/tenant/tenant.decorator';
import { TenantContext } from 'src/common/tenant/tenant.context';
import { Transactional } from 'src/common/decorators/transactional.decorator';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/cache.enum';
import { hashSync } from 'bcryptjs';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 创建租户
   */
  @IgnoreTenant()
  @Transactional()
  async create(createTenantDto: CreateTenantDto) {
    // 自动生成租户ID（6位数字，从100001开始）
    let tenantId = createTenantDto.tenantId;
    if (!tenantId) {
      const lastTenant = await this.prisma.sysTenant.findFirst({
        where: { tenantId: { not: TenantContext.SUPER_TENANT_ID } }, // 排除超级管理员租户
        orderBy: { id: 'desc' },
      });
      const lastId = lastTenant?.tenantId ? parseInt(lastTenant.tenantId) : 100000;
      tenantId = String(lastId + 1).padStart(6, '0');
    }

    // 检查租户ID是否已存在
    const existTenant = await this.prisma.sysTenant.findUnique({
      where: { tenantId },
    });

    if (existTenant) {
      throw new BusinessException(ResponseCode.BAD_REQUEST, '租户ID已存在');
    }

    // 检查企业名称是否已存在
    const existCompany = await this.prisma.sysTenant.findFirst({
      where: { companyName: createTenantDto.companyName, delFlag: DelFlagEnum.NORMAL },
    });

    if (existCompany) {
      throw new BusinessException(ResponseCode.BAD_REQUEST, '企业名称已存在');
    }

    // 加密密码
    const hashedPassword = hashSync(createTenantDto.password, 10);

    try {
      // 创建租户
      await this.prisma.sysTenant.create({
        data: {
          tenantId,
          contactUserName: createTenantDto.contactUserName,
          contactPhone: createTenantDto.contactPhone,
          companyName: createTenantDto.companyName,
          licenseNumber: createTenantDto.licenseNumber,
          address: createTenantDto.address,
          intro: createTenantDto.intro,
          domain: createTenantDto.domain,
          packageId: createTenantDto.packageId,
          expireTime: createTenantDto.expireTime,
          accountCount: createTenantDto.accountCount ?? -1,
          status: createTenantDto.status ?? '0',
          remark: createTenantDto.remark,
          delFlag: DelFlagEnum.NORMAL,
        },
      });

      // 创建租户管理员账号
      await this.prisma.sysUser.create({
        data: {
          tenantId,
          userName: createTenantDto.username,
          nickName: '租户管理员',
          userType: SYS_USER_TYPE.SYS,
          password: hashedPassword,
          status: StatusEnum.NORMAL,
          delFlag: DelFlagEnum.NORMAL,
        },
      });

      return Result.ok();
    } catch (error) {
      this.logger.error('创建租户失败', error);
      throw new HttpException('创建租户失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 分页查询租户列表
   */
  @IgnoreTenant()
  async findAll(query: ListTenantDto) {
    const where: Prisma.SysTenantWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
    };

    if (query.tenantId) {
      where.tenantId = {
        contains: query.tenantId,
      };
    }

    if (query.contactUserName) {
      where.contactUserName = {
        contains: query.contactUserName,
      };
    }

    if (query.contactPhone) {
      where.contactPhone = {
        contains: query.contactPhone,
      };
    }

    if (query.companyName) {
      where.companyName = {
        contains: query.companyName,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.beginTime && query.endTime) {
      where.createTime = {
        gte: new Date(query.beginTime),
        lte: new Date(query.endTime),
      };
    }

    const [list, total] = await this.prisma.$transaction([
      this.prisma.sysTenant.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: { createTime: 'desc' },
      }),
      this.prisma.sysTenant.count({ where }),
    ]);

    // 优化：使用单次查询获取所有套餐名称，避免 N+1 问题
    const packageIds = list.map((item) => item.packageId).filter(Boolean);
    const packages =
      packageIds.length > 0
        ? await this.prisma.sysTenantPackage.findMany({
            where: { packageId: { in: packageIds } },
            select: { packageId: true, packageName: true },
          })
        : [];

    const packageMap = new Map(packages.map((pkg) => [pkg.packageId, pkg.packageName]));

    const listWithPackage = list.map((item) => ({
      ...item,
      packageName: item.packageId ? packageMap.get(item.packageId) || '' : '',
    }));

    return Result.ok({
      rows: FormatDateFields(listWithPackage),
      total,
    });
  }

  /**
   * 根据ID查询租户详情
   */
  @IgnoreTenant()
  async findOne(id: number) {
    const tenant = await this.prisma.sysTenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '租户不存在');
    }

    return Result.ok(tenant);
  }

  /**
   * 更新租户
   */
  @IgnoreTenant()
  async update(updateTenantDto: UpdateTenantDto) {
    const { id, ...updateData } = updateTenantDto;

    // 检查租户是否存在
    const existTenant = await this.prisma.sysTenant.findUnique({
      where: { id },
    });

    if (!existTenant) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '租户不存在');
    }

    // 如果修改了企业名称，检查是否与其他租户重复
    if (updateData.companyName && updateData.companyName !== existTenant.companyName) {
      const duplicateName = await this.prisma.sysTenant.findFirst({
        where: {
          companyName: updateData.companyName,
          id: { not: id },
          delFlag: DelFlagEnum.NORMAL,
        },
      });

      if (duplicateName) {
        throw new BusinessException(ResponseCode.BAD_REQUEST, '企业名称已存在');
      }
    }

    await this.prisma.sysTenant.update({
      where: { id },
      data: updateData,
    });

    return Result.ok();
  }

  /**
   * 批量删除租户
   */
  @IgnoreTenant()
  async remove(ids: number[]) {
    await this.prisma.sysTenant.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        delFlag: '1',
      },
    });

    return Result.ok();
  }

  /**
   * 同步租户字典
   */
  @IgnoreTenant()
  @Transactional()
  async syncTenantDict() {
    this.logger.log('开始同步租户字典');

    try {
      // 获取所有非超管租户
      const tenants = await this.prisma.sysTenant.findMany({
        where: {
          status: StatusEnum.NORMAL,
          delFlag: DelFlagEnum.NORMAL,
          tenantId: { not: TenantContext.SUPER_TENANT_ID },
        },
        select: { tenantId: true, companyName: true },
      });

      this.logger.log(`找到 ${tenants.length} 个租户需要同步字典`);

      // 获取超级管理员租户的字典类型
      const dictTypes = await this.prisma.sysDictType.findMany({
        where: { tenantId: TenantContext.SUPER_TENANT_ID, delFlag: DelFlagEnum.NORMAL },
      });

      this.logger.log(`找到 ${dictTypes.length} 个字典类型需要同步`);

      let syncedCount = 0;
      let skippedCount = 0;

      // 为每个租户同步字典类型
      for (const tenant of tenants) {
        this.logger.log(`正在为租户 ${tenant.companyName}(${tenant.tenantId}) 同步字典`);

        for (const dictType of dictTypes) {
          // 检查该租户是否已有此字典类型
          const exist = await this.prisma.sysDictType.findFirst({
            where: {
              tenantId: tenant.tenantId,
              dictType: dictType.dictType,
            },
          });

          if (!exist) {
            // 创建字典类型
            await this.prisma.sysDictType.create({
              data: {
                tenantId: tenant.tenantId,
                dictName: dictType.dictName,
                dictType: dictType.dictType,
                status: dictType.status,
                remark: dictType.remark,
                delFlag: DelFlagEnum.NORMAL,
                createBy: 'system',
                updateBy: 'system',
              },
            });

            // 获取该字典类型下的所有字典数据
            const dictDatas = await this.prisma.sysDictData.findMany({
              where: {
                tenantId: TenantContext.SUPER_TENANT_ID,
                dictType: dictType.dictType,
                delFlag: DelFlagEnum.NORMAL,
              },
            });

            // 为该租户创建字典数据（使用 createMany 跳过已存在的记录）
            if (dictDatas.length > 0) {
              try {
                await this.prisma.sysDictData.createMany({
                  data: dictDatas.map((dictData) => ({
                    tenantId: tenant.tenantId,
                    dictSort: dictData.dictSort,
                    dictLabel: dictData.dictLabel,
                    dictValue: dictData.dictValue,
                    dictType: dictData.dictType,
                    cssClass: dictData.cssClass,
                    listClass: dictData.listClass,
                    isDefault: dictData.isDefault,
                    status: dictData.status,
                    remark: dictData.remark,
                    delFlag: DelFlagEnum.NORMAL,
                    createBy: 'system',
                    updateBy: 'system',
                  })),
                  skipDuplicates: true, // 跳过重复记录
                });
              } catch (dataError) {
                this.logger.warn(`为租户 ${tenant.tenantId} 同步字典数据时出错: ${dataError.message}`);
              }
            }

            syncedCount++;
          } else {
            skippedCount++;
          }
        }
      }

      this.logger.log(`字典同步完成: 新增 ${syncedCount} 个，跳过 ${skippedCount} 个`);

      return Result.ok({
        message: `同步完成`,
        detail: {
          tenants: tenants.length,
          synced: syncedCount,
          skipped: skippedCount,
        },
      });
    } catch (error) {
      this.logger.error('同步租户字典失败:', error);
      throw new HttpException(`同步租户字典失败: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 同步租户套餐
   */
  @IgnoreTenant()
  async syncTenantPackage(params: SyncTenantPackageDto) {
    try {
      const { tenantId, packageId } = params;

      // 获取租户信息
      const tenant = await this.prisma.sysTenant.findUnique({
        where: { tenantId },
      });

      if (!tenant) {
        throw new BusinessException(ResponseCode.NOT_FOUND, '租户不存在');
      }

      // 获取套餐信息
      const tenantPackage = await this.prisma.sysTenantPackage.findUnique({
        where: { packageId },
      });

      if (!tenantPackage) {
        throw new BusinessException(ResponseCode.NOT_FOUND, '租户套餐不存在');
      }

      // 更新租户套餐
      await this.prisma.sysTenant.update({
        where: { tenantId },
        data: { packageId },
      });

      // 同步菜单权限
      if (tenantPackage.menuIds) {
        const menuIds = tenantPackage.menuIds.split(',').map((id) => Number(id));
        // 这里可以实现菜单权限同步逻辑
      }

      return Result.ok();
    } catch (error) {
      this.logger.error('同步租户套餐失败', error);
      throw new HttpException('同步租户套餐失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 同步租户参数配置
   */
  @IgnoreTenant()
  async syncTenantConfig() {
    this.logger.log('开始同步租户参数配置');

    try {
      // 获取所有非超管租户
      const tenants = await this.prisma.sysTenant.findMany({
        where: {
          status: StatusEnum.NORMAL,
          delFlag: DelFlagEnum.NORMAL,
          tenantId: { not: TenantContext.SUPER_TENANT_ID },
        },
        select: { tenantId: true, companyName: true },
      });

      this.logger.log(`找到 ${tenants.length} 个租户需要同步配置`);

      // 获取超级管理员租户的配置
      const configs = await this.prisma.sysConfig.findMany({
        where: { tenantId: TenantContext.SUPER_TENANT_ID, delFlag: DelFlagEnum.NORMAL },
      });

      this.logger.log(`找到 ${configs.length} 个配置项需要同步`);

      let syncedCount = 0;
      let skippedCount = 0;

      // 为每个租户同步配置（使用批量操作）
      for (const tenant of tenants) {
        this.logger.log(`正在为租户 ${tenant.companyName}(${tenant.tenantId}) 同步配置`);

        // 批量创建配置（跳过已存在的）
        try {
          const result = await this.prisma.sysConfig.createMany({
            data: configs.map((config) => ({
              tenantId: tenant.tenantId,
              configName: config.configName,
              configKey: config.configKey,
              configValue: config.configValue,
              configType: config.configType,
              remark: config.remark,
              delFlag: DelFlagEnum.NORMAL,
              createBy: 'system',
              updateBy: 'system',
            })),
            skipDuplicates: true,
          });

          syncedCount += result.count;
        } catch (configError) {
          this.logger.warn(`为租户 ${tenant.tenantId} 同步配置时出错: ${configError.message}`);
        }

        // 清除租户配置缓存
        await this.redisService.del(`${CacheEnum.SYS_CONFIG_KEY}${tenant.tenantId}`);
      }

      this.logger.log(`配置同步完成: 新增 ${syncedCount} 个，跳过 ${skippedCount} 个`);

      return Result.ok({
        message: '同步完成',
        detail: {
          tenants: tenants.length,
          synced: syncedCount,
          skipped: skippedCount,
        },
      });
    } catch (error) {
      this.logger.error('同步租户配置失败:', error);
      throw new HttpException(`同步租户配置失败: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 导出租户数据
   */
  @IgnoreTenant()
  async export(res: Response, body: ListTenantDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '租户数据',
      data: list.data.rows,
      header: [
        { title: '租户编号', dataIndex: 'tenantId' },
        { title: '企业名称', dataIndex: 'companyName' },
        { title: '联系人', dataIndex: 'contactUserName' },
        { title: '联系电话', dataIndex: 'contactPhone' },
        { title: '统一社会信用代码', dataIndex: 'licenseNumber' },
        { title: '地址', dataIndex: 'address' },
        { title: '套餐名称', dataIndex: 'packageName' },
        { title: '过期时间', dataIndex: 'expireTime' },
        { title: '账号数量', dataIndex: 'accountCount' },
        { title: '状态', dataIndex: 'status' },
        { title: '创建时间', dataIndex: 'createTime' },
      ],
    };
    return await ExportTable(options, res);
  }
}
