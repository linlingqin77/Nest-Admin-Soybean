import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppConfigService } from 'src/config/app-config.service';
import { PostgresqlConfig } from 'src/config/types';
import {
  createSlowQueryLoggerMiddleware,
  DEFAULT_SLOW_QUERY_THRESHOLD,
  SlowQueryLog,
} from 'src/common/prisma/slow-query-logger.middleware';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly slowQueryLogs: SlowQueryLog[] = [];

  constructor(private readonly config: AppConfigService) {
    const pgConfig = config.db.postgresql;
    if (!pgConfig) {
      throw new Error('PostgreSQL configuration (db.postgresql) is missing.');
    }

    super({
      datasources: {
        db: {
          url: PrismaService.buildConnectionString(pgConfig),
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      // 优化连接池配置
      // @ts-ignore - Prisma内部配置，提升并发性能
      __internal: {
        engine: {
          connection_limit: 10, // 最大连接数
          pool_timeout: 30, // 连接池超时(秒)
          connect_timeout: 10, // 连接超时(秒)
        },
      },
    });

    // 注册慢查询日志中间件 (阈值: 500ms，符合需求 2.10)
    this.$use(
      createSlowQueryLoggerMiddleware(
        {
          threshold: DEFAULT_SLOW_QUERY_THRESHOLD,
          enabled: true,
        },
        (log) => {
          // 存储慢查询日志用于监控和分析
          this.slowQueryLogs.push(log);
          // 保持最近 100 条慢查询记录
          if (this.slowQueryLogs.length > 100) {
            this.slowQueryLogs.shift();
          }
        },
      ),
    );
  }

  /**
   * 获取最近的慢查询日志
   * @param limit 返回的日志数量，默认 10
   */
  getSlowQueryLogs(limit: number = 10): SlowQueryLog[] {
    return this.slowQueryLogs.slice(-limit);
  }

  /**
   * 清除慢查询日志
   */
  clearSlowQueryLogs(): void {
    this.slowQueryLogs.length = 0;
  }

  private static buildConnectionString(config: PostgresqlConfig): string {
    const { username, password, host, port, database, schema, ssl } = config;
    const encodedUser = encodeURIComponent(username);
    const encodedPassword = encodeURIComponent(password ?? '');
    const credentials = password ? `${encodedUser}:${encodedPassword}` : encodedUser;
    const params = new URLSearchParams();

    if (schema) {
      params.set('schema', schema);
    }

    if (ssl) {
      params.set('sslmode', 'require');
    }

    const query = params.toString();
    return `postgresql://${credentials}@${host}:${port}/${database}${query ? `?${query}` : ''}`;
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to PostgreSQL successfully.');
  }

  /**
   * 模块销毁时关闭 Prisma 连接 (需求 3.8)
   * 确保优雅关闭时正确清理数据库连接
   */
  async onModuleDestroy() {
    this.logger.log('Closing Prisma connection...');
    try {
      await this.$disconnect();
      this.logger.log('Prisma connection closed successfully.');
    } catch (error) {
      this.logger.error(`Error closing Prisma connection: ${error.message}`);
      throw error;
    }
  }
}
