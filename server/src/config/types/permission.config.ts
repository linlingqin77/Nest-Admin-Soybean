import { IsArray, IsIn, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 路由白名单项
 */
export class RouteWhitelistItem {
  @IsString()
  path: string;

  @IsIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])
  method: string;
}

/**
 * 路由配置
 */
export class RouterConfig {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteWhitelistItem)
  whitelist: RouteWhitelistItem[];
}

/**
 * 权限配置
 */
export class PermissionConfig {
  @ValidateNested()
  @Type(() => RouterConfig)
  router: RouterConfig;
}
