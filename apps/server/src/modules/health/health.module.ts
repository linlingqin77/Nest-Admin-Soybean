import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { InfoController } from './info.controller';
import { HealthModule as ObservabilityHealthModule } from 'src/core/observability/health/health.module';
import { InfoService } from './info.service';

/**
 * 健康检查模块
 * 提供完整的健康检查端点:
 * - /health - 综合健康检查
 * - /health/live - 存活探针
 * - /health/ready - 就绪探针
 * - /info - 应用信息
 *
 * 注意: PrismaHealthIndicator 和 RedisHealthIndicator 已从 ObservabilityHealthModule 导入
 */
@Module({
  imports: [TerminusModule, HttpModule, ObservabilityHealthModule],
  controllers: [HealthController, InfoController],
  providers: [InfoService],
  exports: [InfoService],
})
export class HealthModule {}
