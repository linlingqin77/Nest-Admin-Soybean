/**
 * 测试工具导出
 * 
 * @description
 * 统一导出所有测试工具，包括 Mock 服务和测试数据工厂
 * 
 * @example
 * ```typescript
 * import { MockServiceFactory, UserFactory, DeptFactory } from 'src/test-utils';
 * 
 * // 使用 Mock 服务
 * const prisma = MockServiceFactory.createPrismaService();
 * 
 * // 使用测试数据工厂
 * const user = UserFactory.create();
 * const dept = DeptFactory.create();
 * ```
 */

export * from './mocks';
export * from './factories';
