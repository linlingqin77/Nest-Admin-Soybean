import { applyDecorators, Controller, Version } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * API 版本常量
 * 用于统一管理 API 版本号
 */
export const API_VERSIONS = {
  V1: '1',
  V2: '2',
} as const;

export type ApiVersion = (typeof API_VERSIONS)[keyof typeof API_VERSIONS];

/**
 * 版本化控制器装饰器
 * 结合 @Controller 和 @Version 装饰器，简化版本化 API 的定义
 *
 * @param path - 控制器路径
 * @param version - API 版本号，默认为 v1
 * @returns 组合装饰器
 *
 * @example
 * // 创建 v1 版本的用户控制器
 * @VersionedController('system/user')
 * export class UserController { }
 *
 * // 创建 v2 版本的用户控制器
 * @VersionedController('system/user', API_VERSIONS.V2)
 * export class UserV2Controller { }
 */
export function VersionedController(path: string, version: ApiVersion = API_VERSIONS.V1) {
  return applyDecorators(Controller({ path, version }));
}

/**
 * 版本化控制器装饰器（带 API 标签）
 * 结合 @Controller、@Version 和 @ApiTags 装饰器
 *
 * @param path - 控制器路径
 * @param tag - Swagger API 标签
 * @param version - API 版本号，默认为 v1
 * @returns 组合装饰器
 *
 * @example
 * // 创建带标签的 v1 版本用户控制器
 * @VersionedControllerWithTag('system/user', '用户管理')
 * export class UserController { }
 *
 * // 创建带标签的 v2 版本用户控制器
 * @VersionedControllerWithTag('system/user', '用户管理 V2', API_VERSIONS.V2)
 * export class UserV2Controller { }
 */
export function VersionedControllerWithTag(path: string, tag: string, version: ApiVersion = API_VERSIONS.V1) {
  return applyDecorators(Controller({ path, version }), ApiTags(`${tag} (v${version})`));
}

/**
 * 多版本控制器装饰器
 * 支持同一控制器响应多个版本的请求
 *
 * @param path - 控制器路径
 * @param versions - 支持的版本数组
 * @returns 组合装饰器
 *
 * @example
 * // 创建同时支持 v1 和 v2 的控制器
 * @MultiVersionController('system/user', [API_VERSIONS.V1, API_VERSIONS.V2])
 * export class UserController { }
 */
export function MultiVersionController(path: string, versions: ApiVersion[]) {
  return applyDecorators(Controller({ path, version: versions }));
}

/**
 * 版本中立控制器装饰器
 * 创建不受版本控制影响的控制器（如健康检查、指标等）
 *
 * @param path - 控制器路径
 * @returns 组合装饰器
 *
 * @example
 * // 创建版本中立的健康检查控制器
 * @VersionNeutralController('health')
 * export class HealthController { }
 */
export function VersionNeutralController(path: string) {
  return applyDecorators(Controller({ path, version: VERSION_NEUTRAL }));
}

// 导出 NestJS 的 VERSION_NEUTRAL 常量
import { VERSION_NEUTRAL } from '@nestjs/common';
export { VERSION_NEUTRAL };
