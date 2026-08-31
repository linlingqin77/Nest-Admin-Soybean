import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Redis 配置
 */
export class RedisConfig {
  @IsString()
  @IsNotEmpty()
  host: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @IsString()
  @IsOptional()
  password: string;

  @IsNumber()
  @Min(0)
  @Max(15)
  db: number;

  @IsString()
  @IsOptional()
  keyPrefix: string;
}
