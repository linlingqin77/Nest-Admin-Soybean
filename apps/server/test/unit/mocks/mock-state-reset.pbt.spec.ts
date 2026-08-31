/**
 * Mock 状态重置属性测试
 *
 * @description
 * 验证 Mock 服务的状态重置功能正确性
 *
 * **Property 4: Mock 状态重置**
 * **Validates: Requirements 5.5**
 */

import * as fc from 'fast-check';
import { createMockPrisma } from 'test/mocks/prisma.mock';
import { createMockRedis } from 'test/mocks/redis.mock';
import { createMockConfig } from 'test/mocks/config.mock';

describe('Mock 服务 - 属性测试', () => {
  describe('Property 4: Mock 状态重置', () => {
    /**
     * **Validates: Requirements 5.5**
     * Mock 服务在重置后应该恢复到初始状态
     */
    describe('Prisma Mock 状态重置', () => {
      it('重置后所有 Mock 方法调用计数应该为 0', () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 10 }), (callCount) => {
            const mockPrisma = createMockPrisma();

            // 模拟多次调用
            for (let i = 0; i < callCount; i++) {
              mockPrisma.sysUser.findUnique({ where: { userId: i } });
              mockPrisma.sysRole.findMany();
            }

            // 验证调用次数
            expect(mockPrisma.sysUser.findUnique).toHaveBeenCalledTimes(callCount);
            expect(mockPrisma.sysRole.findMany).toHaveBeenCalledTimes(callCount);

            // 重置
            mockPrisma._resetAll();

            // 验证重置后调用次数为 0
            expect(mockPrisma.sysUser.findUnique).toHaveBeenCalledTimes(0);
            expect(mockPrisma.sysRole.findMany).toHaveBeenCalledTimes(0);

            return true;
          }),
          { numRuns: 50 },
        );
      });

      it('重置后 Mock 返回值应该被清除', () => {
        fc.assert(
          fc.property(fc.string({ minLength: 1, maxLength: 20 }), (testValue) => {
            const mockPrisma = createMockPrisma();

            // 设置返回值
            mockPrisma.sysUser.findUnique.mockResolvedValue({ userName: testValue });

            // 重置
            mockPrisma._resetAll();

            // 验证返回值被清除（调用后返回 undefined）
            const result = mockPrisma.sysUser.findUnique({ where: { userId: 1 } });
            expect(result).toBeUndefined();

            return true;
          }),
          { numRuns: 50 },
        );
      });
    });

    describe('Redis Mock 状态重置', () => {
      it('重置后存储应该为空', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(fc.tuple(fc.string({ minLength: 1, maxLength: 20 }), fc.string()), {
              minLength: 1,
              maxLength: 10,
            }),
            async (keyValuePairs) => {
              const mockRedis = createMockRedis();

              // 存储多个键值对
              for (const [key, value] of keyValuePairs) {
                await mockRedis.set(key, value);
              }

              // 验证存储不为空
              expect(mockRedis._getStore().size).toBeGreaterThan(0);

              // 重置
              mockRedis._resetAll();

              // 验证存储为空
              expect(mockRedis._getStore().size).toBe(0);

              return true;
            },
          ),
          { numRuns: 50 },
        );
      });

      it('重置后 Mock 方法调用计数应该为 0', async () => {
        await fc.assert(
          fc.asyncProperty(fc.integer({ min: 1, max: 10 }), async (callCount) => {
            const mockRedis = createMockRedis();

            // 模拟多次调用
            for (let i = 0; i < callCount; i++) {
              await mockRedis.get(`key_${i}`);
              await mockRedis.set(`key_${i}`, `value_${i}`);
            }

            // 验证调用次数
            expect(mockRedis.get).toHaveBeenCalledTimes(callCount);
            expect(mockRedis.set).toHaveBeenCalledTimes(callCount);

            // 重置
            mockRedis._resetAll();

            // 验证重置后调用次数为 0
            expect(mockRedis.get).toHaveBeenCalledTimes(0);
            expect(mockRedis.set).toHaveBeenCalledTimes(0);

            return true;
          }),
          { numRuns: 50 },
        );
      });
    });

    describe('Config Mock 状态重置', () => {
      it('重置后配置应该恢复默认值', () => {
        fc.assert(
          fc.property(fc.string({ minLength: 1, maxLength: 20 }), (customValue) => {
            const mockConfig = createMockConfig();

            // 获取原始值
            const originalJwtSecret = mockConfig.get('jwt.secret');

            // 修改配置
            mockConfig._setConfig('jwt.secret', customValue);
            expect(mockConfig.get('jwt.secret')).toBe(customValue);

            // 重置
            mockConfig._resetAll();

            // 验证恢复默认值
            expect(mockConfig.get('jwt.secret')).toBe(originalJwtSecret);

            return true;
          }),
          { numRuns: 50 },
        );
      });

      it('重置后 Mock 方法调用计数应该为 0', () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 10 }), (callCount) => {
            const mockConfig = createMockConfig();

            // 模拟多次调用
            for (let i = 0; i < callCount; i++) {
              mockConfig.get('app.name');
              mockConfig.get('jwt.secret');
            }

            // 验证调用次数
            expect(mockConfig.get).toHaveBeenCalledTimes(callCount * 2);

            // 重置
            mockConfig._resetAll();

            // 验证重置后调用次数为 0
            expect(mockConfig.get).toHaveBeenCalledTimes(0);

            return true;
          }),
          { numRuns: 50 },
        );
      });
    });
  });

  describe('Mock 服务功能正确性', () => {
    describe('Redis Mock 数据操作', () => {
      it('set 和 get 应该正确存取数据', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.string({ minLength: 0, maxLength: 100 }),
            async (key, value) => {
              const mockRedis = createMockRedis();

              await mockRedis.set(key, value);
              const result = await mockRedis.get(key);

              return result === value;
            },
          ),
          { numRuns: 100 },
        );
      });

      it('del 应该正确删除数据', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.string({ minLength: 0, maxLength: 100 }),
            async (key, value) => {
              const mockRedis = createMockRedis();

              await mockRedis.set(key, value);
              await mockRedis.del(key);
              const result = await mockRedis.get(key);

              return result === null;
            },
          ),
          { numRuns: 100 },
        );
      });

      it('incr 应该正确递增数值', async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1, maxLength: 50 }),
            fc.integer({ min: 0, max: 100 }),
            async (key, initialValue) => {
              const mockRedis = createMockRedis();

              await mockRedis.set(key, String(initialValue));
              const result = await mockRedis.incr(key);

              return result === initialValue + 1;
            },
          ),
          { numRuns: 100 },
        );
      });
    });

    describe('Config Mock 配置访问', () => {
      it('get 应该返回正确的配置值', () => {
        fc.assert(
          fc.property(fc.constantFrom('app.name', 'jwt.secret', 'core.bcryptRounds'), (configPath) => {
            const mockConfig = createMockConfig();
            const value = mockConfig.get(configPath);

            // 验证返回值不为 undefined
            return value !== undefined;
          }),
          { numRuns: 50 },
        );
      });

      it('get 应该返回默认值当配置不存在时', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 10, maxLength: 30 }),
            fc.string({ minLength: 1, maxLength: 20 }),
            (nonExistentPath, defaultValue) => {
              const mockConfig = createMockConfig();
              const value = mockConfig.get(`nonexistent.${nonExistentPath}`, defaultValue);

              return value === defaultValue;
            },
          ),
          { numRuns: 50 },
        );
      });

      it('getOrThrow 应该在配置不存在时抛出错误', () => {
        fc.assert(
          fc.property(fc.string({ minLength: 10, maxLength: 30 }), (nonExistentPath) => {
            const mockConfig = createMockConfig();

            try {
              mockConfig.getOrThrow(`nonexistent.${nonExistentPath}`);
              return false; // 应该抛出错误
            } catch (error) {
              return true;
            }
          }),
          { numRuns: 50 },
        );
      });
    });
  });
});
