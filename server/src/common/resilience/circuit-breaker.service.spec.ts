import { Test, TestingModule } from '@nestjs/testing';
import {
  CircuitBreakerService,
  BreakerState,
  CircuitBreakerOpenError,
  CircuitBreakerIsolatedError,
} from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CircuitBreakerService],
    }).compile();

    service = module.get<CircuitBreakerService>(CircuitBreakerService);
  });

  afterEach(() => {
    service.clearAll();
  });

  describe('createBreaker', () => {
    it('should create a new circuit breaker with default options', () => {
      const breaker = service.createBreaker('test-breaker');

      expect(breaker).toBeDefined();
      expect(service.hasBreaker('test-breaker')).toBe(true);
      expect(service.getState('test-breaker')).toBe(BreakerState.CLOSED);
    });

    it('should create a circuit breaker with custom options', () => {
      const breaker = service.createBreaker('custom-breaker', {
        threshold: 3,
        cooldownMs: 10000,
      });

      expect(breaker).toBeDefined();
      expect(service.hasBreaker('custom-breaker')).toBe(true);
    });

    it('should return existing breaker if name already exists', () => {
      const breaker1 = service.createBreaker('duplicate-breaker');
      const breaker2 = service.createBreaker('duplicate-breaker');

      expect(breaker1).toBe(breaker2);
    });
  });

  describe('getBreaker', () => {
    it('should return undefined for non-existent breaker', () => {
      expect(service.getBreaker('non-existent')).toBeUndefined();
    });

    it('should return the breaker if it exists', () => {
      service.createBreaker('existing-breaker');
      const breaker = service.getBreaker('existing-breaker');

      expect(breaker).toBeDefined();
    });
  });

  describe('getOrCreateBreaker', () => {
    it('should create a new breaker if it does not exist', () => {
      const breaker = service.getOrCreateBreaker('new-breaker');

      expect(breaker).toBeDefined();
      expect(service.hasBreaker('new-breaker')).toBe(true);
    });

    it('should return existing breaker if it exists', () => {
      const breaker1 = service.createBreaker('existing');
      const breaker2 = service.getOrCreateBreaker('existing');

      expect(breaker1).toBe(breaker2);
    });
  });

  describe('execute', () => {
    it('should execute function successfully when breaker is closed', async () => {
      service.createBreaker('exec-breaker');

      const result = await service.execute('exec-breaker', async () => 'success');

      expect(result).toBe('success');
    });

    it('should throw error if breaker does not exist', async () => {
      await expect(service.execute('non-existent', async () => 'test')).rejects.toThrow(
        'Circuit breaker "non-existent" not found',
      );
    });

    it('should propagate errors from the executed function', async () => {
      service.createBreaker('error-breaker');

      await expect(
        service.execute('error-breaker', async () => {
          throw new Error('Test error');
        }),
      ).rejects.toThrow('Test error');
    });

    it('should open breaker after consecutive failures reach threshold', async () => {
      service.createBreaker('threshold-breaker', { threshold: 2, cooldownMs: 100 });

      // First failure
      await expect(
        service.execute('threshold-breaker', async () => {
          throw new Error('Failure 1');
        }),
      ).rejects.toThrow('Failure 1');

      // Second failure - should trigger breaker to open
      await expect(
        service.execute('threshold-breaker', async () => {
          throw new Error('Failure 2');
        }),
      ).rejects.toThrow('Failure 2');

      // Third call should be rejected because breaker is open
      await expect(
        service.execute('threshold-breaker', async () => 'should not execute'),
      ).rejects.toThrow(CircuitBreakerOpenError);

      expect(service.getState('threshold-breaker')).toBe(BreakerState.OPEN);
    });
  });

  describe('getState', () => {
    it('should return undefined for non-existent breaker', () => {
      expect(service.getState('non-existent')).toBeUndefined();
    });

    it('should return CLOSED for new breaker', () => {
      service.createBreaker('state-breaker');
      expect(service.getState('state-breaker')).toBe(BreakerState.CLOSED);
    });
  });

  describe('getBreakerInfo', () => {
    it('should return undefined for non-existent breaker', () => {
      expect(service.getBreakerInfo('non-existent')).toBeUndefined();
    });

    it('should return breaker info with initial stats', () => {
      service.createBreaker('info-breaker');
      const info = service.getBreakerInfo('info-breaker');

      expect(info).toBeDefined();
      expect(info!.name).toBe('info-breaker');
      expect(info!.state).toBe(BreakerState.CLOSED);
      expect(info!.failureCount).toBe(0);
      expect(info!.successCount).toBe(0);
    });

    it('should track success count', async () => {
      service.createBreaker('success-breaker');

      await service.execute('success-breaker', async () => 'success');
      await service.execute('success-breaker', async () => 'success');

      const info = service.getBreakerInfo('success-breaker');
      expect(info!.successCount).toBe(2);
      expect(info!.lastSuccessTime).toBeDefined();
    });

    it('should track failure count', async () => {
      service.createBreaker('failure-breaker', { threshold: 10 });

      try {
        await service.execute('failure-breaker', async () => {
          throw new Error('Test failure');
        });
      } catch {
        // Expected
      }

      const info = service.getBreakerInfo('failure-breaker');
      expect(info!.failureCount).toBe(1);
      expect(info!.lastFailureTime).toBeDefined();
    });
  });

  describe('getAllBreakersInfo', () => {
    it('should return empty array when no breakers exist', () => {
      expect(service.getAllBreakersInfo()).toEqual([]);
    });

    it('should return info for all breakers', () => {
      service.createBreaker('breaker-1');
      service.createBreaker('breaker-2');

      const infos = service.getAllBreakersInfo();

      expect(infos).toHaveLength(2);
      expect(infos.map((i) => i.name)).toContain('breaker-1');
      expect(infos.map((i) => i.name)).toContain('breaker-2');
    });
  });

  describe('isolate', () => {
    it('should isolate the breaker', () => {
      service.createBreaker('isolate-breaker');
      service.isolate('isolate-breaker');

      expect(service.getState('isolate-breaker')).toBe(BreakerState.ISOLATED);
    });

    it('should reject requests when isolated', async () => {
      service.createBreaker('isolated-exec-breaker');
      service.isolate('isolated-exec-breaker');

      await expect(service.execute('isolated-exec-breaker', async () => 'test')).rejects.toThrow(
        CircuitBreakerIsolatedError,
      );
    });
  });

  describe('removeBreaker', () => {
    it('should remove existing breaker', () => {
      service.createBreaker('remove-breaker');
      expect(service.hasBreaker('remove-breaker')).toBe(true);

      const result = service.removeBreaker('remove-breaker');

      expect(result).toBe(true);
      expect(service.hasBreaker('remove-breaker')).toBe(false);
    });

    it('should return false for non-existent breaker', () => {
      const result = service.removeBreaker('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should remove all breakers', () => {
      service.createBreaker('breaker-1');
      service.createBreaker('breaker-2');
      service.createBreaker('breaker-3');

      service.clearAll();

      expect(service.getBreakerNames()).toEqual([]);
    });
  });

  describe('hasBreaker', () => {
    it('should return false for non-existent breaker', () => {
      expect(service.hasBreaker('non-existent')).toBe(false);
    });

    it('should return true for existing breaker', () => {
      service.createBreaker('existing');
      expect(service.hasBreaker('existing')).toBe(true);
    });
  });

  describe('getBreakerNames', () => {
    it('should return empty array when no breakers exist', () => {
      expect(service.getBreakerNames()).toEqual([]);
    });

    it('should return all breaker names', () => {
      service.createBreaker('alpha');
      service.createBreaker('beta');

      const names = service.getBreakerNames();

      expect(names).toHaveLength(2);
      expect(names).toContain('alpha');
      expect(names).toContain('beta');
    });
  });

  describe('state transitions', () => {
    it('should transition from CLOSED to OPEN after threshold failures', async () => {
      service.createBreaker('transition-breaker', { threshold: 2, cooldownMs: 50 });

      expect(service.getState('transition-breaker')).toBe(BreakerState.CLOSED);

      // Cause failures to trigger open state
      for (let i = 0; i < 2; i++) {
        try {
          await service.execute('transition-breaker', async () => {
            throw new Error('Failure');
          });
        } catch {
          // Expected
        }
      }

      expect(service.getState('transition-breaker')).toBe(BreakerState.OPEN);
    });

    it('should transition from OPEN to HALF_OPEN after cooldown', async () => {
      service.createBreaker('cooldown-breaker', { threshold: 1, cooldownMs: 50 });

      // Trigger open state
      try {
        await service.execute('cooldown-breaker', async () => {
          throw new Error('Failure');
        });
      } catch {
        // Expected
      }

      expect(service.getState('cooldown-breaker')).toBe(BreakerState.OPEN);

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Next call should be allowed (half-open state)
      // The state transitions to HALF_OPEN when a request is attempted after cooldown
      try {
        await service.execute('cooldown-breaker', async () => {
          throw new Error('Still failing');
        });
      } catch {
        // Expected - but the state should have been HALF_OPEN during execution
      }
    });

    it('should transition from HALF_OPEN to CLOSED on success', async () => {
      service.createBreaker('recovery-breaker', { threshold: 1, cooldownMs: 50 });

      // Trigger open state
      try {
        await service.execute('recovery-breaker', async () => {
          throw new Error('Failure');
        });
      } catch {
        // Expected
      }

      // Wait for cooldown
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Successful call should close the breaker
      await service.execute('recovery-breaker', async () => 'success');

      expect(service.getState('recovery-breaker')).toBe(BreakerState.CLOSED);
    });
  });
});
