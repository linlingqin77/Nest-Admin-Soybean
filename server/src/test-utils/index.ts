/**
 * 测试工具模块
 *
 * @description
 * 提供测试所需的 Mock 工具和测试模块构建器
 *
 * @example
 * ```typescript
 * import {
 *   TestModuleBuilder,
 *   createPrismaMock,
 *   createRedisMock,
 *   createConfigMock,
 * } from 'src/test-utils';
 *
 * // 使用 TestModuleBuilder 创建测试模块
 * const { module, prisma, redis, config } = await TestModuleBuilder.create({
 *   providers: [UserService],
 * }).compile();
 *
 * // 或者单独使用 Mock
 * const prismaMock = createPrismaMock();
 * const redisMock = createRedisMock();
 * const configMock = createConfigMock();
 * ```
 */

// 测试模块构建器
export { TestModuleBuilder, TestModuleResult } from './test-module';

// Prisma Mock
export { createPrismaMock, PrismaMock } from './prisma-mock';

// Redis Mock
export { createRedisMock, createInMemoryRedisMock, RedisMock } from './redis-mock';

// Config Mock
export { createConfigMock, createConfigMockWith, ConfigMock } from './config-mock';
