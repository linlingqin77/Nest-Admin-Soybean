import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { StructuredLoggerService } from 'src/platform/logger/structured-logger.service';
import { Prisma } from '@prisma/client';
import { Result, ResponseCode } from 'src/shared/response';
import { DelFlagEnum, StatusEnum } from 'src/shared/enums/index';
import { SYS_USER_TYPE } from 'src/shared/constants/index';
import { BusinessException } from 'src/shared/exceptions';
import { ExportTable } from 'src/shared/utils/export';
import { Response } from 'express';
import {
  CreateTenantRequestDto,
  UpdateTenantRequestDto,
  ListTenantRequestDto,
  SyncTenantPackageRequestDto,
  TenantResponseDto,
} from './dto/index';
import { toDto, toDtoList } from 'src/shared/utils/serialize.util';
import { IgnoreTenant } from 'src/core/tenancy/decorators/tenant.decorator';
import { TenantContext } from 'src/core/tenancy/context/tenant.context';
import { InjectTransactionHost, Transactional, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';
import { Idempotent } from 'src/core/http/decorators/idempotent.decorator';
import { Lock } from 'src/core/http/decorators/lock.decorator';
import { RedisService } from 'src/platform/redis/redis.service';
import { CacheEnum } from 'src/shared/enums/cache.enum';
import { hashSync } from 'bcryptjs';
import { UserType } from 'src/modules/users/dto/user';

/**
 * 租户切换原始信息
 */
interface TenantSwitchOriginal {
  originalTenantId: string;
  originalCompanyName: string;
  switchedAt: Date;
}

/**
 * 租户管理服务
 *
 * 提供多租户SaaS平台的租户管理功能，包括：
 * - 租户CRUD操作（创建、查询、更新、删除）
 * - 租户管理员账号创建
 * - 租户字典数据同步
 * - 租户套餐管理
 * - 租户配置同步
 * - 租户数据导出
 * - 租户切换功能
 *
 * @class TenantService
 * @description 多租户架构的核心服务类，实现租户隔离和管理功能
 */
@Injectable()
export class TenantService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly redisService: RedisService,
    private readonly logger: StructuredLoggerService,
  ) {
    this.logger.setContext(TenantService.name);
  }
  private get prisma() { return this.txHost.tx; }

  /**
   * 创建新租户
   *
   * 创建租户记录并自动创建租户管理员账号。
   * 租户ID会自动生成（6位数字，从100001开始）。
   *
   * @param createTenantDto - 创建租户的数据传输对象
   * @returns 操作结果
   * @throws {BusinessException} 当租户ID或企业名称已存在时抛出异常
   * @throws {HttpException} 当创建过程发生错误时抛出异常
   *
   * @example
   * ```typescript
   * await tenantService.create({
   *   companyName: '示例公司',
   *   contactUserName: '张三',
   *   contactPhone: '13800138000',
   *   username: 'admin',
   *   password: '123456',
   *   packageId: 1
   * });
   * ```
   */
  @IgnoreTenant()
  @Idempotent({
    timeout: 10,
    keyResolver: '{body.companyName}',
    message: '租户正在创建中，请勿重复提交',
  })
  @Transactional()
  async create(createTenantDto: CreateTenantRequestDto) {
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
      where: { companyName: createTenantDto.companyName, delFlag: '0' },
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
          delFlag: '0',
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
          delFlag: '0',
        },
      });

      return Result.ok();
    } catch (error) {
      this.logger.error('创建租户失败', { action: 'tenant.create' });
      throw new HttpException('创建租户失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 分页查询租户列表
   *
   * 支持按租户ID、联系人、联系电话、企业名称、状态等条件筛选。
   * 返回结果包含关联的套餐名称。
   *
   * @param query - 查询参数，包含分页信息和筛选条件
   * @returns 分页租户列表，包含rows和total
   *
   * @example
   * ```typescript
   * const result = await tenantService.findAll({
   *   pageNum: 1,
   *   pageSize: 10,
   *   companyName: '示例',
   *   status: '0'
   * });
   * ```
   */
  @IgnoreTenant()
  async findAll(query: ListTenantRequestDto) {
    const where: Prisma.SysTenantWhereInput = {
      delFlag: '0',
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
    ]) as [Array<{ packageId: number | null; [key: string]: unknown }>, number];

    // 优化：使用单次查询获取所有套餐名称，避免 N+1 问题
    const packageIds = list.map((item: { packageId: number | null }) => item.packageId).filter(Boolean);
    const packages =
      packageIds.length > 0
        ? await this.prisma.sysTenantPackage.findMany({
            where: { packageId: { in: packageIds as number[] } },
            select: { packageId: true, packageName: true },
          })
        : [];

    const packageMap = new Map(packages.map((pkg) => [pkg.packageId, pkg.packageName]));

    const listWithPackage = list.map((item: { packageId: number | null }) => ({
      ...item,
      packageName: item.packageId ? packageMap.get(item.packageId) || '' : '',
    }));

    return Result.page(toDtoList(TenantResponseDto, listWithPackage), total, query.pageNum, query.pageSize);
  }

  /**
   * 根据ID查询租户详情
   *
   * @param id - 租户记录ID（非tenantId）
   * @returns 租户详情信息
   * @throws {BusinessException} 当租户不存在时抛出异常
   */
  @IgnoreTenant()
  async findOne(id: number) {
    const tenant = await this.prisma.sysTenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '租户不存在');
    }

    return Result.ok(toDto(TenantResponseDto, tenant));
  }

  /**
   * 更新租户信息
   *
   * 更新租户基本信息，如企业名称、联系人、套餐等。
   * 会检查企业名称是否与其他租户重复。
   *
   * @param updateTenantDto - 更新租户的数据传输对象
   * @returns 操作结果
   * @throws {BusinessException} 当租户不存在或企业名称重复时抛出异常
   */
  @IgnoreTenant()
  async update(updateTenantDto: UpdateTenantRequestDto) {
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
          delFlag: '0',
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
   * 批量删除租户（软删除）
   *
   * @param ids - 要删除的租户记录ID数组
   * @returns 操作结果
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
   * 同步租户字典数据
   *
   * 将超级管理员租户的字典类型和字典数据同步到所有普通租户。
   * 已存在的字典类型会被跳过，不会覆盖。
   *
   * @returns 同步结果，包含同步的租户数、新增数和跳过数
   * @throws {HttpException} 当同步过程发生错误时抛出异常
   *
   * @example
   * ```typescript
   * const result = await tenantService.syncTenantDict();
   * console.log(result.data.detail.synced); // 新增的字典数
   * ```
   */
  @IgnoreTenant()
  @Lock({
    key: 'tenant:dict:sync',
    leaseTime: 120,
    message: '租户字典同步正在进行中，请稍后重试',
  })
  @Transactional()
  async syncTenantDict() {
    this.logger.info({ action: 'tenant.syncDict.start', message: '开始同步租户字典' });

    try {
      // 获取所有非超管租户
      const tenants = await this.prisma.sysTenant.findMany({
        where: {
          status: StatusEnum.NORMAL,
          delFlag: '0',
          tenantId: { not: TenantContext.SUPER_TENANT_ID },
        },
        select: { tenantId: true, companyName: true },
      });

      this.logger.info({ action: 'tenant.syncDict.tenantsFound', message: `找到 ${tenants.length} 个租户需要同步字典` });

      // 获取超级管理员租户的字典类型
      const dictTypes = await this.prisma.sysDictType.findMany({
        where: { tenantId: TenantContext.SUPER_TENANT_ID, delFlag: '0' },
      });

      this.logger.info({ action: 'tenant.syncDict.dictTypesFound', message: `找到 ${dictTypes.length} 个字典类型需要同步` });

      let syncedCount = 0;
      let skippedCount = 0;

      // 为每个租户同步字典类型
      for (const tenant of tenants) {
        this.logger.info({ action: 'tenant.syncDict.syncing', message: `正在为租户 ${tenant.companyName}(${tenant.tenantId}) 同步字典` });

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
                delFlag: '0',
                createBy: 'system',
                updateBy: 'system',
              },
            });

            // 获取该字典类型下的所有字典数据
            const dictDatas = await this.prisma.sysDictData.findMany({
              where: {
                tenantId: TenantContext.SUPER_TENANT_ID,
                dictType: dictType.dictType,
                delFlag: '0',
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
                    delFlag: '0',
                    createBy: 'system',
                    updateBy: 'system',
                  })),
                  skipDuplicates: true, // 跳过重复记录
                });
              } catch (dataError) {
                this.logger.warn(`为租户 ${tenant.tenantId} 同步字典数据时出错: ${dataError instanceof Error ? dataError.message : String(dataError)}`, { action: 'tenant.syncDict.dataError' });
              }
            }

            syncedCount++;
          } else {
            skippedCount++;
          }
        }
      }

      this.logger.info({ action: 'tenant.syncDict.complete', message: `字典同步完成: 新增 ${syncedCount} 个，跳过 ${skippedCount} 个` });

      return Result.ok({
        message: `同步完成`,
        detail: {
          tenants: tenants.length,
          synced: syncedCount,
          skipped: skippedCount,
        },
      });
    } catch (error) {
      this.logger.error('同步租户字典失败', { action: 'tenant.syncDict.failed' });
      throw new HttpException(`同步租户字典失败: ${error instanceof Error ? error.message : String(error)}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 同步租户套餐
   *
   * 为指定租户更新套餐，并同步套餐中包含的菜单权限。
   *
   * @param params - 包含tenantId和packageId
   * @returns 操作结果
   * @throws {BusinessException} 当租户或套餐不存在时抛出异常
   * @throws {HttpException} 当同步过程发生错误时抛出异常
   */
  @IgnoreTenant()
  @Lock({
    key: 'tenant:package:sync:{params.tenantId}',
    leaseTime: 60,
    message: '租户套餐同步正在进行中，请稍后重试',
  })
  async syncTenantPackage(params: SyncTenantPackageRequestDto) {
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
      this.logger.error('同步租户套餐失败', { action: 'tenant.syncPackage.failed' });
      throw new HttpException('同步租户套餐失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 同步租户参数配置
   *
   * 将超级管理员租户的系统配置同步到所有普通租户。
   * 使用批量创建并跳过已存在的配置项。
   * 同步完成后会清除各租户的配置缓存。
   *
   * @returns 同步结果，包含同步的租户数和新增配置数
   * @throws {HttpException} 当同步过程发生错误时抛出异常
   */
  @IgnoreTenant()
  @Lock({
    key: 'tenant:config:sync',
    leaseTime: 120,
    message: '租户配置同步正在进行中，请稍后重试',
  })
  async syncTenantConfig() {
    this.logger.info({ action: 'tenant.syncConfig.start', message: '开始同步租户参数配置' });

    try {
      // 获取所有非超管租户
      const tenants = await this.prisma.sysTenant.findMany({
        where: {
          status: StatusEnum.NORMAL,
          delFlag: '0',
          tenantId: { not: TenantContext.SUPER_TENANT_ID },
        },
        select: { tenantId: true, companyName: true },
      });

      this.logger.info({ action: 'tenant.syncConfig.tenantsFound', message: `找到 ${tenants.length} 个租户需要同步配置` });

      // 获取超级管理员租户的配置
      const configs = await this.prisma.sysConfig.findMany({
        where: { tenantId: TenantContext.SUPER_TENANT_ID, delFlag: '0' },
      });

      this.logger.info({ action: 'tenant.syncConfig.configsFound', message: `找到 ${configs.length} 个配置项需要同步` });

      let syncedCount = 0;
      const skippedCount = 0;

      // 为每个租户同步配置（使用批量操作）
      for (const tenant of tenants) {
        this.logger.info({ action: 'tenant.syncConfig.syncing', message: `正在为租户 ${tenant.companyName}(${tenant.tenantId}) 同步配置` });

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
              delFlag: '0',
              createBy: 'system',
              updateBy: 'system',
            })),
            skipDuplicates: true,
          });

          syncedCount += result.count;
        } catch (configError) {
          this.logger.warn(`为租户 ${tenant.tenantId} 同步配置时出错: ${configError instanceof Error ? configError.message : String(configError)}`, { action: 'tenant.syncConfig.error' });
        }

        // 清除租户配置缓存
        await this.redisService.del(`${CacheEnum.SYS_CONFIG_KEY}${tenant.tenantId}`);
      }

      this.logger.info({ action: 'tenant.syncConfig.complete', message: `配置同步完成: 新增 ${syncedCount} 个，跳过 ${skippedCount} 个` });

      return Result.ok({
        message: '同步完成',
        detail: {
          tenants: tenants.length,
          synced: syncedCount,
          skipped: skippedCount,
        },
      });
    } catch (error) {
      this.logger.error('同步租户配置失败', { action: 'tenant.syncConfig.failed' });
      throw new HttpException(`同步租户配置失败: ${error instanceof Error ? error.message : String(error)}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 导出租户数据为Excel文件
   *
   * @param res - Express Response对象
   * @param body - 查询条件
   * @returns Excel文件流
   */
  @IgnoreTenant()
  async export(res: Response, body: ListTenantRequestDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '租户数据',
      data: ((list.data as { rows?: unknown[] })?.rows ?? []) as unknown as Record<string, unknown>[],
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

  /**
   * 获取可切换的租户列表
   *
   * 仅超级管理员可用，返回所有正常状态的租户列表
   *
   * @param user - 当前登录用户
   * @returns 可切换租户列表
   * @throws {BusinessException} 当非超级管理员调用时抛出异常
   */
  @IgnoreTenant()
  async getSelectList(user: UserType) {
    // 验证是否为超级管理员
    if (user.user.tenantId !== TenantContext.SUPER_TENANT_ID) {
      throw new BusinessException(ResponseCode.FORBIDDEN, '仅超级管理员可切换租户');
    }

    const tenants = await this.prisma.sysTenant.findMany({
      where: {
        status: StatusEnum.NORMAL,
        delFlag: '0',
      },
      select: {
        tenantId: true,
        companyName: true,
        status: true,
      },
      orderBy: { createTime: 'desc' },
    });

    return Result.ok({
      list: tenants,
    });
  }

  /**
   * 切换到指定租户
   *
   * 仅超级管理员可用，切换后会将原租户信息存储到Redis
   *
   * @param targetTenantId - 目标租户ID
   * @param user - 当前登录用户
   * @returns 切换结果
   * @throws {BusinessException} 当非超级管理员调用或目标租户不存在时抛出异常
   */
  @IgnoreTenant()
  async switchTenant(targetTenantId: string, user: UserType) {
    // 验证是否为超级管理员
    if (user.user.tenantId !== TenantContext.SUPER_TENANT_ID) {
      throw new BusinessException(ResponseCode.FORBIDDEN, '仅超级管理员可切换租户');
    }

    // 验证目标租户是否存在且正常
    const targetTenant = await this.prisma.sysTenant.findFirst({
      where: {
        tenantId: targetTenantId,
        status: StatusEnum.NORMAL,
        delFlag: '0',
      },
    });

    if (!targetTenant) {
      throw new BusinessException(ResponseCode.NOT_FOUND, '目标租户不存在或已停用');
    }

    // 获取当前用户的原租户信息
    const originalTenantId = user.user.tenantId;
    const originalTenant = await this.prisma.sysTenant.findFirst({
      where: { tenantId: originalTenantId },
    });

    // 存储原租户信息到Redis（用于恢复）
    const switchOriginal: TenantSwitchOriginal = {
      originalTenantId,
      originalCompanyName: originalTenant?.companyName || '超级管理员',
      switchedAt: new Date(),
    };

    const redisKey = `${CacheEnum.TENANT_SWITCH_ORIGINAL_KEY}${user.token}`;
    await this.redisService.set(redisKey, switchOriginal, 24 * 60 * 60); // 24小时过期

    // 更新Redis中的用户信息，切换租户上下文
    const loginKey = `${CacheEnum.LOGIN_TOKEN_KEY}${user.token}`;
    const userData = await this.redisService.get(loginKey);
    if (userData) {
      userData.user.tenantId = targetTenantId;
      userData.switchedTenantId = targetTenantId;
      userData.switchedCompanyName = targetTenant.companyName;
      await this.redisService.set(loginKey, userData);
    }

    this.logger.info({ action: 'tenant.switch', message: `用户 ${user.userName} 从租户 ${originalTenantId} 切换到租户 ${targetTenantId}` });

    return Result.ok({
      success: true,
      tenantId: targetTenantId,
      companyName: targetTenant.companyName,
      originalTenantId,
    });
  }

  /**
   * 恢复到原租户
   *
   * 清除租户切换状态，恢复到原租户上下文
   *
   * @param user - 当前登录用户
   * @returns 恢复结果
   * @throws {BusinessException} 当没有切换记录时抛出异常
   */
  @IgnoreTenant()
  async restoreTenant(user: UserType) {
    // 获取原租户信息
    const redisKey = `${CacheEnum.TENANT_SWITCH_ORIGINAL_KEY}${user.token}`;
    const switchOriginal = (await this.redisService.get(redisKey)) as TenantSwitchOriginal | null;

    if (!switchOriginal) {
      throw new BusinessException(ResponseCode.BAD_REQUEST, '没有租户切换记录');
    }

    // 更新Redis中的用户信息，恢复原租户上下文
    const loginKey = `${CacheEnum.LOGIN_TOKEN_KEY}${user.token}`;
    const userData = await this.redisService.get(loginKey);
    if (userData) {
      userData.user.tenantId = switchOriginal.originalTenantId;
      delete userData.switchedTenantId;
      delete userData.switchedCompanyName;
      await this.redisService.set(loginKey, userData);
    }

    // 删除切换记录
    await this.redisService.del(redisKey);

    this.logger.info({ action: 'tenant.restore', message: `用户 ${user.userName} 恢复到原租户 ${switchOriginal.originalTenantId}` });

    return Result.ok({
      success: true,
      originalTenantId: switchOriginal.originalTenantId,
      originalCompanyName: switchOriginal.originalCompanyName,
    });
  }

  /**
   * 获取当前租户切换状态
   *
   * @param user - 当前登录用户
   * @returns 切换状态信息
   */
  @IgnoreTenant()
  async getSwitchStatus(user: UserType) {
    const redisKey = `${CacheEnum.TENANT_SWITCH_ORIGINAL_KEY}${user.token}`;
    const switchOriginal = (await this.redisService.get(redisKey)) as TenantSwitchOriginal | null;

    if (!switchOriginal) {
      return Result.ok({
        isSwitched: false,
        currentTenantId: user.user.tenantId,
      });
    }

    // 获取当前切换到的租户信息
    const loginKey = `${CacheEnum.LOGIN_TOKEN_KEY}${user.token}`;
    const userData = await this.redisService.get(loginKey);

    return Result.ok({
      isSwitched: true,
      currentTenantId: userData?.user?.tenantId || user.user.tenantId,
      currentCompanyName: userData?.switchedCompanyName,
      originalTenantId: switchOriginal.originalTenantId,
      originalCompanyName: switchOriginal.originalCompanyName,
      switchedAt: switchOriginal.switchedAt,
    });
  }
}
