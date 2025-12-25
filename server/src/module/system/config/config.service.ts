import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { Prisma, SysConfig } from '@prisma/client';
import { Result, ResponseCode } from 'src/common/response';
import { BusinessException } from 'src/common/exceptions';
import { ExportTable } from 'src/common/utils/export';
import { FormatDateFields } from 'src/common/utils/index';
import { CreateConfigDto, UpdateConfigDto, ListConfigDto } from './dto/index';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum, DelFlagEnum } from 'src/common/enum/index';
import { Cacheable, CacheEvict } from 'src/common/decorators/redis.decorator';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigRepository } from './config.repository';
import { Transactional } from 'src/common/decorators/transactional.decorator';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly configRepo: ConfigRepository,
    private readonly systemConfigService: SystemConfigService,
  ) {}
  async create(createConfigDto: CreateConfigDto) {
    await this.configRepo.create(createConfigDto);
    return Result.ok();
  }

  async findAll(query: ListConfigDto) {
    const where: Prisma.SysConfigWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
    };

    if (query.configName) {
      where.configName = {
        contains: query.configName,
      };
    }

    if (query.configKey) {
      where.configKey = {
        contains: query.configKey,
      };
    }

    if (query.configType) {
      where.configType = query.configType;
    }

    if (query.params?.beginTime && query.params?.endTime) {
      where.createTime = {
        gte: new Date(query.params.beginTime),
        lte: new Date(query.params.endTime),
      };
    }

    const { list, total } = await this.configRepo.findPageWithFilter(where, query.skip, query.take);

    return Result.ok({
      rows: FormatDateFields(list),
      total,
    });
  }

  async findOne(configId: number) {
    const data = await this.configRepo.findById(configId);
    return Result.ok(data);
  }

  async findOneByConfigKey(configKey: string) {
    const data = await this.getConfigValue(configKey);
    return Result.ok(data);
  }

  /**
   * 根据配置键值异步查找一条配置信息（租户级）。
   *
   * @param configKey 配置的键值，用于查询配置信息。
   * @returns 返回一个结果对象，包含查询到的配置信息。如果未查询到，则返回空结果。
   */
  @Cacheable(CacheEnum.SYS_CONFIG_KEY, '{configKey}')
  async getConfigValue(configKey: string) {
    const data = await this.configRepo.findByConfigKey(configKey);
    return data?.configValue ?? null;
  }

  /**
   * 获取系统配置值（不受租户隔离影响）
   *
   * 优先从 sys_system_config 表获取，回退到超级租户配置
   * 适用于登录前、验证码等场景
   *
   * @param configKey 配置键
   * @returns 配置值
   *
   * @example
   * ```typescript
   * const enabled = await this.configService.getSystemConfigValue('sys.account.captchaEnabled');
   * ```
   */
  async getSystemConfigValue(configKey: string): Promise<string | null> {
    // 优先从系统配置表获取
    const systemValue = await this.systemConfigService.getConfigValue(configKey);
    if (systemValue !== null) {
      return systemValue;
    }

    // 回退：从租户配置表的超级租户记录获取（兼容性）
    return this.getPublicConfigValue(configKey);
  }

  /**
   * 获取公共配置值（仅从租户表的超级租户获取）
   *
   * @deprecated 使用 getSystemConfigValue() 替代
   * @param configKey 配置键
   * @returns 配置值
   */
  async getPublicConfigValue(configKey: string): Promise<string | null> {
    // 使用原生SQL直接查询，完全绕过租户扩展和缓存机制
    const config = await this.prisma.$queryRaw<Array<{ config_value: string }>>`
      SELECT config_value 
      FROM sys_config 
      WHERE config_key = ${configKey}
        AND tenant_id = '000000'
        AND del_flag = '0'
      LIMIT 1
    `;

    return config.length > 0 ? config[0].config_value : null;
  }

  @CacheEvict(CacheEnum.SYS_CONFIG_KEY, '{updateConfigDto.configKey}')
  async update(updateConfigDto: UpdateConfigDto) {
    await this.configRepo.update(updateConfigDto.configId, updateConfigDto);
    return Result.ok();
  }

  /**
   * 根据Key更新配置
   */
  @Transactional()
  async updateByKey(updateConfigDto: UpdateConfigDto) {
    const config = await this.configRepo.findByConfigKey(updateConfigDto.configKey);
    BusinessException.throwIfNull(config, '参数不存在', ResponseCode.DATA_NOT_FOUND);
    await this.configRepo.update(config.configId, {
      configValue: updateConfigDto.configValue,
    });
    return Result.ok();
  }

  @Transactional()
  async remove(configIds: number[]) {
    const list = await this.configRepo.findMany({
      where: {
        configId: {
          in: configIds,
        },
      },
      select: {
        configType: true,
        configKey: true,
      },
    });
    const item = list.find((item) => item.configType === 'Y');
    BusinessException.throwIf(
      item !== undefined,
      `内置参数【${item?.configKey}】不能删除`,
      ResponseCode.OPERATION_FAILED,
    );
    const data = await this.configRepo.softDeleteBatch(configIds);
    return Result.ok(data);
  }

  /**
   * 导出参数管理数据为xlsx
   * @param res
   */
  async export(res: Response, body: ListConfigDto) {
    delete body.pageNum;
    delete body.pageSize;
    const list = await this.findAll(body);
    const options = {
      sheetName: '参数管理',
      data: list.data.rows,
      header: [
        { title: '参数主键', dataIndex: 'configId' },
        { title: '参数名称', dataIndex: 'configName' },
        { title: '参数键名', dataIndex: 'configKey' },
        { title: '参数键值', dataIndex: 'configValue' },
        { title: '系统内置', dataIndex: 'configType' },
      ],
      dictMap: {
        configType: {
          Y: '是',
          N: '否',
        },
      },
    };
    return await ExportTable(options, res);
  }

  /**
   * 刷新系统配置缓存
   * @returns
   */
  async resetConfigCache() {
    await this.clearConfigCache();
    await this.loadingConfigCache();
    return Result.ok();
  }

  /**
   * 删除系统配置缓存
   * @returns
   */
  @CacheEvict(CacheEnum.SYS_CONFIG_KEY, '*')
  async clearConfigCache() {}

  /**
   * 加载系统配置缓存
   * @returns
   */
  async loadingConfigCache() {
    const list = await this.configRepo.findMany({
      where: { delFlag: DelFlagEnum.NORMAL },
    });
    list.forEach((item) => {
      if (item.configKey) {
        this.redisService.set(`${CacheEnum.SYS_CONFIG_KEY}${item.configKey}`, item.configValue);
      }
    });
  }
}
