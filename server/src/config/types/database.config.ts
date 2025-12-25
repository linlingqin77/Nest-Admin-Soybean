import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * PostgreSQL 数据库配置
 */
export class PostgresqlConfig {
  @IsString()
  @IsNotEmpty()
  host: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  port: number;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsNotEmpty()
  database: string;

  @IsString()
  @IsOptional()
  schema: string;

  @IsBoolean()
  @IsOptional()
  ssl: boolean;
}

/**
 * 数据库配置
 */
export class DatabaseConfig {
  @ValidateNested()
  @Type(() => PostgresqlConfig)
  postgresql: PostgresqlConfig;
}
