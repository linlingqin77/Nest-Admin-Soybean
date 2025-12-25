import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppConfigService } from 'src/config/app-config.service';
import { PostgresqlConfig } from 'src/config/types';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

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

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
