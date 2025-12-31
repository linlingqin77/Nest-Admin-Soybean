import { Global, Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/**
 * 指标收集模块
 *
 * @description 提供 Prometheus 指标收集服务
 * 全局模块，可在任何地方注入 MetricsService
 */
@Global()
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
