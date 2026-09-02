import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Request } from 'express';
import {
  DATA_PERMISSION_CONTEXT_KEY,
  DATA_PERMISSION_KEY,
  DataPermissionContext,
  DataPermissionOptions,
  DataScope,
} from 'src/core/permissions/decorators/data-permission.decorator';

/**
 * 数据权限拦截器
 */
@Injectable()
export class DataPermissionInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const options = this.reflector.get<DataPermissionOptions>(DATA_PERMISSION_KEY, context.getHandler());

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    // 构建数据权限上下文
    const permissionContext = this.buildPermissionContext(user, options);

    // 将上下文附加到请求对象
    (request as any)[DATA_PERMISSION_CONTEXT_KEY] = permissionContext;

    return next.handle();
  }

  /**
   * 构建数据权限上下文
   */
  private buildPermissionContext(user: any, options: DataPermissionOptions): DataPermissionContext {
    // 如果禁用数据权限，返回全部数据范围
    if (options.enable === false) {
      return {
        enabled: false,
        dataScope: DataScope.ALL,
        userId: user?.userId || 0,
        deptId: user?.deptId || 0,
        deptIds: [],
        options,
      };
    }

    // 获取用户的数据权限范围
    const dataScope = this.getUserDataScope(user);
    const deptIds = this.getAccessibleDeptIds(user, dataScope);

    return {
      enabled: true,
      dataScope,
      userId: user?.userId || 0,
      deptId: user?.deptId || 0,
      deptIds,
      options,
    };
  }

  /**
   * 获取用户的数据权限范围
   * 从用户角色中获取最大的数据权限范围
   */
  private getUserDataScope(user: any): DataScope {
    if (!user || !user.roles) {
      return DataScope.SELF;
    }

    // 超级管理员拥有全部数据权限
    if (user.isAdmin || user.roles?.some((r: any) => r.roleKey === 'admin')) {
      return DataScope.ALL;
    }

    // 从角色中获取最大的 dataScope 数值
    // 注意：DataScope 枚举中 ALL=1 < SELF=5，数值越大代表越受限
    // 这里取最大值，即最严格的权限范围
    let maxScope = DataScope.SELF;
    for (const role of user.roles || []) {
      const roleScope = role.dataScope || DataScope.SELF;
      if (roleScope > maxScope) {
        maxScope = roleScope;
      }
    }

    return maxScope;
  }

  /**
   * 获取可访问的部门ID列表
   */
  private getAccessibleDeptIds(user: any, dataScope: DataScope): number[] {
    if (!user) {
      return [];
    }

    switch (dataScope) {
      case DataScope.ALL:
        // 全部数据，不需要部门过滤
        return [];

      case DataScope.DEPT_CUSTOM:
        // 指定部门数据，从角色配置中获取
        return this.getCustomDeptIds(user);

      case DataScope.DEPT_ONLY:
        // 本部门数据
        return user.deptId ? [user.deptId] : [];

      case DataScope.DEPT_AND_CHILD:
        // 本部门及以下数据
        return this.getDeptAndChildIds(user);

      case DataScope.SELF:
        // 仅本人数据，不需要部门过滤（使用用户ID过滤）
        return [];

      default:
        return [];
    }
  }

  /**
   * 获取自定义部门ID列表
   */
  private getCustomDeptIds(user: any): number[] {
    const deptIds: Set<number> = new Set();

    for (const role of user.roles || []) {
      if (role.dataScope === DataScope.DEPT_CUSTOM && role.deptIds) {
        for (const deptId of role.deptIds) {
          deptIds.add(deptId);
        }
      }
    }

    return Array.from(deptIds);
  }

  /**
   * 获取本部门及以下部门ID列表
   */
  private getDeptAndChildIds(user: any): number[] {
    // 这里需要从用户对象中获取部门树信息
    // 实际实现中可能需要查询数据库获取子部门
    const deptIds: number[] = [];

    if (user.deptId) {
      deptIds.push(user.deptId);
    }

    // 如果用户对象中包含子部门信息
    if (user.childDeptIds) {
      deptIds.push(...user.childDeptIds);
    }

    return deptIds;
  }
}
