import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { AppConfig } from './app.config';
import { DatabaseConfig } from './database.config';
import { RedisConfig } from './redis.config';
import { JwtConfig } from './jwt.config';
import { TenantConfig } from './tenant.config';
import { CryptoConfig } from './crypto.config';
import { CosConfig } from './cos.config';
import { PermissionConfig } from './permission.config';
import { GeneratorConfig } from './generator.config';
import { UserConfig } from './user.config';
import { ClientConfig } from './client.config';

/**
 * 完整的应用配置接口
 */
export class Configuration {
  @ValidateNested()
  @Type(() => AppConfig)
  app: AppConfig;

  @ValidateNested()
  @Type(() => DatabaseConfig)
  db: DatabaseConfig;

  @ValidateNested()
  @Type(() => RedisConfig)
  redis: RedisConfig;

  @ValidateNested()
  @Type(() => JwtConfig)
  jwt: JwtConfig;

  @ValidateNested()
  @Type(() => TenantConfig)
  tenant: TenantConfig;

  @ValidateNested()
  @Type(() => CryptoConfig)
  crypto: CryptoConfig;

  @ValidateNested()
  @Type(() => CosConfig)
  cos: CosConfig;

  @ValidateNested()
  @Type(() => PermissionConfig)
  perm: PermissionConfig;

  @ValidateNested()
  @Type(() => GeneratorConfig)
  gen: GeneratorConfig;

  @ValidateNested()
  @Type(() => UserConfig)
  user: UserConfig;

  @ValidateNested()
  @Type(() => ClientConfig)
  client: ClientConfig;
}

// 导出所有配置类型
export * from './app.config';
export * from './database.config';
export * from './redis.config';
export * from './jwt.config';
export * from './tenant.config';
export * from './crypto.config';
export * from './cos.config';
export * from './permission.config';
export * from './generator.config';
export * from './user.config';
export * from './client.config';
