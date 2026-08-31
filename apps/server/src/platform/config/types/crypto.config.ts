import { IsBoolean, IsOptional, IsString, IsNumber, Min } from 'class-validator';

/**
 * 加密配置
 */
export class CryptoConfig {
  @IsBoolean()
  enabled: boolean;

  @IsString()
  @IsOptional()
  rsaPublicKey: string;

  @IsString()
  @IsOptional()
  rsaPrivateKey: string;

  /**
   * Nonce过期时间（毫秒），默认5分钟
   */
  @IsNumber()
  @Min(1000) // 最少1秒
  @IsOptional()
  nonceTtl?: number;

  /**
   * 时间戳允许的最大偏差（毫秒），默认5分钟
   */
  @IsNumber()
  @Min(1000) // 最少1秒
  @IsOptional()
  timestampTolerance?: number;
}
