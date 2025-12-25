import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

/**
 * 租户配置
 */
export class TenantConfig {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @IsNotEmpty()
  superTenantId: string;

  @IsString()
  @IsNotEmpty()
  defaultTenantId: string;
}
