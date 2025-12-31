import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from 'src/module/common/redis/redis.service';

/**
 * Redis 健康检查指示器
 * 用于检测 Redis 连接状态
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  /**
   * 检查 Redis 是否健康
   * @param key 健康检查的标识键
   * @returns 健康检查结果
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      // 执行 PING 命令测试连接
      const result = await this.redisService.getClient().ping();
      const responseTime = Date.now() - startTime;

      if (result === 'PONG') {
        return this.getStatus(key, true, {
          message: 'Redis is healthy',
          responseTime: `${responseTime}ms`,
        });
      }

      throw new HealthCheckError('Redis PING failed', this.getStatus(key, false));
    } catch (error) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, {
          message: error.message,
        }),
      );
    }
  }
}
