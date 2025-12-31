import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Prisma/PostgreSQL 健康检查指示器
 * 用于检测数据库连接状态
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * 检查 PostgreSQL 数据库是否健康
   * @param key 健康检查的标识键
   * @returns 健康检查结果
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      // 执行简单查询测试连接
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return this.getStatus(key, true, {
        message: 'PostgreSQL is healthy',
        responseTime: `${responseTime}ms`,
      });
    } catch (error) {
      throw new HealthCheckError(
        'PostgreSQL check failed',
        this.getStatus(key, false, {
          message: error.message,
        }),
      );
    }
  }
}
