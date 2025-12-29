/**
 * 测试数据工厂导出
 * 
 * @description
 * 统一导出所有测试数据工厂，方便在测试中使用
 * 
 * @example
 * ```typescript
 * import { UserFactory, DeptFactory, RoleFactory } from 'src/test-utils/factories';
 * 
 * const user = UserFactory.create();
 * const dept = DeptFactory.create();
 * const role = RoleFactory.create();
 * ```
 */

export * from './base.factory';
export * from './user.factory';
export * from './dept.factory';
export * from './role.factory';
export * from './menu.factory';
export * from './config.factory';
