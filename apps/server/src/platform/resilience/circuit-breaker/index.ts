export * from './circuit-breaker.service';
export * from './resilience.module';
// Export decorator, metadata key, and types from circuit-breaker.decorator
// The error classes are already exported from circuit-breaker.service
export {
  CircuitBreaker,
  CircuitBreakerMeta,
  CIRCUIT_BREAKER_KEY,
} from '../../../core/http/decorators/circuit-breaker.decorator';
export type { CircuitBreakerDecoratorOptions } from '../../../core/http/decorators/circuit-breaker.decorator';