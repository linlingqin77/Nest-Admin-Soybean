import { Module } from '@nestjs/common';
import { JobModule } from './monitors/jobs/job.module';
import { ServerModule } from './monitors/server/server.module';
import { CacheModule } from './monitors/cache/cache.module';
import { LoginlogModule } from './login-logs/loginlog.module';
import { OnlineModule } from './monitors/online/online.module';
import { OperlogModule } from './oper-logs/operlog.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './monitors/metrics/metrics.module';

@Module({
  imports: [
    JobModule,
    ServerModule,
    CacheModule,
    LoginlogModule,
    OnlineModule,
    OperlogModule,
    HealthModule,
    MetricsModule,
  ],
  exports: [JobModule],
})
export class MonitorModule {}
