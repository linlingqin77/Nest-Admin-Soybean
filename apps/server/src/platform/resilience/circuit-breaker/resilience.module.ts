import { Global, Module } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';

/**
 * 弹性模块
 *
 * @description 提供熔断器、重试等弹性模式的支持
 * 实现需求 3.1, 3.2, 3.3
 */
@Global()
@Module({
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
})
export class ResilienceModule {}
