import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { TokenBlacklistService } from './token-blacklist.service';
import { RedisService } from 'src/module/common/redis/redis.service';

/**
 * Token 黑名单服务属性测试
 *
 * Feature: enterprise-app-optimization
 * Property 9: Token 失效
 * Validates: Requirements 4.9
 *
 * 属性 9: Token 失效
 * *对于任意*用户，当密码被修改后，该用户之前颁发的所有 Token 应该立即失效。
 */
describe('TokenBlacklistService Property-Based Tests', () => {
  let service: TokenBlacklistService;
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
      set: jest.fn().mockImplementation((key: string, value: string, ttlMs?: number) => {
        const entry: { value: string; expireAt?: number } = { value };
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
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenBlacklistService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<TokenBlacklistService>(TokenBlacklistService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    redisStore.clear();
  });

  describe('Property 9: Token 失效 - Password change invalidates all tokens', () => {
    /**
     * Feature: enterprise-app-optimization, Property 9: Token 失效
     * Validates: Requirements 4.9
     *
     * *对于任意*用户，当密码被修改后，该用户之前颁发的所有 Token 应该立即失效。
     */
    it('should invalidate all tokens after password change (version increment)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000000 }), // userId
          fc.integer({ min: 0, max: 100 }), // initial token version
          fc.integer({ min: 1, max: 10 }), // number of password changes
          async (userId, initialVersion, passwordChangeCount) => {
            // Setup: Set initial token version
            if (initialVersion > 0) {
              await redisService.set(`user_token_version:${userId}`, initialVersion.toString(), 7 * 24 * 60 * 60 * 1000);
            }

            // Get the initial version
            const startVersion = await service.getUserTokenVersion(userId);

            // Simulate password changes
            for (let i = 0; i < passwordChangeCount; i++) {
              await service.invalidateAllUserTokens(userId, 'password_change');
            }

            // Get the final version
            const finalVersion = await service.getUserTokenVersion(userId);

            // Property: After N password changes, version should increase by N
            expect(finalVersion).toBe(startVersion + passwordChangeCount);

            // Property: Old tokens (with version < finalVersion) should be invalid
            for (let oldVersion = 0; oldVersion < finalVersion; oldVersion++) {
              const isValid = await service.isTokenVersionValid(userId, oldVersion);
              expect(isValid).toBe(false);
            }

            // Property: Current version token should be valid
            const isCurrentValid = await service.isTokenVersionValid(userId, finalVersion);
            expect(isCurrentValid).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * Feature: enterprise-app-optimization, Property 9: Token 失效
     * Validates: Requirements 4.9
     *
     * Token version validation is monotonic - newer versions are always valid
     */
    it('should validate token versions monotonically', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000000 }), // userId
          fc.integer({ min: 1, max: 50 }), // current version
          fc.integer({ min: 0, max: 100 }), // token version to check
          async (userId, currentVersion, tokenVersion) => {
            // Setup: Set current version
            await redisService.set(`user_token_version:${userId}`, currentVersion.toString(), 7 * 24 * 60 * 60 * 1000);

            const isValid = await service.isTokenVersionValid(userId, tokenVersion);

            // Property: Token is valid if and only if tokenVersion >= currentVersion
            expect(isValid).toBe(tokenVersion >= currentVersion);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: Token blacklist correctness', () => {
    /**
     * Feature: enterprise-app-optimization, Property 9: Token 失效
     * Validates: Requirements 4.8
     *
     * *对于任意* Token，加入黑名单后应该被识别为已失效
     */
    it('should correctly identify blacklisted tokens', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // token UUID
          async (tokenUuid) => {
            // Initially not blacklisted
            const beforeBlacklist = await service.isBlacklisted(tokenUuid);
            expect(beforeBlacklist).toBe(false);

            // Add to blacklist
            await service.addToBlacklist(tokenUuid);

            // Should be blacklisted
            const afterBlacklist = await service.isBlacklisted(tokenUuid);
            expect(afterBlacklist).toBe(true);

            // Remove from blacklist
            await service.removeFromBlacklist(tokenUuid);

            // Should not be blacklisted
            const afterRemove = await service.isBlacklisted(tokenUuid);
            expect(afterRemove).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    /**
     * Feature: enterprise-app-optimization, Property 9: Token 失效
     * Validates: Requirements 4.8
     *
     * Blacklist operations are idempotent
     */
    it('should handle idempotent blacklist operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // token UUID
          fc.integer({ min: 1, max: 5 }), // number of add operations
          async (tokenUuid, addCount) => {
            // Add to blacklist multiple times
            for (let i = 0; i < addCount; i++) {
              await service.addToBlacklist(tokenUuid);
            }

            // Should still be blacklisted (idempotent)
            const isBlacklisted = await service.isBlacklisted(tokenUuid);
            expect(isBlacklisted).toBe(true);

            // Remove once should be enough
            await service.removeFromBlacklist(tokenUuid);
            const afterRemove = await service.isBlacklisted(tokenUuid);
            expect(afterRemove).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: Batch token invalidation', () => {
    /**
     * Feature: enterprise-app-optimization, Property 9: Token 失效
     * Validates: Requirements 4.9
     *
     * Batch invalidation should affect all specified users
     */
    it('should invalidate tokens for all users in batch', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.integer({ min: 1, max: 1000000 }), { minLength: 1, maxLength: 10 }), // userIds
          async (userIds) => {
            // Get unique userIds
            const uniqueUserIds = [...new Set(userIds)];

            // Get initial versions
            const initialVersions = await Promise.all(uniqueUserIds.map((id) => service.getUserTokenVersion(id)));

            // Batch invalidate
            await service.invalidateMultipleUsersTokens(uniqueUserIds, 'batch_test');

            // Check all versions incremented
            for (let i = 0; i < uniqueUserIds.length; i++) {
              const newVersion = await service.getUserTokenVersion(uniqueUserIds[i]);
              expect(newVersion).toBe(initialVersions[i] + 1);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property: Version 0 means no restriction', () => {
    /**
     * Feature: enterprise-app-optimization, Property 9: Token 失效
     * Validates: Requirements 4.9
     *
     * When no version is set (version 0), all tokens should be valid
     */
    it('should allow all tokens when no version is set', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 1000000 }), // userId
          fc.integer({ min: 0, max: 1000 }), // any token version
          async (userId, tokenVersion) => {
            // Ensure no version is set (clear any existing)
            await service.clearUserTokenVersion(userId);

            // Any token version should be valid when no version is set
            const isValid = await service.isTokenVersionValid(userId, tokenVersion);
            expect(isValid).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
