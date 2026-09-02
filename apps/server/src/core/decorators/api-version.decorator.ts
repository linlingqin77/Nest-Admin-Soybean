import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiResponse, ApiTags } from '@nestjs/swagger';
import { API_VERSION } from 'src/shared/constants/api-version';

/**
 * API 版本控制装饰器元数据键
 */
export const API_VERSION_KEY = 'api:version';
export const API_DEPRECATED_KEY = 'api:deprecated';
export const API_SUNSET_KEY = 'api:sunset';

/**
 * API 版本配置
 */
export interface ApiVersionConfig {
  /** API 版本 (例如: '1', '2') */
  version: string;
  /** 是否已废弃 */
  deprecated?: boolean;
  /** 下线日期 (YYYY-MM-DD 格式) */
  sunsetDate?: string;
  /** 替代方案说明 */
  alternative?: string;
}

/**
 * API 版本装饰器
 *
 * 用于标记 Controller 或方法的 API 版本信息。
 * 配合 NestJS 的版本控制功能使用。
 *
 * @example
 * ```typescript
 * // Controller 级别版本控制
 * @Controller('users')
 * @ApiVersion({ version: '1' })
 * export class UserControllerV1 {}
 *
 * // 方法级别版本控制（废弃版本）
 * @Get()
 * @ApiVersion({
 *   version: '1',
 *   deprecated: true,
 *   sunsetDate: '2025-06-01',
 *   alternative: '请使用 v2 版本的 GET /users 接口'
 * })
 * findAll() {}
 * ```
 */
export function ApiVersion(config: ApiVersionConfig) {
  const decorators: Array<ClassDecorator | MethodDecorator | PropertyDecorator> = [
    SetMetadata(API_VERSION_KEY, config.version),
    SetMetadata(API_DEPRECATED_KEY, config.deprecated ?? false),
  ];

  // 添加废弃警告头
  if (config.deprecated) {
    decorators.push(
      ApiHeader({
        name: 'Deprecation',
        description: '此 API 已废弃',
        required: false,
        example: config.sunsetDate ? `date="${config.sunsetDate}"` : 'true',
      }) as MethodDecorator,
    );

    if (config.sunsetDate) {
      decorators.push(SetMetadata(API_SUNSET_KEY, config.sunsetDate));
      decorators.push(
        ApiHeader({
          name: 'Sunset',
          description: 'API 下线日期',
          required: false,
          example: config.sunsetDate,
        }) as MethodDecorator,
      );
    }
  }

  return applyDecorators(...decorators);
}

/**
 * 标记 API 为废弃状态
 *
 * @example
 * ```typescript
 * @Get()
 * @ApiDeprecated('2025-06-01', '请使用 v2 版本的 GET /users 接口')
 * findAllV1() {}
 * ```
 */
export function ApiDeprecated(sunsetDate?: string, alternative?: string) {
  return ApiVersion({
    version: API_VERSION.V1,
    deprecated: true,
    sunsetDate,
    alternative,
  });
}

/**
 * 标准化的 API Controller 装饰器组合
 *
 * 包含常用的 Swagger 装饰器组合。
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @ApiController('用户管理', '1')
 * export class UserController {}
 * ```
 */
export function ApiController(tagName: string, version: string = API_VERSION.V1) {
  return applyDecorators(
    ApiTags(tagName),
    ApiBearerAuth('Authorization'),
    ApiVersion({ version }),
    ApiResponse({ status: 200, description: '操作成功' }),
    ApiResponse({ status: 400, description: '参数验证失败' }),
    ApiResponse({ status: 401, description: '未授权访问' }),
    ApiResponse({ status: 403, description: '权限不足' }),
    ApiResponse({ status: 500, description: '服务器内部错误' }),
  );
}

/**
 * API 变更日志装饰器
 *
 * 用于记录 API 的变更历史。
 *
 * @example
 * ```typescript
 * @ApiChangelog([
 *   { version: '2.0.0', date: '2024-01-01', changes: ['新增分页参数', '移除 limit 参数'] },
 *   { version: '1.0.0', date: '2023-01-01', changes: ['初始版本'] },
 * ])
 * ```
 */
export interface ApiChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export const API_CHANGELOG_KEY = 'api:changelog';

export function ApiChangelog(entries: ApiChangelogEntry[]) {
  return SetMetadata(API_CHANGELOG_KEY, entries);
}
