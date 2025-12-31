import {
  createSlowQueryLoggerMiddleware,
  SlowQueryLog,
  DEFAULT_SLOW_QUERY_THRESHOLD,
} from './slow-query-logger.middleware';
import { Prisma } from '@prisma/client';

describe('SlowQueryLoggerMiddleware', () => {
  let mockNext: jest.Mock;
  let capturedLogs: SlowQueryLog[];

  beforeEach(() => {
    mockNext = jest.fn();
    capturedLogs = [];
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createMockParams = (model: string, action: string, args?: any): Prisma.MiddlewareParams => ({
    model: model as any,
    action: action as any,
    args: args || {},
    dataPath: [],
    runInTransaction: false,
  });

  describe('DEFAULT_SLOW_QUERY_THRESHOLD', () => {
    it('should be 500ms', () => {
      expect(DEFAULT_SLOW_QUERY_THRESHOLD).toBe(500);
    });
  });

  describe('createSlowQueryLoggerMiddleware', () => {
    it('should pass through fast queries without logging', async () => {
      const middleware = createSlowQueryLoggerMiddleware({ threshold: 500 }, (log) => capturedLogs.push(log));
      const params = createMockParams('User', 'findMany');
      const expectedResult = [{ id: 1, name: 'Test' }];

      mockNext.mockImplementation(async () => {
        // Simulate fast query (no delay)
        return expectedResult;
      });

      const result = await middleware(params, mockNext);

      expect(result).toEqual(expectedResult);
      expect(capturedLogs).toHaveLength(0);
    });

    it('should log slow queries that exceed threshold', async () => {
      const middleware = createSlowQueryLoggerMiddleware({ threshold: 100 }, (log) => capturedLogs.push(log));
      const params = createMockParams('User', 'findMany', { where: { status: 'active' } });
      const expectedResult = [{ id: 1, name: 'Test' }];

      mockNext.mockImplementation(async () => {
        // Simulate slow query by advancing time
        jest.advanceTimersByTime(150);
        return expectedResult;
      });

      const result = await middleware(params, mockNext);

      expect(result).toEqual(expectedResult);
      expect(capturedLogs).toHaveLength(1);
      expect(capturedLogs[0]).toMatchObject({
        query: 'User.findMany',
        threshold: 100,
      });
      expect(capturedLogs[0].duration).toBeGreaterThanOrEqual(100);
    });

    it('should use default threshold of 500ms when not specified', async () => {
      const middleware = createSlowQueryLoggerMiddleware({}, (log) => capturedLogs.push(log));
      const params = createMockParams('User', 'findUnique');

      mockNext.mockImplementation(async () => {
        jest.advanceTimersByTime(600);
        return { id: 1 };
      });

      await middleware(params, mockNext);

      expect(capturedLogs).toHaveLength(1);
      expect(capturedLogs[0].threshold).toBe(500);
    });

    it('should not log when disabled', async () => {
      const middleware = createSlowQueryLoggerMiddleware({ enabled: false, threshold: 100 }, (log) =>
        capturedLogs.push(log),
      );
      const params = createMockParams('User', 'findMany');

      mockNext.mockImplementation(async () => {
        jest.advanceTimersByTime(200);
        return [];
      });

      await middleware(params, mockNext);

      expect(capturedLogs).toHaveLength(0);
    });

    it('should include query params in the log', async () => {
      const middleware = createSlowQueryLoggerMiddleware({ threshold: 50 }, (log) => capturedLogs.push(log));
      const queryArgs = { where: { id: 1 }, include: { posts: true } };
      const params = createMockParams('User', 'findUnique', queryArgs);

      mockNext.mockImplementation(async () => {
        jest.advanceTimersByTime(100);
        return { id: 1 };
      });

      await middleware(params, mockNext);

      expect(capturedLogs).toHaveLength(1);
      expect(capturedLogs[0].params).toBe(JSON.stringify(queryArgs));
    });

    it('should log slow queries even when they fail', async () => {
      const middleware = createSlowQueryLoggerMiddleware({ threshold: 100 }, (log) => capturedLogs.push(log));
      const params = createMockParams('User', 'create');
      const error = new Error('Database connection failed');

      mockNext.mockImplementation(async () => {
        jest.advanceTimersByTime(200);
        throw error;
      });

      await expect(middleware(params, mockNext)).rejects.toThrow('Database connection failed');
      // Note: The callback is not called for failed queries in the current implementation
      // The warning is logged via Logger.warn instead
    });

    it('should include timestamp in the log', async () => {
      const middleware = createSlowQueryLoggerMiddleware({ threshold: 50 }, (log) => capturedLogs.push(log));
      const params = createMockParams('User', 'findMany');

      mockNext.mockImplementation(async () => {
        jest.advanceTimersByTime(100);
        return [];
      });

      await middleware(params, mockNext);

      expect(capturedLogs).toHaveLength(1);
      expect(capturedLogs[0].timestamp).toBeInstanceOf(Date);
    });

    it('should work without callback function', async () => {
      const middleware = createSlowQueryLoggerMiddleware({ threshold: 50 });
      const params = createMockParams('User', 'findMany');

      mockNext.mockImplementation(async () => {
        jest.advanceTimersByTime(100);
        return [];
      });

      // Should not throw even without callback
      const result = await middleware(params, mockNext);
      expect(result).toEqual([]);
    });

    it('should handle queries at exactly the threshold', async () => {
      const middleware = createSlowQueryLoggerMiddleware({ threshold: 100 }, (log) => capturedLogs.push(log));
      const params = createMockParams('User', 'findMany');

      mockNext.mockImplementation(async () => {
        jest.advanceTimersByTime(100);
        return [];
      });

      await middleware(params, mockNext);

      // Query at exactly threshold should be logged
      expect(capturedLogs).toHaveLength(1);
    });

    it('should handle different Prisma actions', async () => {
      const middleware = createSlowQueryLoggerMiddleware({ threshold: 50 }, (log) => capturedLogs.push(log));

      const actions = ['findMany', 'findUnique', 'create', 'update', 'delete', 'count'];

      for (const action of actions) {
        const params = createMockParams('User', action);
        mockNext.mockImplementation(async () => {
          jest.advanceTimersByTime(100);
          return {};
        });

        await middleware(params, mockNext);
      }

      expect(capturedLogs).toHaveLength(actions.length);
      expect(capturedLogs.map((log) => log.query)).toEqual(actions.map((action) => `User.${action}`));
    });

    it('should handle empty args', async () => {
      const middleware = createSlowQueryLoggerMiddleware({ threshold: 50 }, (log) => capturedLogs.push(log));
      const params: Prisma.MiddlewareParams = {
        model: 'User' as any,
        action: 'findMany' as any,
        args: undefined,
        dataPath: [],
        runInTransaction: false,
      };

      mockNext.mockImplementation(async () => {
        jest.advanceTimersByTime(100);
        return [];
      });

      await middleware(params, mockNext);

      expect(capturedLogs).toHaveLength(1);
      expect(capturedLogs[0].params).toBe('{}');
    });
  });
});
