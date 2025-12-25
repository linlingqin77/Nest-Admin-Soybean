import { IsBoolean, IsOptional, IsString } from 'class-validator';

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
}
