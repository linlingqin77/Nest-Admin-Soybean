import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { CircuitBreaker, CircuitBreakerOpenError, CIRCUIT_BREAKER_KEY, CircuitBreakerMeta } from './circuit-breaker.decorator';
import { CircuitBreakerService } from '../resilience/circuit-breaker.service';
import { Reflector } from '@nestjs/core';

// Test service using the decorator
@Injectable()
class TestService {
  callCount = 0;
  shouldFail = false;

  constructor(public readonly circuitBreakerService: CircuitBreakerService) {}

  @CircuitBreaker({ name: 'test-breaker', threshold: 2, cooldownMs: 100 })
  async protectedMethod(): Promise<string> {
    this.callCount++;
    if (this.shouldFail) {
      throw new Error('Service failure');
    }
    return 'success';
  }

  @CircuitBreaker({ threshold: 2, cooldownMs: 100 })
  async autoNamedMethod(): Promise<string> {
    this.callCount++;
    if (this.shouldFail) {
      throw new Error('Service failure');
    }
    return 'auto-named-success';
  }

  @CircuitBreaker({
    name: 'fallback-breaker',
    threshold: 1,
    cooldownMs: 100,
    fallback: () => 'fallback-value',
  })
  async methodWithFallback(): Promise<string> {
    this.callCount++;
    if (this.shouldFail) {
      throw new Error('Service failure');
    }
    return 'normal-value';
  }

  @CircuitBreaker({
    name: 'async-fallback-breaker',
    threshold: 1,
    cooldownMs: 100,
    fallback: async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'async-fallback-value';
    },
  })
  async methodWithAsyncFallback(): Promise<string> {
    this.callCount++;
    if (this.shouldFail) {
      throw new Error('Service failure');
    }
    return 'normal-value';
  }
}

// Test service using metadata decorator
@Injectable()
class MetadataTestService {
  @CircuitBreakerMeta({ name: 'meta-breaker', threshold: 3, cooldownMs: 5000 })
  async metadataMethod(): Promise<string> {
    return 'metadata-success';
  }
}

describe('CircuitBreaker Decorator', () => {
  let testService: TestService;
  let circuitBreakerService: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CircuitBreakerService, TestService],
    }).compile();

    testService = module.get<TestService>(TestService);
    circuitBreakerService = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  afterEach(() => {
    circuitBreakerService.clearAll();
    testService.callCount = 0;
    testService.shouldFail = false;
  });

  describe('basic functionality', () => {
    it('should execute method successfully when breaker is closed', async () => {
      const result = await testService.protectedMethod();

      expect(result).toBe('success');
      expect(testService.callCount).toBe(1);
    });

    it('should create breaker with specified name', async () => {
      await testService.protectedMethod();

      expect(circuitBreakerService.hasBreaker('test-breaker')).toBe(true);
    });

    it('should auto-generate breaker name from class and method', async () => {
      await testService.autoNamedMethod();

      expect(circuitBreakerService.hasBreaker('TestService.autoNamedMethod')).toBe(true);
    });

    it('should propagate errors from the method', async () => {
      testService.shouldFail = true;

      await expect(testService.protectedMethod()).rejects.toThrow('Service failure');
      expect(testService.callCount).toBe(1);
    });
  });

  describe('circuit breaker behavior', () => {
    it('should open breaker after threshold failures', async () => {
      testService.shouldFail = true;

      // First failure
      await expect(testService.protectedMethod()).rejects.toThrow('Service failure');

      // Second failure - triggers breaker to open
      await expect(testService.protectedMethod()).rejects.toThrow('Service failure');

      // Third call should be rejected by breaker
      await expect(testService.protectedMethod()).rejects.toThrow(CircuitBreakerOpenError);

      // Method should not have been called the third time
      expect(testService.callCount).toBe(2);
    });

    it('should recover after cooldown period', async () => {
      testService.shouldFail = true;

      // Trigger breaker to open
      await expect(testService.protectedMethod()).rejects.toThrow('Service failure');
      await expect(testService.protectedMethod()).rejects.toThrow('Service failure');

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Service is now working
      testService.shouldFail = false;

      // Should succeed after cooldown
      const result = await testService.protectedMethod();
      expect(result).toBe('success');
    });
  });

  describe('fallback functionality', () => {
    it('should return fallback value when breaker is open', async () => {
      testService.shouldFail = true;

      // Trigger breaker to open
      await expect(testService.methodWithFallback()).rejects.toThrow('Service failure');

      // Now breaker is open, should return fallback
      const result = await testService.methodWithFallback();
      expect(result).toBe('fallback-value');
    });

    it('should support async fallback functions', async () => {
      testService.shouldFail = true;

      // Trigger breaker to open
      await expect(testService.methodWithAsyncFallback()).rejects.toThrow('Service failure');

      // Now breaker is open, should return async fallback
      const result = await testService.methodWithAsyncFallback();
      expect(result).toBe('async-fallback-value');
    });

    it('should not use fallback when method succeeds', async () => {
      const result = await testService.methodWithFallback();
      expect(result).toBe('normal-value');
    });
  });
});

describe('CircuitBreakerMeta Decorator', () => {
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetadataTestService, Reflector],
    }).compile();

    reflector = module.get<Reflector>(Reflector);
  });

  it('should set metadata on the method', () => {
    const metadata = reflector.get(CIRCUIT_BREAKER_KEY, MetadataTestService.prototype.metadataMethod);

    expect(metadata).toBeDefined();
    expect(metadata.name).toBe('meta-breaker');
    expect(metadata.threshold).toBe(3);
    expect(metadata.cooldownMs).toBe(5000);
  });

  it('should use default values when not specified', () => {
    // Create a test class with default options
    class DefaultOptionsService {
      @CircuitBreakerMeta()
      async defaultMethod(): Promise<string> {
        return 'default';
      }
    }

    const metadata = reflector.get(CIRCUIT_BREAKER_KEY, DefaultOptionsService.prototype.defaultMethod);

    expect(metadata).toBeDefined();
    expect(metadata.threshold).toBe(5);
    expect(metadata.cooldownMs).toBe(30000);
  });
});
