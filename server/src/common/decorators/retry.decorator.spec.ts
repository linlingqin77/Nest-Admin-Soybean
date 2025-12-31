import { Test, TestingModule } from '@nestjs/testing';
import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  Retry,
  RetryMeta,
  RetryExhaustedError,
  BackoffStrategy,
  RETRY_KEY,
  calculateBackoffDelay,
  shouldRetryError,
  sleep,
} from './retry.decorator';

// Custom error types for testing
class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Global array to track retry callbacks (since decorator context is different)
const retryCallbackCalls: { error: Error; attempt: number }[] = [];

// Test service using the decorator
@Injectable()
class TestService {
  callCount = 0;
  shouldFail = false;
  failCount = 0;
  maxFailures = Infinity;
  errorToThrow: Error = new Error('Service failure');

  reset(): void {
    this.callCount = 0;
    this.shouldFail = false;
    this.failCount = 0;
    this.maxFailures = Infinity;
    this.errorToThrow = new Error('Service failure');
    retryCallbackCalls.length = 0;
  }

  @Retry({ maxRetries: 3, baseDelayMs: 10, jitter: false })
  async basicRetryMethod(): Promise<string> {
    this.callCount++;
    if (this.shouldFail && this.failCount < this.maxFailures) {
      this.failCount++;
      throw this.errorToThrow;
    }
    return 'success';
  }

  @Retry({ maxRetries: 2, backoff: BackoffStrategy.FIXED, baseDelayMs: 10, jitter: false })
  async fixedBackoffMethod(): Promise<string> {
    this.callCount++;
    if (this.shouldFail && this.failCount < this.maxFailures) {
      this.failCount++;
      throw this.errorToThrow;
    }
    return 'fixed-success';
  }

  @Retry({ maxRetries: 2, backoff: BackoffStrategy.LINEAR, baseDelayMs: 10, jitter: false })
  async linearBackoffMethod(): Promise<string> {
    this.callCount++;
    if (this.shouldFail && this.failCount < this.maxFailures) {
      this.failCount++;
      throw this.errorToThrow;
    }
    return 'linear-success';
  }

  @Retry({ maxRetries: 2, backoff: BackoffStrategy.EXPONENTIAL, baseDelayMs: 10, multiplier: 2, jitter: false })
  async exponentialBackoffMethod(): Promise<string> {
    this.callCount++;
    if (this.shouldFail && this.failCount < this.maxFailures) {
      this.failCount++;
      throw this.errorToThrow;
    }
    return 'exponential-success';
  }

  @Retry({
    maxRetries: 3,
    baseDelayMs: 10,
    jitter: false,
    retryOn: [NetworkError, TimeoutError],
  })
  async retryOnSpecificErrors(): Promise<string> {
    this.callCount++;
    if (this.shouldFail && this.failCount < this.maxFailures) {
      this.failCount++;
      throw this.errorToThrow;
    }
    return 'specific-success';
  }

  @Retry({
    maxRetries: 3,
    baseDelayMs: 10,
    jitter: false,
    noRetryOn: [ValidationError],
  })
  async noRetryOnSpecificErrors(): Promise<string> {
    this.callCount++;
    if (this.shouldFail && this.failCount < this.maxFailures) {
      this.failCount++;
      throw this.errorToThrow;
    }
    return 'no-retry-success';
  }

  @Retry({
    maxRetries: 3,
    baseDelayMs: 10,
    jitter: false,
    onRetry: (error: Error, attempt: number) => {
      retryCallbackCalls.push({ error, attempt });
    },
  })
  async methodWithCallback(): Promise<string> {
    this.callCount++;
    if (this.shouldFail && this.failCount < this.maxFailures) {
      this.failCount++;
      throw this.errorToThrow;
    }
    return 'callback-success';
  }

  @Retry({ maxRetries: 2, baseDelayMs: 10, maxDelayMs: 15, jitter: false })
  async methodWithMaxDelay(): Promise<string> {
    this.callCount++;
    if (this.shouldFail && this.failCount < this.maxFailures) {
      this.failCount++;
      throw this.errorToThrow;
    }
    return 'max-delay-success';
  }
}

// Test service using metadata decorator
@Injectable()
class MetadataTestService {
  @RetryMeta({ maxRetries: 5, backoff: BackoffStrategy.LINEAR, baseDelayMs: 500 })
  async metadataMethod(): Promise<string> {
    return 'metadata-success';
  }

  @RetryMeta()
  async defaultMetadataMethod(): Promise<string> {
    return 'default-metadata-success';
  }
}

describe('Retry Decorator', () => {
  let testService: TestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestService],
    }).compile();

    testService = module.get<TestService>(TestService);
  });

  afterEach(() => {
    testService.reset();
  });

  describe('basic functionality', () => {
    it('should execute method successfully when no errors occur', async () => {
      const result = await testService.basicRetryMethod();

      expect(result).toBe('success');
      expect(testService.callCount).toBe(1);
    });

    it('should retry on failure and succeed', async () => {
      testService.shouldFail = true;
      testService.maxFailures = 2; // Fail twice, then succeed

      const result = await testService.basicRetryMethod();

      expect(result).toBe('success');
      expect(testService.callCount).toBe(3); // 2 failures + 1 success
    });

    it('should throw RetryExhaustedError after all retries fail', async () => {
      testService.shouldFail = true;
      testService.maxFailures = Infinity;

      await expect(testService.basicRetryMethod()).rejects.toThrow(RetryExhaustedError);
      expect(testService.callCount).toBe(4); // 1 initial + 3 retries
    });

    it('should include original error in RetryExhaustedError', async () => {
      testService.shouldFail = true;
      testService.maxFailures = Infinity;
      testService.errorToThrow = new Error('Original error message');

      try {
        await testService.basicRetryMethod();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(RetryExhaustedError);
        const retryError = error as RetryExhaustedError;
        expect(retryError.lastError.message).toBe('Original error message');
        expect(retryError.retryCount).toBe(3);
        expect(retryError.methodName).toBe('TestService.basicRetryMethod');
      }
    });
  });

  describe('backoff strategies', () => {
    it('should use fixed backoff strategy', async () => {
      testService.shouldFail = true;
      testService.maxFailures = 1;

      const startTime = Date.now();
      await testService.fixedBackoffMethod();
      const elapsed = Date.now() - startTime;

      // Should have waited ~10ms for the retry
      expect(elapsed).toBeGreaterThanOrEqual(8);
      expect(testService.callCount).toBe(2);
    });

    it('should use linear backoff strategy', async () => {
      testService.shouldFail = true;
      testService.maxFailures = 2;

      const startTime = Date.now();
      await testService.linearBackoffMethod();
      const elapsed = Date.now() - startTime;

      // Should have waited ~10ms + ~20ms = ~30ms
      expect(elapsed).toBeGreaterThanOrEqual(25);
      expect(testService.callCount).toBe(3);
    });

    it('should use exponential backoff strategy', async () => {
      testService.shouldFail = true;
      testService.maxFailures = 2;

      const startTime = Date.now();
      await testService.exponentialBackoffMethod();
      const elapsed = Date.now() - startTime;

      // Should have waited ~10ms + ~20ms = ~30ms (10 * 2^0 + 10 * 2^1)
      expect(elapsed).toBeGreaterThanOrEqual(25);
      expect(testService.callCount).toBe(3);
    });
  });

  describe('error filtering', () => {
    it('should only retry on specified error types', async () => {
      testService.shouldFail = true;
      testService.maxFailures = 1;
      testService.errorToThrow = new NetworkError('Network failed');

      const result = await testService.retryOnSpecificErrors();

      expect(result).toBe('specific-success');
      expect(testService.callCount).toBe(2);
    });

    it('should not retry on non-specified error types', async () => {
      testService.shouldFail = true;
      testService.maxFailures = Infinity;
      testService.errorToThrow = new ValidationError('Validation failed');

      await expect(testService.retryOnSpecificErrors()).rejects.toThrow(ValidationError);
      expect(testService.callCount).toBe(1); // No retries
    });

    it('should not retry on excluded error types', async () => {
      testService.shouldFail = true;
      testService.maxFailures = Infinity;
      testService.errorToThrow = new ValidationError('Validation failed');

      await expect(testService.noRetryOnSpecificErrors()).rejects.toThrow(ValidationError);
      expect(testService.callCount).toBe(1); // No retries
    });

    it('should retry on non-excluded error types', async () => {
      testService.shouldFail = true;
      testService.maxFailures = 1;
      testService.errorToThrow = new NetworkError('Network failed');

      const result = await testService.noRetryOnSpecificErrors();

      expect(result).toBe('no-retry-success');
      expect(testService.callCount).toBe(2);
    });
  });

  describe('retry callback', () => {
    it('should call onRetry callback on each retry', async () => {
      testService.shouldFail = true;
      testService.maxFailures = 2;
      testService.errorToThrow = new Error('Test error');

      await testService.methodWithCallback();

      expect(retryCallbackCalls.length).toBe(2);
      expect(retryCallbackCalls[0].attempt).toBe(1);
      expect(retryCallbackCalls[1].attempt).toBe(2);
      expect(retryCallbackCalls[0].error.message).toBe('Test error');
    });
  });

  describe('max delay', () => {
    it('should respect maxDelayMs limit', async () => {
      testService.shouldFail = true;
      testService.maxFailures = 1;

      const startTime = Date.now();
      await testService.methodWithMaxDelay();
      const elapsed = Date.now() - startTime;

      // Delay should be capped at 15ms
      expect(elapsed).toBeLessThan(25);
      expect(testService.callCount).toBe(2);
    });
  });
});

describe('RetryMeta Decorator', () => {
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetadataTestService, Reflector],
    }).compile();

    reflector = module.get<Reflector>(Reflector);
  });

  it('should set metadata on the method', () => {
    const metadata = reflector.get(RETRY_KEY, MetadataTestService.prototype.metadataMethod);

    expect(metadata).toBeDefined();
    expect(metadata.maxRetries).toBe(5);
    expect(metadata.backoff).toBe(BackoffStrategy.LINEAR);
    expect(metadata.baseDelayMs).toBe(500);
  });

  it('should use default values when not specified', () => {
    const metadata = reflector.get(RETRY_KEY, MetadataTestService.prototype.defaultMetadataMethod);

    expect(metadata).toBeDefined();
    expect(metadata.maxRetries).toBe(3);
    expect(metadata.backoff).toBe(BackoffStrategy.EXPONENTIAL);
    expect(metadata.baseDelayMs).toBe(1000);
    expect(metadata.maxDelayMs).toBe(30000);
    expect(metadata.multiplier).toBe(2);
    expect(metadata.jitter).toBe(true);
  });
});

describe('Helper Functions', () => {
  describe('calculateBackoffDelay', () => {
    const baseOptions = {
      baseDelayMs: 100,
      maxDelayMs: 10000,
      multiplier: 2,
      jitter: false,
    };

    it('should calculate fixed backoff correctly', () => {
      const options = { ...baseOptions, backoff: BackoffStrategy.FIXED };

      expect(calculateBackoffDelay(1, options)).toBe(100);
      expect(calculateBackoffDelay(2, options)).toBe(100);
      expect(calculateBackoffDelay(3, options)).toBe(100);
    });

    it('should calculate linear backoff correctly', () => {
      const options = { ...baseOptions, backoff: BackoffStrategy.LINEAR };

      expect(calculateBackoffDelay(1, options)).toBe(100);
      expect(calculateBackoffDelay(2, options)).toBe(200);
      expect(calculateBackoffDelay(3, options)).toBe(300);
    });

    it('should calculate exponential backoff correctly', () => {
      const options = { ...baseOptions, backoff: BackoffStrategy.EXPONENTIAL };

      expect(calculateBackoffDelay(1, options)).toBe(100); // 100 * 2^0
      expect(calculateBackoffDelay(2, options)).toBe(200); // 100 * 2^1
      expect(calculateBackoffDelay(3, options)).toBe(400); // 100 * 2^2
      expect(calculateBackoffDelay(4, options)).toBe(800); // 100 * 2^3
    });

    it('should respect maxDelayMs', () => {
      const options = { ...baseOptions, backoff: BackoffStrategy.EXPONENTIAL, maxDelayMs: 300 };

      expect(calculateBackoffDelay(1, options)).toBe(100);
      expect(calculateBackoffDelay(2, options)).toBe(200);
      expect(calculateBackoffDelay(3, options)).toBe(300); // Capped at maxDelayMs
      expect(calculateBackoffDelay(4, options)).toBe(300); // Still capped
    });

    it('should add jitter when enabled', () => {
      const options = { ...baseOptions, backoff: BackoffStrategy.FIXED, jitter: true };

      // Run multiple times to verify jitter adds randomness
      const delays = new Set<number>();
      for (let i = 0; i < 10; i++) {
        delays.add(calculateBackoffDelay(1, options));
      }

      // With jitter, we should get different values (±25% of 100 = 75-125)
      // At least some values should be different
      expect(delays.size).toBeGreaterThan(1);

      // All values should be within the jitter range
      for (const delay of delays) {
        expect(delay).toBeGreaterThanOrEqual(75);
        expect(delay).toBeLessThanOrEqual(125);
      }
    });
  });

  describe('shouldRetryError', () => {
    it('should return true for any error when no filters specified', () => {
      expect(shouldRetryError(new Error('test'))).toBe(true);
      expect(shouldRetryError(new NetworkError('test'))).toBe(true);
      expect(shouldRetryError(new ValidationError('test'))).toBe(true);
    });

    it('should return true only for specified error types in retryOn', () => {
      const retryOn = [NetworkError, TimeoutError];

      expect(shouldRetryError(new NetworkError('test'), retryOn)).toBe(true);
      expect(shouldRetryError(new TimeoutError('test'), retryOn)).toBe(true);
      expect(shouldRetryError(new ValidationError('test'), retryOn)).toBe(false);
      expect(shouldRetryError(new Error('test'), retryOn)).toBe(false);
    });

    it('should return false for specified error types in noRetryOn', () => {
      const noRetryOn = [ValidationError];

      expect(shouldRetryError(new ValidationError('test'), undefined, noRetryOn)).toBe(false);
      expect(shouldRetryError(new NetworkError('test'), undefined, noRetryOn)).toBe(true);
      expect(shouldRetryError(new Error('test'), undefined, noRetryOn)).toBe(true);
    });

    it('should prioritize noRetryOn over retryOn', () => {
      const retryOn = [NetworkError, ValidationError];
      const noRetryOn = [ValidationError];

      // ValidationError is in both, but noRetryOn takes precedence
      expect(shouldRetryError(new ValidationError('test'), retryOn, noRetryOn)).toBe(false);
      expect(shouldRetryError(new NetworkError('test'), retryOn, noRetryOn)).toBe(true);
    });
  });

  describe('sleep', () => {
    it('should delay for the specified time', async () => {
      const startTime = Date.now();
      await sleep(50);
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(45);
      expect(elapsed).toBeLessThan(100);
    });
  });
});

describe('RetryExhaustedError', () => {
  it('should contain method name, retry count, and last error', () => {
    const lastError = new Error('Original error');
    const error = new RetryExhaustedError('TestService.testMethod', 3, lastError);

    expect(error.name).toBe('RetryExhaustedError');
    expect(error.methodName).toBe('TestService.testMethod');
    expect(error.retryCount).toBe(3);
    expect(error.lastError).toBe(lastError);
    expect(error.message).toContain('TestService.testMethod');
    expect(error.message).toContain('3 retries');
    expect(error.message).toContain('Original error');
  });
});
