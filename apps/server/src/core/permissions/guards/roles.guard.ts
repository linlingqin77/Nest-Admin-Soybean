import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { METADATA_KEYS } from 'src/shared/constants/metadata.constants';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // 全局配置，
    const req = ctx.switchToHttp().getRequest();

    const role = this.reflector.getAllAndOverride(METADATA_KEYS.ROLE, [ctx.getClass(), ctx.getHandler()]);

    //不需要鉴权
    if (role) {
      if (!req.user) {
        return false;
      }
      return this.hasRole(role, req.user.roles);
    }

    return true;
  }

  /**
   * 检测用户是否属于某个角色
   * @param role
   * @param roles
   * @returns
   */
  hasRole(role: string, roles: string[]) {
    return roles.some((v) => v === role);
  }
}
