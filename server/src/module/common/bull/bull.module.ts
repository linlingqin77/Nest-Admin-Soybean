import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AppConfigService } from 'src/config/app-config.service';

/**
 * Bull队列模块配置
 * 使用Redis作为队列后端存储
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: AppConfigService) => ({
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password,
          db: config.redis.db,
          keyPrefix: config.redis.keyPrefix + 'bull:',
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100, // 保留最近100个已完成任务
          removeOnFail: 500, // 保留最近500个失败任务
        },
      }),
      inject: [AppConfigService],
    }),
  ],
  exports: [BullModule],
})
export class BullConfigModule {}
