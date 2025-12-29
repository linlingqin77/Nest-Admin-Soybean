/**
 * Mock 服务导出
 * 
 * @description
 * 统一导出所有 Mock 服务工厂，方便在测试中使用
 * 
 * @example
 * ```typescript
 * import { MockServiceFactory } from 'src/test-utils/mocks';
 * 
 * const prisma = MockServiceFactory.createPrismaService();
 * const redis = MockServiceFactory.createRedisService();
 * const jwt = MockServiceFactory.createJwtService();
 * ```
 */

export * from './service.mock';
