import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';

/**
 * Token 黑名单配置
 */
export interface TokenBlacklistConfig {
  /** Token 黑名单过期时间（毫秒），默认与 JWT 过期时间一致 */
  tokenBlacklistTtlMs: number;
  /** 用户 Token 版本过期时间（毫秒），默认 7 天 */
  userTokenVersionTtlMs: number;
}

/**
 * Token 黑名单服务
 *
 * @description 处理 Token 黑名单和用户 Token 版本管理
 * 需求 4.8: 登出后 Token 立即失效
 * 需求 4.9: 密码修改后使所有 Token 失效
 */
@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  /** 默认配置 */
  private readonly defaultConfig: TokenBlacklistConfig = {
    tokenBlacklistTtlMs: 24 * 60 * 60 * 1000, // 24 小时
    userTokenVersionTtlMs: 7 * 24 * 60 * 60 * 1000, // 7 天
  };

  /** Token 黑名单 Redis Key 前缀 */
  private readonly TOKEN_BLACKLIST_PREFIX = 'token_blacklist:';

  /** 用户 Token 版本 Redis Key 前缀 */
  private readonly USER_TOKEN_VERSION_PREFIX = 'user_token_version:';

  constructor(private readonly redisService: RedisService) {}

  /**
   * 获取 Token 黑名单的 Redis Key
   */
  private getBlacklistKey(tokenUuid: string): string {
    return `${this.TOKEN_BLACKLIST_PREFIX}${tokenUuid}`;
  }

  /**
   * 获取用户 Token 版本的 Redis Key
   */
  private getUserTokenVersionKey(userId: number): string {
    return `${this.USER_TOKEN_VERSION_PREFIX}${userId}`;
  }

  /**
   * 将 Token 加入黑名单
   *
   * @param tokenUuid Token 的 UUID
   * @param ttlMs 可选，过期时间（毫秒）
   */
  async addToBlacklist(tokenUuid: string, ttlMs?: number): Promise<void> {
    const key = this.getBlacklistKey(tokenUuid);
    const ttl = ttlMs ?? this.defaultConfig.tokenBlacklistTtlMs;

    await this.redisService.set(key, Date.now().toString(), ttl);
    this.logger.debug(`Token added to blacklist: ${tokenUuid}`);
  }

  /**
   * 检查 Token 是否在黑名单中
   *
   * @param tokenUuid Token 的 UUID
   * @returns 是否在黑名单中
   */
  async isBlacklisted(tokenUuid: string): Promise<boolean> {
    const key = this.getBlacklistKey(tokenUuid);
    const value = await this.redisService.get(key);
    return value !== null;
  }

  /**
   * 从黑名单中移除 Token（通常不需要，让其自然过期）
   *
   * @param tokenUuid Token 的 UUID
   */
  async removeFromBlacklist(tokenUuid: string): Promise<void> {
    const key = this.getBlacklistKey(tokenUuid);
    await this.redisService.del(key);
    this.logger.debug(`Token removed from blacklist: ${tokenUuid}`);
  }

  /**
   * 获取用户当前的 Token 版本
   *
   * @param userId 用户 ID
   * @returns Token 版本号，如果不存在返回 0
   */
  async getUserTokenVersion(userId: number): Promise<number> {
    const key = this.getUserTokenVersionKey(userId);
    const version = await this.redisService.get(key);
    return version ? parseInt(version, 10) : 0;
  }

  /**
   * 递增用户 Token 版本（使所有旧 Token 失效）
   *
   * @param userId 用户 ID
   * @param ttlMs 可选，过期时间（毫秒）
   * @returns 新的版本号
   */
  async incrementUserTokenVersion(userId: number, ttlMs?: number): Promise<number> {
    const key = this.getUserTokenVersionKey(userId);
    const ttl = ttlMs ?? this.defaultConfig.userTokenVersionTtlMs;

    // 获取当前版本并递增
    const currentVersion = await this.getUserTokenVersion(userId);
    const newVersion = currentVersion + 1;

    await this.redisService.set(key, newVersion.toString(), ttl);
    this.logger.log(`User token version incremented: userId=${userId}, version=${newVersion}`);

    return newVersion;
  }

  /**
   * 验证 Token 版本是否有效
   *
   * @param userId 用户 ID
   * @param tokenVersion Token 中携带的版本号
   * @returns 是否有效
   */
  async isTokenVersionValid(userId: number, tokenVersion: number): Promise<boolean> {
    const currentVersion = await this.getUserTokenVersion(userId);

    // 如果没有设置版本（currentVersion 为 0），则所有 Token 都有效
    // 如果 Token 版本 >= 当前版本，则有效
    if (currentVersion === 0) {
      return true;
    }

    return tokenVersion >= currentVersion;
  }

  /**
   * 使用户所有 Token 失效（通过递增版本号）
   *
   * @param userId 用户 ID
   * @param reason 失效原因（用于日志）
   */
  async invalidateAllUserTokens(userId: number, reason: string = 'unknown'): Promise<void> {
    await this.incrementUserTokenVersion(userId);
    this.logger.warn(`All tokens invalidated for user: userId=${userId}, reason=${reason}`);
  }

  /**
   * 批量使多个用户的 Token 失效
   *
   * @param userIds 用户 ID 列表
   * @param reason 失效原因
   */
  async invalidateMultipleUsersTokens(userIds: number[], reason: string = 'batch_invalidation'): Promise<void> {
    await Promise.all(userIds.map((userId) => this.invalidateAllUserTokens(userId, reason)));
    this.logger.warn(`Batch token invalidation: userIds=${userIds.join(',')}, reason=${reason}`);
  }

  /**
   * 清除用户 Token 版本（重置为初始状态）
   *
   * @param userId 用户 ID
   */
  async clearUserTokenVersion(userId: number): Promise<void> {
    const key = this.getUserTokenVersionKey(userId);
    await this.redisService.del(key);
    this.logger.debug(`User token version cleared: userId=${userId}`);
  }
}
