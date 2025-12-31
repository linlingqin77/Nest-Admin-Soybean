/**
 * Slow Query Logger Middleware Property-Based Tests
 *
 * Feature: enterprise-app-optimization
 * Property 13: 慢查询记录
 * Validates: Requirements 2.10, 8.5
 *
 * This test verifies that slow query logging is correctly implemented:
 * For any database query, when execution time exceeds 500ms,
 * it should be recorded in the slow query log.
 */

import * as fc from 'fast-check';
import {
  createSlowQueryLoggerMiddleware,
  SlowQueryLog,
  DEFAULT_SLOW_QUERY_THRESHOLD,
} from './slow-query-logger.middleware';
import { Prisma } from '@prisma/client';

describe('Slow Query Logger Property-Based Tests', () => {
  /**
   * Property 13: Slow Query Recording
   *
   * For any database query, when execution time exceeds 500ms,
   * it should be recorded in the slow query log.
   *
   * **Validates: Requirements 2.10, 8.5**
   */
  describe('Property 13: Slow Query Recording', () => {
    // Generator for Prisma model names
    const modelArb = fc.constantFrom(
      'User',
      'Role',
      'Dept',
      'Menu',
      'Config',
      'Tenant',
      'Post',
      'Comment',
      'File',
      'Log',
    );

    // Generator for Prisma actions
    const actionArb = fc.constantFrom(
      'findMany',
      'findUnique',
      'findFirst',
      'create',
      'createMany',
      'update',
      'updateMany',
      'delete',
      'deleteMany',
      'count',
      'aggregate',
      'groupBy',
    );

    // Generator for query arguments
    const queryArgsArb = fc.oneof(
      fc.constant({}),
      fc.record({
        where: fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
        }),
      }),
      fc.record({
        where: fc.record({
          status: fc.constantFrom('active', 'inactive', 'pending'),
        }),
        take: fc.integer({ min: 1, max: 100 }),
        skip: fc.integer({ min: 0, max: 1000 }),
      }),
      fc.record({
        include: fc.record({
          posts: fc.boolean(),
          roles: fc.boolean(),
        }),
      }),
    );

    // Generator for query duration in milliseconds
    const durationArb = fc.integer({ min: 0, max: 5000 });

    // Generator for threshold values
    const thresholdArb = fc.integer({ min: 100, max: 2000 });

    const createMockParams = (model: string, action: string, args?: any): Prisma.MiddlewareParams => ({
      model: model as any,
      action: action as any,
      args: args || {},
      dataPath: [],
      runInTransaction: false,
    });

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should log queries that exceed the threshold and not log queries below threshold', async () => {
      await fc.assert(
        fc.asyncProperty(
          modelArb,
          actionArb,
          queryArgsArb,
          durationArb,
          thresholdArb,
          async (model, action, args, duration, threshold) => {
            const capturedLogs: SlowQueryLog[] = [];
            const middleware = createSlowQueryLoggerMiddleware(
              { threshold },
              (log) => capturedLogs.push(log),
            );

            const params = createMockParams(model, action, args);
            const mockNext = jest.fn().mockImplementation(async () => {
              jest.advanceTimersByTime(duration);
              return { success: true };
            });

            await middleware(params, mockNext);

            // Property: Query should be logged if and only if duration >= threshold
            if (duration >= threshold) {
              expect(capturedLogs.length).toBe(1);
              expect(capturedLogs[0].query).toBe(`${model}.${action}`);
              expect(capturedLogs[0].duration).toBeGreaterThanOrEqual(threshold);
              expect(capturedLogs[0].threshold).toBe(threshold);
            } else {
              expect(capturedLogs.length).toBe(0);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should use default threshold of 500ms when not specified', async () => {
      await fc.assert(
        fc.asyncProperty(
          modelArb,
          actionArb,
          durationArb,
          async (model, action, duration) => {
            const capturedLogs: SlowQueryLog[] = [];
            const middleware = createSlowQueryLoggerMiddleware({}, (log) => capturedLogs.push(log));

            const params = createMockParams(model, action);
            const mockNext = jest.fn().mockImplementation(async () => {
              jest.advanceTimersByTime(duration);
              return {};
            });

            await middleware(params, mockNext);

            // Property: Default threshold should be 500ms
            if (duration >= DEFAULT_SLOW_QUERY_THRESHOLD) {
              expect(capturedLogs.length).toBe(1);
              expect(capturedLogs[0].threshold).toBe(DEFAULT_SLOW_QUERY_THRESHOLD);
            } else {
              expect(capturedLogs.length).toBe(0);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should include complete query information in the log', async () => {
      await fc.assert(
        fc.asyncProperty(
          modelArb,
          actionArb,
          queryArgsArb,
          thresholdArb,
          async (model, action, args, threshold) => {
            const capturedLogs: SlowQueryLog[] = [];
            const middleware = createSlowQueryLoggerMiddleware(
              { threshold },
              (log) => capturedLogs.push(log),
            );

            const params = createMockParams(model, action, args);
            // Always exceed threshold to ensure logging
            const duration = threshold + 100;

            const mockNext = jest.fn().mockImplementation(async () => {
              jest.advanceTimersByTime(duration);
              return {};
            });

            await middleware(params, mockNext);

            // Property: Log should contain all required fields
            expect(capturedLogs.length).toBe(1);
            const log = capturedLogs[0];

            // Query field should be model.action format
            expect(log.query).toBe(`${model}.${action}`);

            // Params should be JSON stringified args
            expect(log.params).toBe(JSON.stringify(args));

            // Duration should be recorded
            expect(log.duration).toBeGreaterThanOrEqual(threshold);

            // Threshold should be recorded
            expect(log.threshold).toBe(threshold);

            // Timestamp should be a valid Date
            expect(log.timestamp).toBeInstanceOf(Date);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should not interfere with query results', async () => {
      await fc.assert(
        fc.asyncProperty(
          modelArb,
          actionArb,
          fc.anything(),
          durationArb,
          async (model, action, expectedResult, duration) => {
            const capturedLogs: SlowQueryLog[] = [];
            const middleware = createSlowQueryLoggerMiddleware(
              { threshold: 100 },
              (log) => capturedLogs.push(log),
            );

            const params = createMockParams(model, action);
            const mockNext = jest.fn().mockImplementation(async () => {
              jest.advanceTimersByTime(duration);
              return expectedResult;
            });

            const result = await middleware(params, mockNext);

            // Property: Query result should be passed through unchanged
            expect(result).toEqual(expectedResult);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should handle queries at exactly the threshold boundary', async () => {
      await fc.assert(
        fc.asyncProperty(
          modelArb,
          actionArb,
          thresholdArb,
          async (model, action, threshold) => {
            const capturedLogs: SlowQueryLog[] = [];
            const middleware = createSlowQueryLoggerMiddleware(
              { threshold },
              (log) => capturedLogs.push(log),
            );

            const params = createMockParams(model, action);
            // Duration exactly at threshold
            const mockNext = jest.fn().mockImplementation(async () => {
              jest.advanceTimersByTime(threshold);
              return {};
            });

            await middleware(params, mockNext);

            // Property: Query at exactly threshold should be logged (>= comparison)
            expect(capturedLogs.length).toBe(1);
            expect(capturedLogs[0].duration).toBe(threshold);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should not log when middleware is disabled', async () => {
      await fc.assert(
        fc.asyncProperty(
          modelArb,
          actionArb,
          durationArb,
          async (model, action, duration) => {
            const capturedLogs: SlowQueryLog[] = [];
            const middleware = createSlowQueryLoggerMiddleware(
              { enabled: false, threshold: 0 }, // threshold 0 would log everything if enabled
              (log) => capturedLogs.push(log),
            );

            const params = createMockParams(model, action);
            const mockNext = jest.fn().mockImplementation(async () => {
              jest.advanceTimersByTime(duration);
              return {};
            });

            await middleware(params, mockNext);

            // Property: No logs should be captured when disabled
            expect(capturedLogs.length).toBe(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should propagate errors while still measuring duration', async () => {
      await fc.assert(
        fc.asyncProperty(
          modelArb,
          actionArb,
          fc.string({ minLength: 1, maxLength: 100 }),
          thresholdArb,
          async (model, action, errorMessage, threshold) => {
            const middleware = createSlowQueryLoggerMiddleware({ threshold });

            const params = createMockParams(model, action);
            const error = new Error(errorMessage);
            const duration = threshold + 100;

            const mockNext = jest.fn().mockImplementation(async () => {
              jest.advanceTimersByTime(duration);
              throw error;
            });

            // Property: Errors should be propagated
            await expect(middleware(params, mockNext)).rejects.toThrow(errorMessage);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should maintain consistent logging behavior across multiple queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(modelArb, actionArb, durationArb),
            { minLength: 1, maxLength: 10 },
          ),
          thresholdArb,
          async (queries, threshold) => {
            const capturedLogs: SlowQueryLog[] = [];
            const middleware = createSlowQueryLoggerMiddleware(
              { threshold },
              (log) => capturedLogs.push(log),
            );

            for (const [model, action, duration] of queries) {
              const params = createMockParams(model, action);
              const mockNext = jest.fn().mockImplementation(async () => {
                jest.advanceTimersByTime(duration);
                return {};
              });

              await middleware(params, mockNext);
            }

            // Property: Number of logs should equal number of slow queries
            const expectedSlowQueries = queries.filter(([, , duration]) => duration >= threshold);
            expect(capturedLogs.length).toBe(expectedSlowQueries.length);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
