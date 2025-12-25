import { Injectable } from '@nestjs/common';
import { SystemPrismaService } from 'src/common/prisma/system-prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { SystemCacheable, ClearSystemCache } from 'src/common/decorators/system-cache.decorator';
import { SysSystemConfig } from '@prisma/client';

/**
 * SystemConfigService - 系统级配置服务
 *
 * 管理全局系统配置，这些配置不受租户隔离影响
 *
 * 特性：
 * 1. 使用 SystemPrismaService（无租户扩展）
 * 2. 使用 @SystemCacheable 装饰器（缓存键不包含 tenant_id）
 * 3. 提供 CRUD 操作和缓存管理
 *
 * 适用场景：
 * - 验证码开关 (sys.account.captchaEnabled)
 * - 系统级功能开关
 * - 全局参数配置
 * - 平台级业务规则
 */
@Injectable()
export class SystemConfigService {
  constructor(
    private readonly systemPrisma: SystemPrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 获取系统配置值
   *
   * @param configKey 配置键
   * @returns 配置值，不存在返回 null
   *
   * @example
   * ```typescript
   * const enabled = await this.systemConfigService.getConfigValue('sys.account.captchaEnabled');
   * // enabled: 'true' | 'false' | null
   * ```
   */
  // @SystemCacheable({
  //   key: (args) => `system:config:${args[0]}`,
  //   ttl: 3600, // 1小时
  // })
  async getConfigValue(configKey: string): Promise<string | null> {
    const config = await this.systemPrisma.sysSystemConfig.findFirst({
      where: {
        configKey,
        delFlag: '0',
        status: '0',
      },
    });

    return config?.configValue || null;
  }

  /**
   * 获取系统配置对象
   *
   * @param configKey 配置键
   * @returns 完整的配置对象
   */
  @SystemCacheable({
    key: (args) => `system:config:detail:${args[0]}`,
    ttl: 3600,
  })
  async getConfig(configKey: string): Promise<SysSystemConfig | null> {
    return this.systemPrisma.sysSystemConfig.findFirst({
      where: {
        configKey,
        delFlag: '0',
      },
    });
  }

  /**
   * 获取所有系统配置
   *
   * @returns 所有有效的系统配置列表
   */
  @SystemCacheable({
    key: () => 'system:config:all',
    ttl: 1800, // 30分钟
  })
  async getAllConfigs(): Promise<SysSystemConfig[]> {
    return this.systemPrisma.sysSystemConfig.findMany({
      where: {
        delFlag: '0',
        status: '0',
      },
      orderBy: {
        createTime: 'desc',
      },
    });
  }

  /**
   * 根据配置类型获取配置列表
   *
   * @param configType 配置类型 (Y=系统内置, N=自定义)
   * @returns 指定类型的配置列表
   */
  @SystemCacheable({
    key: (args) => `system:config:type:${args[0]}`,
    ttl: 1800,
  })
  async getConfigsByType(configType: string): Promise<SysSystemConfig[]> {
    return this.systemPrisma.sysSystemConfig.findMany({
      where: {
        configType,
        delFlag: '0',
        status: '0',
      },
      orderBy: {
        createTime: 'desc',
      },
    });
  }

  /**
   * 创建系统配置
   *
   * @param data 配置数据
   * @returns 创建的配置对象
   */
  @ClearSystemCache(['system:config:*'])
  async createConfig(data: {
    configName: string;
    configKey: string;
    configValue: string;
    configType: string;
    remark?: string;
    createBy?: string;
  }): Promise<SysSystemConfig> {
    return this.systemPrisma.sysSystemConfig.create({
      data: {
        ...data,
        status: '0',
        delFlag: '0',
        createBy: data.createBy || 'system',
        updateBy: data.createBy || 'system',
      },
    });
  }

  /**
   * 更新系统配置
   *
   * @param configKey 配置键
   * @param data 更新数据
   * @returns 更新后的配置对象
   */
  @ClearSystemCache(['system:config:*'])
  async updateConfig(
    configKey: string,
    data: {
      configValue?: string;
      configName?: string;
      remark?: string;
      status?: string;
      updateBy?: string;
    },
  ): Promise<SysSystemConfig> {
    return this.systemPrisma.sysSystemConfig.update({
      where: { configKey },
      data: {
        ...data,
        updateBy: data.updateBy || 'system',
        updateTime: new Date(),
      },
    });
  }

  /**
   * 删除系统配置（软删除）
   *
   * @param configKey 配置键
   * @param deleteBy 删除操作人
   * @returns 删除后的配置对象
   */
  @ClearSystemCache(['system:config:*'])
  async deleteConfig(configKey: string, deleteBy?: string): Promise<SysSystemConfig> {
    return this.systemPrisma.sysSystemConfig.update({
      where: { configKey },
      data: {
        delFlag: '2',
        updateBy: deleteBy || 'system',
        updateTime: new Date(),
      },
    });
  }

  /**
   * 批量更新系统配置
   *
   * @param configs 配置键值对数组
   * @returns 更新的配置数量
   */
  @ClearSystemCache(['system:config:*'])
  async batchUpdateConfigs(
    configs: Array<{ configKey: string; configValue: string }>,
    updateBy?: string,
  ): Promise<number> {
    const promises = configs.map((config) =>
      this.systemPrisma.sysSystemConfig.update({
        where: { configKey: config.configKey },
        data: {
          configValue: config.configValue,
          updateBy: updateBy || 'system',
          updateTime: new Date(),
        },
      }),
    );

    const results = await Promise.all(promises);
    return results.length;
  }

  /**
   * 刷新配置缓存
   *
   * @param configKey 可选，指定要刷新的配置键，不传则刷新所有
   */
  async refreshCache(configKey?: string): Promise<void> {
    if (configKey) {
      // 刷新单个配置的缓存
      await this.redisService.del(`system:config:${configKey}`);
      await this.redisService.del(`system:config:detail:${configKey}`);
    } else {
      // 刷新所有系统配置缓存
      const keys = await this.redisService.keys('system:config:*');
      if (keys && keys.length > 0) {
        await this.redisService.del(keys);
      }
    }
  }

  /**
   * 检查配置键是否存在
   *
   * @param configKey 配置键
   * @returns 是否存在
   */
  async isConfigExists(configKey: string): Promise<boolean> {
    const count = await this.systemPrisma.sysSystemConfig.count({
      where: {
        configKey,
        delFlag: '0',
      },
    });
    return count > 0;
  }
}
