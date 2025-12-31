import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { LoginSecurityService } from './login-security.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';

/**
 * 登录安全服务属性测试
 *
 * Feature: enterprise-app-optimization
 * Property 8: 登录失败锁定
 * Validates: Requirements 4.3
 *
 * 属性 8: 登录失败锁定
 * *对于任意*用户，当连续登录失败达到 5 次时，账户应该被锁定 15 分钟；锁定期间的登录尝试应该被拒绝。
 */
describe('LoginSecurityService Property-Based Tests', () => {
  let service: LoginSecurityService;
  let redisService: jest.Mocked<RedisService>;

  // In-memory store to simulate Redis behavior
  let redisStore: Map<string, { value: string; expireAt?: number }>;

  beforeEach(async () => {
    redisStore = new Map();

    const mockRedisService = {
      get: jest.fn().mockImplementation((key: string) => {
        const entry = redisStore.get(key);
        if (!entry) return Promise.resolve(null);
        if (entry.expireAt && Date.now() > entry.expireAt) {
          redisStore.delete(key);
          return Promise.resolve(null);
        }
        return Promise.resolve(entry.value);
      }),
      set: jest.fn().mockImplementation((key: string, value: unknown, ttlMs?: number) => {
        const entry: { value: string; expireAt?: number } = { value: String(value) };
        if (ttlMs) {
          entry.expireAt = Date.now() + ttlMs;
        }
        redisStore.set(key, entry);
        return Promise.resolve('OK');
      }),
      del: jest.fn().mockImplementation((key: string) => {
        const existed = redisStore.has(key);
        redisStore.delete(key);
        return Promise.resolve(existed ? 1 : 0);
      }),
      ttl: jest.fn().mockImplementation((key: string) => {
        const entry = redisStore.get(key);
        if (!entry) return Promise.resolve(-2);
        if (!entry.expireAt) return Promise.resolve(-1);
        const remainingMs = entry.expireAt - Date.now();
        if (remainingMs <= 0) {
          redisStore.delete(key);
          return Promise.resolve(-2);
        }
        return Promise.resolve(Math.ceil(remainingMs / 1000)); // Return seconds
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginSecurityService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<LoginSecurityService>(LoginSecurityService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    redisStore.clear();
  });

  describe('Property 8: 登录失败锁定 - Account locking after failed attempts', () => {
    /**
     * Feature: enterprise-app-optimization, Property 8: 登录失败锁定
     * Validates: Requirements 4.3
     *
     * *对于任意*用户，当连续登录失败达到 5 次时，账户应该被锁定
     */
    it('should lock account after exactly maxFailedAttempts failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)), // username
          fc.integer({ min: 1, max: 10 }), // maxFailedAttempts
          async (username, maxFailedAttempts) => {
            // Clear any existing state
            await service.unlockAccount(username);

            const config = {
              maxFailedAttempts,
              lockDurationMs: 15 * 60 * 1000,
              failedCountTtlMs: 15 * 60 * 1000,
            };

            // Record failures up to maxFailedAttempts - 1
            for (let i = 0; i < maxFailedAttempts - 1; i++) {
              const status = await service.recordLoginFailure(username, config);
              // Should NOT be locked yet
              expect(status.isLocked).toBe(false);
              expect(status.failedAttempts).toBe(i + 1);
            }

            // Record the final failure that triggers lock
            const finalStatus = await service.recordLoginFailure(username, config);

            // Property: Account should be locked after exactly maxFailedAttempts
            expect(finalStatus.isLocked).toBe(true);
            expect(finalStatus.failedAttempts).toBe(maxFailedAttempts);
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * Feature: enterprise-app-optimization, Property 8: 登录失败锁定
     * Validates: Requirements 4.3
     *
     * 锁定期间的登录尝试应该被拒绝
     */
    it('should reject login attempts during lock period', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)), // username
          async (username) => {
            // Clear any existing state
            await service.unlockAccount(username);

            // Lock the account
            await service.lockAccount(username, 15 * 60 * 1000);

            // Property: validateBeforeLogin should return locked status
            const validation = await service.validateBeforeLogin(username);
            expect(validation.locked).toBe(true);
            expect(validation.remainingTimeMs).toBeGreaterThan(0);
            expect(validation.message).toContain('分钟');
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * Feature: enterprise-app-optimization, Property 8: 登录失败锁定
     * Validates: Requirements 4.3
     *
     * 成功登录后应该清除失败计数
     */
    it('should clear failed attempts after successful login', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)), // username
          fc.integer({ min: 1, max: 4 }), // number of failures before success
          async (username, failureCount) => {
            // Clear any existing state
            await service.unlockAccount(username);

            // Record some failures (but not enough to lock)
            for (let i = 0; i < failureCount; i++) {
              await service.recordLoginFailure(username);
            }

            // Verify failures were recorded
            const beforeClear = await service.getFailedAttempts(username);
            expect(beforeClear).toBe(failureCount);

            // Simulate successful login by clearing attempts
            await service.clearFailedAttempts(username);

            // Property: Failed attempts should be 0 after clearing
            const afterClear = await service.getFailedAttempts(username);
            expect(afterClear).toBe(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * Feature: enterprise-app-optimization, Property 8: 登录失败锁定
     * Validates: Requirements 4.3
     *
     * 解锁账户应该同时清除锁定状态和失败计数
     */
    it('should clear both lock and failed count when unlocking', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)), // username
          async (username) => {
            // Lock the account and record failures
            await service.lockAccount(username);
            const countKey = `${CacheEnum.PWD_ERR_CNT_KEY}${username}`;
            await redisService.set(countKey, '5', 15 * 60 * 1000);

            // Verify locked state
            const beforeUnlock = await service.isAccountLocked(username);
            expect(beforeUnlock).toBe(true);

            // Unlock the account
            await service.unlockAccount(username);

            // Property: Both lock and count should be cleared
            const afterUnlock = await service.isAccountLocked(username);
            const failedAttempts = await service.getFailedAttempts(username);

            expect(afterUnlock).toBe(false);
            expect(failedAttempts).toBe(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * Feature: enterprise-app-optimization, Property 8: 登录失败锁定
     * Validates: Requirements 4.3
     *
     * 剩余尝试次数应该正确计算
     */
    it('should correctly calculate remaining attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)), // username
          fc.integer({ min: 0, max: 10 }), // current failed attempts
          fc.integer({ min: 1, max: 10 }), // maxFailedAttempts
          async (username, currentFailures, maxFailedAttempts) => {
            // Clear any existing state
            await service.unlockAccount(username);

            const config = {
              maxFailedAttempts,
              lockDurationMs: 15 * 60 * 1000,
              failedCountTtlMs: 15 * 60 * 1000,
            };

            // Set up current failure count
            if (currentFailures > 0) {
              const countKey = `${CacheEnum.PWD_ERR_CNT_KEY}${username}`;
              await redisService.set(countKey, currentFailures.toString(), 15 * 60 * 1000);
            }

            const status = await service.getSecurityStatus(username, config);

            // Property: remainingAttempts = max(0, maxFailedAttempts - currentFailures)
            const expectedRemaining = Math.max(0, maxFailedAttempts - currentFailures);
            expect(status.remainingAttempts).toBe(expectedRemaining);
            expect(status.failedAttempts).toBe(currentFailures);
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * Feature: enterprise-app-optimization, Property 8: 登录失败锁定
     * Validates: Requirements 4.3
     *
     * 锁定时间应该正确配置
     */
    it('should respect custom lock duration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)), // username
          fc.integer({ min: 60000, max: 3600000 }), // lockDurationMs (1 min to 1 hour)
          async (username, lockDurationMs) => {
            // Clear any existing state
            await service.unlockAccount(username);

            // Lock with custom duration
            await service.lockAccount(username, lockDurationMs);

            // Property: Account should be locked
            const isLocked = await service.isAccountLocked(username);
            expect(isLocked).toBe(true);

            // Property: Remaining time should be approximately the lock duration
            // Note: getRemainingLockTime converts TTL (seconds) to milliseconds with Math.ceil,
            // so we allow 1 second tolerance for rounding
            const remainingTime = await service.getRemainingLockTime(username);
            expect(remainingTime).toBeGreaterThan(lockDurationMs - 5000);
            expect(remainingTime).toBeLessThanOrEqual(lockDurationMs + 1000); // Allow 1s for rounding
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: Failure count persistence', () => {
    /**
     * Feature: enterprise-app-optimization, Property 8: 登录失败锁定
     * Validates: Requirements 4.3
     *
     * 失败计数应该在 TTL 内持久化
     */
    it('should persist failure count within TTL', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)), // username
          fc.integer({ min: 1, max: 4 }), // number of failures
          async (username, failureCount) => {
            // Clear any existing state
            await service.unlockAccount(username);

            // Record failures
            for (let i = 0; i < failureCount; i++) {
              await service.recordLoginFailure(username);
            }

            // Property: Failure count should be persisted
            const count = await service.getFailedAttempts(username);
            expect(count).toBe(failureCount);

            // Property: Security status should reflect the count
            const status = await service.getSecurityStatus(username);
            expect(status.failedAttempts).toBe(failureCount);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: Lock state consistency', () => {
    /**
     * Feature: enterprise-app-optimization, Property 8: 登录失败锁定
     * Validates: Requirements 4.3
     *
     * 锁定状态应该在所有检查方法中保持一致
     */
    it('should maintain consistent lock state across all methods', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 50 }).filter((s) => /^[a-zA-Z0-9_]+$/.test(s)), // username
          fc.boolean(), // whether to lock
          async (username, shouldLock) => {
            // Clear any existing state
            await service.unlockAccount(username);

            if (shouldLock) {
              await service.lockAccount(username);
            }

            // Property: All methods should agree on lock state
            const isLocked = await service.isAccountLocked(username);
            const validation = await service.validateBeforeLogin(username);
            const status = await service.getSecurityStatus(username);

            expect(isLocked).toBe(shouldLock);
            expect(validation.locked).toBe(shouldLock);
            expect(status.isLocked).toBe(shouldLock);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
