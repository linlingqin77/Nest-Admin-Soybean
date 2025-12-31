/**
 * Property-Based Tests for CircuitBreakerService
 *
 * Feature: enterprise-app-optimization
 * Property 4: 熔断器状态转换
 * Validates: Requirements 3.1, 3.2
 *
 * For any circuit breaker:
 * - When consecutive failures reach the threshold, it should transition from CLOSED to OPEN
 * - After cooldown time, it should transition to HALF_OPEN
 * - If a request succeeds in HALF_OPEN state, it should transition back to CLOSED
 * - If a request fails in HALF_OPEN state, it should transition back to OPEN
 */

import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import {
  CircuitBreakerService,
  BreakerState,
  CircuitBreakerOpenError,
} from './circuit-breaker.service';

describe('CircuitBreakerService Property-Based Tests', () => {
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

  /**
   * Property 4a: CLOSED to OPEN Transition
   *
   * For any circuit breaker with threshold N, after exactly N consecutive failures,
   * the breaker should transition from CLOSED to OPEN state.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  it('Property 4a: For any threshold N, N consecutive failures should transition breaker from CLOSED to OPEN', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random breaker name
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
        // Generate random threshold between 1 and 10
        fc.integer({ min: 1, max: 10 }),
        async (breakerName, threshold) => {
          // Create a unique breaker name to avoid conflicts
          const uniqueName = `${breakerName}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

          // Create breaker with the given threshold
          service.createBreaker(uniqueName, {
            threshold,
            cooldownMs: 60000, // Long cooldown to prevent auto-transition
          });

          // Verify initial state is CLOSED
          if (service.getState(uniqueName) !== BreakerState.CLOSED) {
            return false;
          }

          // Cause exactly threshold number of failures
          for (let i = 0; i < threshold; i++) {
            try {
              await service.execute(uniqueName, async () => {
                throw new Error(`Failure ${i + 1}`);
              });
            } catch (error) {
              // Expected - either the original error or CircuitBreakerOpenError
            }
          }

          // Property: After threshold failures, state should be OPEN
          const finalState = service.getState(uniqueName);
          return finalState === BreakerState.OPEN;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4b: OPEN State Rejects Requests
   *
   * For any circuit breaker in OPEN state, all subsequent requests should be rejected
   * with CircuitBreakerOpenError.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  it('Property 4b: For any breaker in OPEN state, requests should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random breaker name
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
        // Generate number of requests to attempt while open
        fc.integer({ min: 1, max: 5 }),
        async (breakerName, numRequests) => {
          const uniqueName = `${breakerName}-open-${Date.now()}-${Math.random().toString(36).slice(2)}`;

          // Create breaker with threshold 1 for quick transition to OPEN
          service.createBreaker(uniqueName, {
            threshold: 1,
            cooldownMs: 60000, // Long cooldown
          });

          // Trigger OPEN state
          try {
            await service.execute(uniqueName, async () => {
              throw new Error('Trigger open');
            });
          } catch {
            // Expected
          }

          // Verify state is OPEN
          if (service.getState(uniqueName) !== BreakerState.OPEN) {
            return false;
          }

          // All subsequent requests should be rejected
          let allRejected = true;
          for (let i = 0; i < numRequests; i++) {
            try {
              await service.execute(uniqueName, async () => 'should not execute');
              allRejected = false; // Should not reach here
              break;
            } catch (error) {
              if (!(error instanceof CircuitBreakerOpenError)) {
                allRejected = false;
                break;
              }
            }
          }

          // Property: All requests should be rejected with CircuitBreakerOpenError
          return allRejected;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4c: OPEN to HALF_OPEN Transition After Cooldown
   *
   * For any circuit breaker in OPEN state, after the cooldown period,
   * the next request attempt should transition it to HALF_OPEN state.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  it('Property 4c: For any breaker in OPEN state, after cooldown it should allow a test request', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random breaker name
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
        // Generate short cooldown time (50-100ms for testing)
        fc.integer({ min: 50, max: 100 }),
        async (breakerName, cooldownMs) => {
          const uniqueName = `${breakerName}-cooldown-${Date.now()}-${Math.random().toString(36).slice(2)}`;

          // Create breaker with short cooldown
          service.createBreaker(uniqueName, {
            threshold: 1,
            cooldownMs,
          });

          // Trigger OPEN state
          try {
            await service.execute(uniqueName, async () => {
              throw new Error('Trigger open');
            });
          } catch {
            // Expected
          }

          // Verify state is OPEN
          if (service.getState(uniqueName) !== BreakerState.OPEN) {
            return false;
          }

          // Wait for cooldown plus buffer
          await new Promise((resolve) => setTimeout(resolve, cooldownMs + 50));

          // Next request should be allowed (breaker transitions to HALF_OPEN)
          // If it succeeds, breaker goes to CLOSED
          // If it fails, breaker goes back to OPEN
          let requestAllowed = false;
          try {
            await service.execute(uniqueName, async () => 'success');
            requestAllowed = true;
          } catch (error) {
            // If it's not a CircuitBreakerOpenError, the request was allowed but failed
            if (!(error instanceof CircuitBreakerOpenError)) {
              requestAllowed = true;
            }
          }

          // Property: After cooldown, a request should be allowed (HALF_OPEN state)
          return requestAllowed;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4d: HALF_OPEN to CLOSED on Success
   *
   * For any circuit breaker in HALF_OPEN state, if a request succeeds,
   * it should transition back to CLOSED state.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  it('Property 4d: For any breaker in HALF_OPEN state, success should transition to CLOSED', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random breaker name
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
        // Generate random success value
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.integer({ min: 1, max: 10000 }),
          fc.record({ id: fc.integer(), name: fc.string() }),
        ),
        async (breakerName, successValue) => {
          const uniqueName = `${breakerName}-recovery-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const cooldownMs = 50;

          // Create breaker
          service.createBreaker(uniqueName, {
            threshold: 1,
            cooldownMs,
          });

          // Trigger OPEN state
          try {
            await service.execute(uniqueName, async () => {
              throw new Error('Trigger open');
            });
          } catch {
            // Expected
          }

          // Wait for cooldown
          await new Promise((resolve) => setTimeout(resolve, cooldownMs + 50));

          // Execute successful request (should transition through HALF_OPEN to CLOSED)
          const result = await service.execute(uniqueName, async () => successValue);

          // Property: After successful request in HALF_OPEN, state should be CLOSED
          const finalState = service.getState(uniqueName);
          return (
            finalState === BreakerState.CLOSED &&
            JSON.stringify(result) === JSON.stringify(successValue)
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4e: HALF_OPEN to OPEN on Failure
   *
   * For any circuit breaker in HALF_OPEN state, if a request fails,
   * it should transition back to OPEN state.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  it('Property 4e: For any breaker in HALF_OPEN state, failure should transition back to OPEN', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random breaker name
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
        // Generate random error message
        fc.string({ minLength: 1, maxLength: 50 }),
        async (breakerName, errorMessage) => {
          const uniqueName = `${breakerName}-halfopen-fail-${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const cooldownMs = 50;

          // Create breaker
          service.createBreaker(uniqueName, {
            threshold: 1,
            cooldownMs,
          });

          // Trigger OPEN state
          try {
            await service.execute(uniqueName, async () => {
              throw new Error('Trigger open');
            });
          } catch {
            // Expected
          }

          // Wait for cooldown
          await new Promise((resolve) => setTimeout(resolve, cooldownMs + 50));

          // Execute failing request (should transition through HALF_OPEN back to OPEN)
          try {
            await service.execute(uniqueName, async () => {
              throw new Error(errorMessage);
            });
          } catch {
            // Expected
          }

          // Property: After failed request in HALF_OPEN, state should be OPEN
          const finalState = service.getState(uniqueName);
          return finalState === BreakerState.OPEN;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4f: Failure Count Tracking
   *
   * For any circuit breaker, the failure count should accurately reflect
   * the number of failed executions.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  it('Property 4f: For any number of failures, failure count should be accurate', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random breaker name
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
        // Generate number of failures (less than threshold to keep breaker closed)
        fc.integer({ min: 1, max: 5 }),
        async (breakerName, numFailures) => {
          const uniqueName = `${breakerName}-count-${Date.now()}-${Math.random().toString(36).slice(2)}`;

          // Create breaker with high threshold to prevent opening
          service.createBreaker(uniqueName, {
            threshold: numFailures + 10,
            cooldownMs: 60000,
          });

          // Cause failures
          for (let i = 0; i < numFailures; i++) {
            try {
              await service.execute(uniqueName, async () => {
                throw new Error(`Failure ${i + 1}`);
              });
            } catch {
              // Expected
            }
          }

          // Property: Failure count should match number of failures
          const info = service.getBreakerInfo(uniqueName);
          return info !== undefined && info.failureCount === numFailures;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4g: Success Count Tracking
   *
   * For any circuit breaker, the success count should accurately reflect
   * the number of successful executions.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  it('Property 4g: For any number of successes, success count should be accurate', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random breaker name
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
        // Generate number of successes
        fc.integer({ min: 1, max: 10 }),
        async (breakerName, numSuccesses) => {
          const uniqueName = `${breakerName}-success-${Date.now()}-${Math.random().toString(36).slice(2)}`;

          // Create breaker
          service.createBreaker(uniqueName, {
            threshold: 5,
            cooldownMs: 60000,
          });

          // Execute successful requests
          for (let i = 0; i < numSuccesses; i++) {
            await service.execute(uniqueName, async () => `success-${i}`);
          }

          // Property: Success count should match number of successes
          const info = service.getBreakerInfo(uniqueName);
          return info !== undefined && info.successCount === numSuccesses;
        },
      ),
      { numRuns: 100 },
    );
  });

  /**
   * Property 4h: Breaker Isolation
   *
   * For any circuit breaker that is manually isolated, all requests should be rejected
   * regardless of previous state.
   *
   * **Validates: Requirements 3.1**
   */
  it('Property 4h: For any isolated breaker, all requests should be rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random breaker name
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z][a-zA-Z0-9-]*$/.test(s)),
        // Generate number of requests to attempt
        fc.integer({ min: 1, max: 5 }),
        async (breakerName, numRequests) => {
          const uniqueName = `${breakerName}-isolated-${Date.now()}-${Math.random().toString(36).slice(2)}`;

          // Create breaker
          service.createBreaker(uniqueName, {
            threshold: 10,
            cooldownMs: 60000,
          });

          // Manually isolate
          service.isolate(uniqueName);

          // Verify state is ISOLATED
          if (service.getState(uniqueName) !== BreakerState.ISOLATED) {
            return false;
          }

          // All requests should be rejected
          let allRejected = true;
          for (let i = 0; i < numRequests; i++) {
            try {
              await service.execute(uniqueName, async () => 'should not execute');
              allRejected = false;
              break;
            } catch {
              // Expected - any error is acceptable for isolated state
            }
          }

          // Property: All requests should be rejected when isolated
          return allRejected;
        },
      ),
      { numRuns: 100 },
    );
  });
});
