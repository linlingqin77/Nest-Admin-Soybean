import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { METADATA_KEYS } from 'src/shared/constants/metadata.constants';

/**
 * 超级权限标识，拥有此权限可访问所有资源
 */
const ALL_PERMISSION = '*:*:*';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // 全局配置，
    const req = ctx.switchToHttp().getRequest();

    const prem = this.reflector.getAllAndOverride(METADATA_KEYS.PERMISSION, [ctx.getClass(), ctx.getHandler()]);

    //不需要鉴权
    if (prem) {
      return this.hasPermission(prem, req.user.permissions);
    }

    return true;
  }

  /**
   * 检查用户是否含有权限
   * 支持以下匹配模式：
   * 1. 超级权限 `*:*:*` - 匹配所有权限
   * 2. 模块通配符 `system:*:*` - 匹配 system 模块下的所有权限
   * 3. 资源通配符 `system:user:*` - 匹配 system:user 下的所有操作
   * 4. 精确匹配 `system:user:add` - 精确匹配指定权限
   *
   * @param permission 需要校验的权限标识
   * @param permissions 用户拥有的权限列表
   * @returns 是否拥有权限
   */
  hasPermission(permission: string, permissions: string[]): boolean {
    // 超级权限检查
    if (permissions.includes(ALL_PERMISSION)) {
      return true;
    }

    return permissions.some((p) => this.matchPermission(p, permission));
  }

  /**
   * 匹配单个权限
   * 支持通配符匹配：
   * - `system:user:*` 匹配 `system:user:add`、`system:user:edit` 等
   * - `system:*:*` 匹配 `system:user:add`、`system:role:edit` 等
   *
   * @param userPermission 用户拥有的权限（可能包含通配符）
   * @param requiredPermission 需要校验的权限（不包含通配符）
   * @returns 是否匹配
   */
  private matchPermission(userPermission: string, requiredPermission: string): boolean {
    // 精确匹配
    if (userPermission === requiredPermission) {
      return true;
    }

    // 通配符匹配
    if (userPermission.includes('*')) {
      return this.matchWildcard(userPermission, requiredPermission);
    }

    return false;
  }

  /**
   * 通配符匹配逻辑
   * 支持多级通配符：
   * - `system:user:*` 匹配 `system:user:add`
   * - `system:*:*` 匹配 `system:user:add`
   * - `*:user:*` 匹配 `system:user:add`
   *
   * @param pattern 包含通配符的权限模式
   * @param permission 需要匹配的权限
   * @returns 是否匹配
   */
  private matchWildcard(pattern: string, permission: string): boolean {
    const patternParts = pattern.split(':');
    const permissionParts = permission.split(':');

    // 权限格式不匹配（段数不同）
    if (patternParts.length !== permissionParts.length) {
      return false;
    }

    // 逐段匹配
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const permissionPart = permissionParts[i];

      // 通配符匹配任意值
      if (patternPart === '*') {
        continue;
      }

      // 非通配符需要精确匹配
      if (patternPart !== permissionPart) {
        return false;
      }
    }

    return true;
  }
}
