import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import {
  AppConfig,
  DatabaseConfig,
  RedisConfig,
  JwtConfig,
  TenantConfig,
  CryptoConfig,
  CosConfig,
  PermissionConfig,
  GeneratorConfig,
  UserConfig,
  ClientConfig,
  Configuration,
} from './types';

/**
 * 类型安全的配置服务
 *
 * @description
 * 封装 NestJS ConfigService，提供强类型访问配置的方法
 * 避免在代码中使用字符串访问配置，增强类型安全
 *
 * @example
 * ```typescript
 * constructor(private readonly appConfigService: AppConfigService) {}
 *
 * // 类型安全的方式获取配置
 * const port = this.appConfigService.app.port;
 * const dbHost = this.appConfigService.db.postgresql.host;
 * ```
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly configService: NestConfigService<Configuration, true>) {}

  /**
   * 获取完整配置对象
   */
  get all(): Configuration {
    return this.configService as any;
  }

  /**
   * 应用配置
   */
  get app(): AppConfig {
    return this.configService.get('app', { infer: true });
  }

  /**
   * 数据库配置
   */
  get db(): DatabaseConfig {
    return this.configService.get('db', { infer: true });
  }

  /**
   * Redis 配置
   */
  get redis(): RedisConfig {
    return this.configService.get('redis', { infer: true });
  }

  /**
   * JWT 配置
   */
  get jwt(): JwtConfig {
    return this.configService.get('jwt', { infer: true });
  }

  /**
   * 租户配置
   */
  get tenant(): TenantConfig {
    return this.configService.get('tenant', { infer: true });
  }

  /**
   * 加密配置
   */
  get crypto(): CryptoConfig {
    return this.configService.get('crypto', { infer: true });
  }

  /**
   * 腾讯云 COS 配置
   */
  get cos(): CosConfig {
    return this.configService.get('cos', { infer: true });
  }

  /**
   * 权限配置
   */
  get perm(): PermissionConfig {
    return this.configService.get('perm', { infer: true });
  }

  /**
   * 代码生成器配置
   */
  get gen(): GeneratorConfig {
    return this.configService.get('gen', { infer: true });
  }

  /**
   * 用户配置
   */
  get user(): UserConfig {
    return this.configService.get('user', { infer: true });
  }

  /**
   * 客户端配置
   */
  get client(): ClientConfig {
    return this.configService.get('client', { infer: true });
  }

  /**
   * 是否为生产环境
   */
  get isProduction(): boolean {
    return this.app.env === 'production';
  }

  /**
   * 是否为开发环境
   */
  get isDevelopment(): boolean {
    return this.app.env === 'development';
  }

  /**
   * 是否为测试环境
   */
  get isTest(): boolean {
    return this.app.env === 'test';
  }

  /**
   * 获取特定路径的配置值 (向后兼容)
   *
   * @deprecated 建议使用类型安全的 getter 方法
   * @param path 配置路径，如 'app.port'
   * @param defaultValue 默认值
   */
  getValue<T = any>(path: string, defaultValue?: T): T {
    return this.configService.get(path as any, defaultValue);
  }
}
