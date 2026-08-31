import { SetMetadata } from '@nestjs/common';

/**
 * 忽略租户过滤的装饰器 key
 */
export const IGNORE_TENANT_KEY = 'ignoreTenant';

/**
 * 忽略租户过滤装饰器
 *
 * 使用此装饰器的方法或控制器将跳过租户过滤
 * 适用于需要跨租户查询的场景，如：
 * - 平台管理员查看所有租户数据
 * - 租户注册时验证租户名是否已存在
 * - 登录时根据用户名查找用户（可能属于不同租户）
 *
 * @example
 * ```typescript
 * @IgnoreTenant()
 * @Get('all')
 * findAll() {
 *   // 此方法将跳过租户过滤
 * }
 * ```
 */
export const IgnoreTenant = () => SetMetadata(IGNORE_TENANT_KEY, true);

/**
 * 租户ID header 名称
 */
export const TENANT_ID_HEADER = 'tenant-id';

/**
 * 租户相关装饰器 - 获取当前租户ID
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../context/tenant.context';

export const CurrentTenant = createParamDecorator((data: unknown, ctx: ExecutionContext): string | undefined => {
  return TenantContext.getTenantId();
});
