import { IsOptional, IsString } from 'class-validator';

/**
 * 腾讯云 COS 配置
 */
export class CosConfig {
  @IsString()
  @IsOptional()
  secretId: string;

  @IsString()
  @IsOptional()
  secretKey: string;

  @IsString()
  @IsOptional()
  bucket: string;

  @IsString()
  @IsOptional()
  region: string;

  @IsString()
  @IsOptional()
  domain: string;

  @IsString()
  @IsOptional()
  location: string;
}
