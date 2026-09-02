import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { METADATA_KEYS } from 'src/shared/constants/metadata.constants';
import { AuthUser, BaseAttributeGuard } from './base-attribute.guard';

/**
 * Super-permission marker: grants access to every resource regardless of other
 * permissions.
 */
const ALL_PERMISSION = '*:*:*';

/**
 * The @RequirePermission decorator currently sets a single permission string.
 * Allow either form for forward-compat with array-returning decorators.
 */
type PermissionRequirement = string | string[];

@Injectable()
export class PermissionGuard extends BaseAttributeGuard<PermissionRequirement> {
  constructor(reflector: Reflector) {
    super(reflector, METADATA_KEYS.PERMISSION);
  }

  protected check(user: AuthUser, required: PermissionRequirement): boolean {
    const userPerms = user.permissions ?? [];
    const requiredPerms = Array.isArray(required) ? required : [required];

    if (userPerms.includes(ALL_PERMISSION)) {
      return true;
    }

    return requiredPerms.some((p) => this.matchAny(userPerms, p));
  }

  /**
   * 公开的权限匹配方法，供单测直接调用。参数顺序与旧的 hasPermission 保持一致：
   *   (requiredPermission, userPermissions)。
   */
  hasPermission(requiredPermission: string, userPermissions: string[]): boolean {
    const userPerms = userPermissions ?? [];
    if (userPerms.includes(ALL_PERMISSION)) {
      return true;
    }
    return this.matchAny(userPerms, requiredPermission);
  }

  /**
   * Check whether the user has at least one permission that satisfies the
   * required pattern.  Supports:
   *  - exact match: `system:user:add`
   *  - resource wildcard: `system:user:*` → matches `system:user:add`,
   *    `system:user:edit`, etc.
   *  - module wildcard: `system:*:*` → matches any permission under `system`
   */
  private matchAny(userPerms: string[], required: string): boolean {
    return userPerms.some((userPerm) => {
      if (userPerm === required) return true;
      if (userPerm.includes('*')) {
        return this.matchWildcard(userPerm, required);
      }
      return false;
    });
  }

  private matchWildcard(pattern: string, permission: string): boolean {
    const patternParts = pattern.split(':');
    const permissionParts = permission.split(':');

    if (patternParts.length !== permissionParts.length) {
      return false;
    }

    for (let i = 0; i < patternParts.length; i++) {
      const part = patternParts[i];
      if (part !== '*' && part !== permissionParts[i]) {
        return false;
      }
    }
    return true;
  }
}
