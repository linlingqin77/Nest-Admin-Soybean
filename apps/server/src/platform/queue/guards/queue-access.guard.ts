import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Bull队列监控面板访问控制Guard
 * 限制只有拥有 monitor:queue:view 或 monitor:queue:manage 权限的用户可以访问
 */
@Injectable()
export class QueueAccessGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 如果没有用户信息，拒绝访问
    if (!user) {
      throw new ForbiddenException('需要登录才能访问队列监控面板');
    }

    // 检查用户权限
    const permissions = user.permissions || [];
    const hasViewPermission = permissions.includes('monitor:queue:view');
    const hasManagePermission = permissions.includes('monitor:queue:manage');

    // 必须至少有查看权限
    if (!hasViewPermission && !hasManagePermission) {
      throw new ForbiddenException('没有访问队列监控面板的权限');
    }

    // 如果是修改操作（POST/PUT/DELETE），需要管理权限
    const method = request.method;
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && !hasManagePermission) {
      throw new ForbiddenException('没有管理队列的权限，仅允许查看');
    }

    return true;
  }
}
