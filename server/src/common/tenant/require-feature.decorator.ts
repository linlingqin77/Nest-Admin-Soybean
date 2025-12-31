import { SetMetadata, applyDecorators, UseGuards, Type } from '@nestjs/common';

/**
 * 功能开关元数据键
 */
export const REQUIRE_FEATURE_KEY = 'requireFeature';

/**
 * 功能开关配置接口
 */
export interface RequireFeatureOptions {
  /**
   * 功能键
   */
  feature: string;

  /**
   * 功能未启用时的错误消息
   */
  message?: string;
}

/**
 * 要求租户功能开关装饰器 (需求 5.1)
 *
 * 使用此装饰器的方法或控制器将检查租户是否启用了指定功能
 * 如果功能未启用，将返回 403 Forbidden 错误
 *
 * 注意：使用此装饰器时，需要确保 RequireFeatureGuard 已在模块中注册
 *
 * @param featureOrOptions 功能键或配置对象
 * @param guardClass 可选的守卫类（用于避免循环依赖）
 *
 * @example
 * ```typescript
 * // 简单用法 - 需要在控制器或方法上同时使用 @UseGuards(RequireFeatureGuard)
 * @RequireFeature('advanced-analytics')
 * @UseGuards(RequireFeatureGuard)
 * @Get('analytics')
 * getAnalytics() {
 *   // 只有启用了 advanced-analytics 功能的租户才能访问
 * }
 *
 * // 带自定义消息
 * @RequireFeature({ feature: 'export', message: '导出功能未启用，请联系管理员' })
 * @UseGuards(RequireFeatureGuard)
 * @Get('export')
 * exportData() {
 *   // 只有启用了 export 功能的租户才能访问
 * }
 * ```
 */
export function RequireFeature(featureOrOptions: string | RequireFeatureOptions) {
  const options: RequireFeatureOptions =
    typeof featureOrOptions === 'string' ? { feature: featureOrOptions } : featureOrOptions;

  return SetMetadata(REQUIRE_FEATURE_KEY, options);
}

/**
 * 组合装饰器：设置功能要求并应用守卫
 *
 * @param featureOrOptions 功能键或配置对象
 * @param guardClass 守卫类
 *
 * @example
 * ```typescript
 * import { RequireFeatureGuard } from './require-feature.guard';
 *
 * @RequireFeatureWithGuard('advanced-analytics', RequireFeatureGuard)
 * @Get('analytics')
 * getAnalytics() {
 *   // 只有启用了 advanced-analytics 功能的租户才能访问
 * }
 * ```
 */
export function RequireFeatureWithGuard(
  featureOrOptions: string | RequireFeatureOptions,
  guardClass: Type<any>,
) {
  const options: RequireFeatureOptions =
    typeof featureOrOptions === 'string' ? { feature: featureOrOptions } : featureOrOptions;

  return applyDecorators(SetMetadata(REQUIRE_FEATURE_KEY, options), UseGuards(guardClass));
}
