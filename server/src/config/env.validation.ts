import { plainToInstance } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
  Matches,
  MinLength,
} from 'class-validator';

/**
 * 环境变量验证类
 *
 * @description
 * 这个类定义了必需的环境变量及其验证规则
 * 在应用启动时自动验证，确保环境配置正确
 *
 * 验证规则：
 * - 必需字段使用 @IsNotEmpty() 或不加 @IsOptional()
 * - 可选字段使用 @IsOptional()
 * - 类型验证使用 @IsString(), @IsNumber(), @IsBoolean() 等
 * - 枚举验证使用 @IsIn([...])
 * - 自定义验证使用 @Matches() 或自定义装饰器
 */
class EnvironmentVariables {
  // ==================== 核心配置 ====================

  @IsIn(['development', 'test', 'production'])
  NODE_ENV: string;

  @IsString()
  DATABASE_URL: string;

  // ==================== 应用配置 ====================

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  APP_PORT?: number;

  @IsOptional()
  @IsString()
  APP_PREFIX?: string;

  // ==================== 日志配置 ====================

  @IsOptional()
  @IsString()
  LOG_DIR?: string;

  @IsOptional()
  @IsIn(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
  LOG_LEVEL?: string;

  @IsOptional()
  @IsBoolean()
  LOG_PRETTY_PRINT?: boolean;

  @IsOptional()
  @IsBoolean()
  LOG_TO_FILE?: boolean;

  @IsOptional()
  @IsString()
  LOG_EXCLUDE_PATHS?: string;

  @IsOptional()
  @IsString()
  LOG_SENSITIVE_FIELDS?: string;

  // ==================== 文件上传配置 ====================

  @IsOptional()
  @IsBoolean()
  FILE_IS_LOCAL?: boolean;

  @IsOptional()
  @IsString()
  FILE_UPLOAD_LOCATION?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(200)
  FILE_MAX_SIZE?: number;

  @IsOptional()
  @IsString()
  FILE_DOMAIN?: string;

  @IsOptional()
  @IsString()
  FILE_SERVE_ROOT?: string;

  @IsOptional()
  @IsBoolean()
  FILE_THUMBNAIL_ENABLED?: boolean;

  // ==================== 数据库配置 ====================

  @IsOptional()
  @IsString()
  DB_HOST?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  DB_PORT?: number;

  @IsOptional()
  @IsString()
  DB_USERNAME?: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD?: string;

  @IsOptional()
  @IsString()
  DB_DATABASE?: string;

  @IsOptional()
  @IsString()
  DB_SCHEMA?: string;

  @IsOptional()
  @IsBoolean()
  DB_SSL?: boolean;

  // ==================== Redis 配置 ====================

  @IsOptional()
  @IsString()
  REDIS_HOST?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  REDIS_PORT?: number;

  @IsOptional()
  @IsString()
  REDIS_PASSWORD?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(15)
  REDIS_DB?: number;

  @IsOptional()
  @IsString()
  REDIS_KEY_PREFIX?: string;

  // ==================== JWT 配置 ====================

  @IsOptional()
  @IsString()
  @MinLength(16)
  JWT_SECRET?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+[smhd]$/, {
    message: 'JWT_EXPIRES_IN must be a valid time string (e.g., 1h, 30m, 7d)',
  })
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d+[smhd]$/, {
    message: 'JWT_REFRESH_EXPIRES_IN must be a valid time string (e.g., 2h, 1d)',
  })
  JWT_REFRESH_EXPIRES_IN?: string;

  // ==================== 租户配置 ====================

  @IsOptional()
  @IsBoolean()
  TENANT_ENABLED?: boolean;

  @IsOptional()
  @IsString()
  TENANT_SUPER_ID?: string;

  @IsOptional()
  @IsString()
  TENANT_DEFAULT_ID?: string;

  // ==================== 加密配置 ====================

  @IsOptional()
  @IsBoolean()
  CRYPTO_ENABLED?: boolean;

  @IsOptional()
  @IsString()
  CRYPTO_RSA_PUBLIC_KEY?: string;

  @IsOptional()
  @IsString()
  CRYPTO_RSA_PRIVATE_KEY?: string;

  // ==================== COS 配置 ====================

  @IsOptional()
  @IsString()
  COS_SECRET_ID?: string;

  @IsOptional()
  @IsString()
  COS_SECRET_KEY?: string;

  @IsOptional()
  @IsString()
  COS_BUCKET?: string;

  @IsOptional()
  @IsString()
  COS_REGION?: string;

  @IsOptional()
  @IsString()
  COS_DOMAIN?: string;

  @IsOptional()
  @IsString()
  COS_LOCATION?: string;

  // ==================== 权限配置 ====================

  @IsOptional()
  @IsString()
  PERM_WHITELIST?: string;

  // ==================== 代码生成配置 ====================

  @IsOptional()
  @IsString()
  GEN_AUTHOR?: string;

  @IsOptional()
  @IsString()
  GEN_PACKAGE_NAME?: string;

  @IsOptional()
  @IsString()
  GEN_MODULE_NAME?: string;

  @IsOptional()
  @IsBoolean()
  GEN_AUTO_REMOVE_PRE?: boolean;

  @IsOptional()
  @IsString()
  GEN_TABLE_PREFIX?: string;

  // ==================== 用户配置 ====================

  @IsOptional()
  @IsString()
  @MinLength(6)
  USER_INITIAL_PASSWORD?: string;

  // ==================== 客户端配置 ====================

  @IsOptional()
  @IsString()
  CLIENT_DEFAULT_ID?: string;

  @IsOptional()
  @IsIn(['password', 'authorization_code', 'client_credentials', 'refresh_token'])
  CLIENT_DEFAULT_GRANT_TYPE?: string;
}

/**
 * 环境变量验证函数
 *
 * @description
 * 在应用启动时由 ConfigModule 调用
 * 验证失败会抛出异常并阻止应用启动
 *
 * @param config 原始环境变量对象
 * @returns 验证后的环境变量对象
 * @throws Error 如果验证失败
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => `  - ${error.property}: ${Object.values(error.constraints || {}).join(', ')}`)
      .join('\n');

    throw new Error(`环境变量验证失败:\n${messages}\n\n请检查 .env.${process.env.NODE_ENV || 'development'} 文件`);
  }

  return validatedConfig;
}
