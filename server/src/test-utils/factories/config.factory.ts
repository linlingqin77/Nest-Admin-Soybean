import { SysConfig, Status, DelFlag } from '@prisma/client';
import { BaseFactory } from './base.factory';

/**
 * 配置测试数据工厂
 * 
 * @description
 * 提供创建 SysConfig 测试数据的方法
 * 
 * @example
 * ```typescript
 * const config = ConfigFactory.create({ configKey: 'test.key' });
 * const configs = ConfigFactory.createMany(5);
 * ```
 */
export class ConfigFactory extends BaseFactory<SysConfig> {
  protected getDefaults(): SysConfig {
    return {
      configId: 1,
      tenantId: '000000',
      configName: '测试配置',
      configKey: 'test.config.key',
      configValue: 'test_value',
      configType: 'Y',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
      status: Status.NORMAL,
      delFlag: DelFlag.NORMAL,
    };
  }

  protected getSequentialOverrides(index: number): Partial<SysConfig> {
    return {
      configId: index + 1,
      configName: `测试配置${index + 1}`,
      configKey: `test.config.key${index + 1}`,
      configValue: `test_value_${index + 1}`,
    };
  }

  /**
   * 创建系统内置配置
   */
  static createSystemConfig(overrides?: Partial<SysConfig>): SysConfig {
    const factory = new ConfigFactory();
    return factory.create({
      configType: 'Y',
      ...overrides,
    });
  }

  /**
   * 创建用户自定义配置
   */
  static createUserConfig(overrides?: Partial<SysConfig>): SysConfig {
    const factory = new ConfigFactory();
    return factory.create({
      configType: 'N',
      ...overrides,
    });
  }

  /**
   * 创建验证码配置
   */
  static createCaptchaConfig(overrides?: Partial<SysConfig>): SysConfig {
    const factory = new ConfigFactory();
    return factory.create({
      configName: '验证码开关',
      configKey: 'sys.account.captchaEnabled',
      configValue: 'true',
      configType: 'Y',
      ...overrides,
    });
  }

  /**
   * 创建初始密码配置
   */
  static createInitPasswordConfig(overrides?: Partial<SysConfig>): SysConfig {
    const factory = new ConfigFactory();
    return factory.create({
      configName: '用户初始密码',
      configKey: 'sys.user.initPassword',
      configValue: '123456',
      configType: 'Y',
      ...overrides,
    });
  }

  /**
   * 创建文件上传配置
   */
  static createUploadConfig(overrides?: Partial<SysConfig>): SysConfig {
    const factory = new ConfigFactory();
    return factory.create({
      configName: '文件上传路径',
      configKey: 'sys.upload.path',
      configValue: '/upload',
      configType: 'Y',
      ...overrides,
    });
  }

  /**
   * 创建禁用配置
   */
  static createDisabledConfig(overrides?: Partial<SysConfig>): SysConfig {
    const factory = new ConfigFactory();
    return factory.create({
      status: Status.DISABLED,
      ...overrides,
    });
  }

  /**
   * 创建已删除配置
   */
  static createDeletedConfig(overrides?: Partial<SysConfig>): SysConfig {
    const factory = new ConfigFactory();
    return factory.create({
      delFlag: DelFlag.DELETED,
      ...overrides,
    });
  }

  /**
   * 创建多租户配置
   */
  static createTenantConfig(tenantId: string, overrides?: Partial<SysConfig>): SysConfig {
    const factory = new ConfigFactory();
    return factory.create({
      tenantId,
      ...overrides,
    });
  }

  /**
   * 创建单个配置（静态方法）
   */
  static create(overrides?: Partial<SysConfig>): SysConfig {
    const factory = new ConfigFactory();
    return factory.create(overrides);
  }

  /**
   * 批量创建配置（静态方法）
   */
  static createMany(count: number, overrides?: Partial<SysConfig>): SysConfig[] {
    const factory = new ConfigFactory();
    return factory.createMany(count, overrides);
  }

  /**
   * 创建带关联的配置（静态方法）
   */
  static createWithRelations(relations: Record<string, any>): SysConfig {
    const factory = new ConfigFactory();
    return factory.createWithRelations(relations);
  }
}
