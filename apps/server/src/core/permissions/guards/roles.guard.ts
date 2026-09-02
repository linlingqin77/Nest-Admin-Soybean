import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { METADATA_KEYS } from 'src/shared/constants/metadata.constants';
import { AuthUser, BaseAttributeGuard } from './base-attribute.guard';

/**
 * The @RequireRole decorator currently sets a single role string.  Support
 * either form here so future decorators can pass an array without breaking
 * the guard.
 */
type RoleRequirement = string | string[];

@Injectable()
export class RolesGuard extends BaseAttributeGuard<RoleRequirement> {
  constructor(reflector: Reflector) {
    super(reflector, METADATA_KEYS.ROLE);
  }

  protected check(user: AuthUser, required: RoleRequirement): boolean {
    return this.hasRole(required, user.roles ?? []);
  }

  /**
   * 公开的角色匹配方法，供单测直接调用。
   * 参数顺序与旧的 hasRole 保持一致： (requiredRole, userRoles)。
   */
  hasRole(required: RoleRequirement, userRoles: string[]): boolean {
    const requiredRoles = Array.isArray(required) ? required : [required];
    const roles = userRoles ?? [];
    return requiredRoles.some((role) => roles.includes(role));
  }
}
