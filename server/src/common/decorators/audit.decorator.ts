import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../interceptors/audit.interceptor';

/**
 * 审计装饰器元数据键
 */
export const AUDIT_KEY = 'AUDIT_CONFIG';

/**
 * 审计操作类型
 */
export enum AuditAction {
  /** 创建 */
  CREATE = 'CREATE',
  /** 更新 */
  UPDATE = 'UPDATE',
  /** 删除 */
  DELETE = 'DELETE',
  /** 查询 */
  QUERY = 'QUERY',
  /** 导出 */
  EXPORT = 'EXPORT',
  /** 导入 */
  IMPORT = 'IMPORT',
  /** 登录 */
  LOGIN = 'LOGIN',
  /** 登出 */
  LOGOUT = 'LOGOUT',
  /** 授权 */
  GRANT = 'GRANT',
  /** 其他 */
  OTHER = 'OTHER',
}

/**
 * 审计配置接口
 */
export interface AuditConfig {
  /** 操作动作 */
  action: string;
  /** 模块名称 */
  module: string;
  /** 目标类型 (如: User, Role, Menu) */
  targetType?: string;
  /** 从路由参数中提取目标ID的参数名 */
  targetIdParam?: string;
  /** 从请求体中提取目标ID的字段名 */
  targetIdBody?: string;
  /** 是否记录旧值 (需要在业务代码中设置 cls.set('auditOldValue', value)) */
  recordOldValue?: boolean;
  /** 是否记录新值 (请求体) */
  recordNewValue?: boolean;
}

/**
 * 审计装饰器选项
 */
export interface AuditOptions {
  /** 操作动作 */
  action: AuditAction | string;
  /** 模块名称 */
  module: string;
  /** 目标类型 (如: User, Role, Menu) */
  targetType?: string;
  /** 从路由参数中提取目标ID的参数名 (默认: 'id') */
  targetIdParam?: string;
  /** 从请求体中提取目标ID的字段名 */
  targetIdBody?: string;
  /** 是否记录旧值 (默认: false) */
  recordOldValue?: boolean;
  /** 是否记录新值 (默认: true for CREATE/UPDATE) */
  recordNewValue?: boolean;
}

/**
 * 审计装饰器
 *
 * @description 标记需要审计的方法，自动记录操作日志
 *
 * @example
 * ```typescript
 * @Audit({
 *   action: AuditAction.CREATE,
 *   module: 'system',
 *   targetType: 'User',
 *   recordNewValue: true,
 * })
 * async createUser(dto: CreateUserDto) {
 *   // ...
 * }
 *
 * @Audit({
 *   action: AuditAction.UPDATE,
 *   module: 'system',
 *   targetType: 'User',
 *   targetIdParam: 'id',
 *   recordOldValue: true,
 *   recordNewValue: true,
 * })
 * async updateUser(@Param('id') id: number, dto: UpdateUserDto) {
 *   // 在更新前设置旧值
 *   const oldUser = await this.userService.findOne(id);
 *   this.cls.set('auditOldValue', JSON.stringify(oldUser));
 *   // ...
 * }
 *
 * @Audit({
 *   action: AuditAction.DELETE,
 *   module: 'system',
 *   targetType: 'User',
 *   targetIdParam: 'id',
 * })
 * async deleteUser(@Param('id') id: number) {
 *   // ...
 * }
 * ```
 */
export function Audit(options: AuditOptions): MethodDecorator {
  const config: AuditConfig = {
    action: options.action,
    module: options.module,
    targetType: options.targetType,
    targetIdParam: options.targetIdParam,
    targetIdBody: options.targetIdBody,
    recordOldValue: options.recordOldValue ?? false,
    recordNewValue:
      options.recordNewValue ?? (options.action === AuditAction.CREATE || options.action === AuditAction.UPDATE),
  };

  return applyDecorators(SetMetadata(AUDIT_KEY, config), UseInterceptors(AuditInterceptor));
}

/**
 * 审计元数据装饰器（仅设置元数据，不自动应用拦截器）
 *
 * @description 用于需要手动控制拦截器应用的场景
 */
export function AuditMeta(options: AuditOptions): MethodDecorator {
  const config: AuditConfig = {
    action: options.action,
    module: options.module,
    targetType: options.targetType,
    targetIdParam: options.targetIdParam,
    targetIdBody: options.targetIdBody,
    recordOldValue: options.recordOldValue ?? false,
    recordNewValue:
      options.recordNewValue ?? (options.action === AuditAction.CREATE || options.action === AuditAction.UPDATE),
  };

  return SetMetadata(AUDIT_KEY, config);
}
