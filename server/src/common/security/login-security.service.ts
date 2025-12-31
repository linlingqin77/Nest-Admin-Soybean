import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from 'src/module/common/redis/redis.service';
import { CacheEnum } from 'src/common/enum/index';

/**
 * 登录安全配置
 */
export interface LoginSecurityConfig {
  /** 最大失败次数，默认 5 次 */
  maxFailedAttempts: number;
  /** 锁定时间（毫秒），默认 15 分钟 */
  lockDurationMs: number;
  /** 失败计数过期时间（毫秒），默认 15 分钟 */
  failedCountTtlMs: number;
}

/**
 * 登录安全状态
 */
export interface LoginSecurityStatus {
  /** 是否被锁定 */
  isLocked: boolean;
  /** 失败次数 */
  failedAttempts: number;
  /** 剩余锁定时间（毫秒） */
  remainingLockTimeMs: number;
  /** 剩余尝试次数 */
  remainingAttempts: number;
}

/**
 * 登录安全服务
 *
 * @description 处理登录失败计数和账户锁定逻辑
 * 需求 4.3: 登录失败 5 次后锁定账户 15 分钟
 */
@Injectable()
export class LoginSecurityService {
  private readonly logger = new Logger(LoginSecurityService.name);

  /** 默认配置 */
  private readonly defaultConfig: LoginSecurityConfig = {
    maxFailedAttempts: 5,
    lockDurationMs: 15 * 60 * 1000, // 15 分钟
    failedCountTtlMs: 15 * 60 * 1000, // 15 分钟
  };

  constructor(private readonly redisService: RedisService) {}

  /**
   * 获取失败计数的 Redis Key
   */
  private getFailedCountKey(username: string): string {
    return `${CacheEnum.PWD_ERR_CNT_KEY}${username}`;
  }

  /**
   * 获取账户锁定的 Redis Key
   */
  private getLockKey(username: string): string {
    return `${CacheEnum.PWD_ERR_CNT_KEY}lock:${username}`;
  }

  /**
   * 检查账户是否被锁定
   *
   * @param username 用户名
   * @returns 是否被锁定
   */
  async isAccountLocked(username: string): Promise<boolean> {
    const lockKey = this.getLockKey(username);
    const lockValue = await this.redisService.get(lockKey);
    return lockValue !== null;
  }

  /**
   * 获取账户锁定剩余时间（毫秒）
   *
   * @param username 用户名
   * @returns 剩余锁定时间（毫秒），如果未锁定返回 0
   */
  async getRemainingLockTime(username: string): Promise<number> {
    const lockKey = this.getLockKey(username);
    const ttl = await this.redisService.ttl(lockKey);
    // ttl 返回 -2 表示 key 不存在，-1 表示没有过期时间
    if (ttl === null || ttl < 0) {
      return 0;
    }
    return ttl * 1000; // 转换为毫秒
  }

  /**
   * 获取当前失败次数
   *
   * @param username 用户名
   * @returns 失败次数
   */
  async getFailedAttempts(username: string): Promise<number> {
    const countKey = this.getFailedCountKey(username);
    const count = await this.redisService.get(countKey);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * 获取登录安全状态
   *
   * @param username 用户名
   * @param config 可选配置
   * @returns 登录安全状态
   */
  async getSecurityStatus(username: string, config?: Partial<LoginSecurityConfig>): Promise<LoginSecurityStatus> {
    const mergedConfig = { ...this.defaultConfig, ...config };

    const [isLocked, remainingLockTimeMs, failedAttempts] = await Promise.all([
      this.isAccountLocked(username),
      this.getRemainingLockTime(username),
      this.getFailedAttempts(username),
    ]);

    const remainingAttempts = Math.max(0, mergedConfig.maxFailedAttempts - failedAttempts);

    return {
      isLocked,
      failedAttempts,
      remainingLockTimeMs,
      remainingAttempts,
    };
  }

  /**
   * 记录登录失败
   *
   * @param username 用户名
   * @param config 可选配置
   * @returns 更新后的安全状态
   */
  async recordLoginFailure(username: string, config?: Partial<LoginSecurityConfig>): Promise<LoginSecurityStatus> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const countKey = this.getFailedCountKey(username);

    // 获取当前失败次数
    let currentCount = await this.getFailedAttempts(username);
    currentCount += 1;

    // 更新失败次数
    await this.redisService.set(countKey, currentCount, mergedConfig.failedCountTtlMs);

    this.logger.warn(`Login failed for user: ${username}, attempt: ${currentCount}/${mergedConfig.maxFailedAttempts}`);

    // 检查是否需要锁定账户
    if (currentCount >= mergedConfig.maxFailedAttempts) {
      await this.lockAccount(username, mergedConfig.lockDurationMs);
      this.logger.warn(`Account locked for user: ${username}, duration: ${mergedConfig.lockDurationMs}ms`);
    }

    return this.getSecurityStatus(username, config);
  }

  /**
   * 锁定账户
   *
   * @param username 用户名
   * @param durationMs 锁定时长（毫秒）
   */
  async lockAccount(username: string, durationMs?: number): Promise<void> {
    const lockKey = this.getLockKey(username);
    const duration = durationMs ?? this.defaultConfig.lockDurationMs;
    await this.redisService.set(lockKey, Date.now().toString(), duration);
    this.logger.warn(`Account locked: ${username} for ${duration}ms`);
  }

  /**
   * 解锁账户
   *
   * @param username 用户名
   */
  async unlockAccount(username: string): Promise<void> {
    const lockKey = this.getLockKey(username);
    const countKey = this.getFailedCountKey(username);

    await Promise.all([this.redisService.del(lockKey), this.redisService.del(countKey)]);

    this.logger.log(`Account unlocked: ${username}`);
  }

  /**
   * 登录成功后清除失败记录
   *
   * @param username 用户名
   */
  async clearFailedAttempts(username: string): Promise<void> {
    const countKey = this.getFailedCountKey(username);
    await this.redisService.del(countKey);
    this.logger.debug(`Cleared failed attempts for user: ${username}`);
  }

  /**
   * 验证登录前检查
   * 如果账户被锁定，返回错误信息
   *
   * @param username 用户名
   * @returns 如果账户被锁定返回错误信息，否则返回 null
   */
  async validateBeforeLogin(username: string): Promise<{ locked: boolean; message: string; remainingTimeMs: number }> {
    const isLocked = await this.isAccountLocked(username);

    if (isLocked) {
      const remainingTimeMs = await this.getRemainingLockTime(username);
      const remainingMinutes = Math.ceil(remainingTimeMs / 60000);
      return {
        locked: true,
        message: `账户已被锁定，请 ${remainingMinutes} 分钟后再试`,
        remainingTimeMs,
      };
    }

    return {
      locked: false,
      message: '',
      remainingTimeMs: 0,
    };
  }
}
