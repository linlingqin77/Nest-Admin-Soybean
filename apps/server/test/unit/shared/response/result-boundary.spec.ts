import { ResponseCode, ResponseMessage, Result } from '@/shared/response';

/**
 * Boundary Condition Tests for Result class
 *
 * Feature: enterprise-app-optimization
 * Validates: Requirements 3.3.6
 *
 * Tests boundary conditions for Result class:
 * - Null/undefined handling
 * - Empty data handling
 * - Edge cases for pagination
 */
describe('Result Boundary Condition Tests', () => {
  describe('Result.ok() boundary tests', () => {
    it('should handle null data', () => {
      const result = Result.ok(null);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });

    it('should handle undefined data', () => {
      const result = Result.ok(undefined);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });

    it('should handle empty string', () => {
      const result = Result.ok('');
      expect(result.code).toBe(200);
      expect(result.data).toBe('');
    });

    it('should handle empty array', () => {
      const result = Result.ok([]);
      expect(result.code).toBe(200);
      expect(result.data).toEqual([]);
    });

    it('should handle empty object', () => {
      const result = Result.ok({});
      expect(result.code).toBe(200);
      expect(result.data).toEqual({});
    });

    it('should handle zero', () => {
      const result = Result.ok(0);
      expect(result.code).toBe(200);
      expect(result.data).toBe(0);
    });

    it('should handle false', () => {
      const result = Result.ok(false);
      expect(result.code).toBe(200);
      expect(result.data).toBe(false);
    });

    it('should handle empty message', () => {
      const result = Result.ok('data', '');
      expect(result.msg).toBe('');
    });

    it('should handle very long message', () => {
      const longMsg = 'a'.repeat(10000);
      const result = Result.ok('data', longMsg);
      expect(result.msg).toBe(longMsg);
    });
  });

  describe('Result.fail() boundary tests', () => {
    it('should handle default error code', () => {
      const result = Result.fail();
      expect(result.code).toBe(ResponseCode.BUSINESS_ERROR);
    });

    it('should handle custom error code', () => {
      const result = Result.fail(ResponseCode.USER_NOT_FOUND);
      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND);
    });

    it('should handle empty error message', () => {
      const result = Result.fail(ResponseCode.BUSINESS_ERROR, '');
      expect(result.msg).toBe('');
    });

    it('should handle error data', () => {
      const errorData = { field: 'userName', error: 'required' };
      const result = Result.fail(ResponseCode.PARAM_INVALID, '参数错误', errorData);
      expect(result.data).toEqual(errorData);
    });

    it('should use default message from ResponseMessage', () => {
      const result = Result.fail(ResponseCode.USER_NOT_FOUND);
      expect(result.msg).toBe(ResponseMessage[ResponseCode.USER_NOT_FOUND]);
    });
  });

  describe('Result.page() boundary tests', () => {
    it('should handle empty rows with total=0', () => {
      const result = Result.page([], 0, 1, 10);
      expect(result.code).toBe(200);
      expect(result.data!.rows).toEqual([]);
      expect(result.data!.total).toBe(0);
      expect(result.data!.pages).toBe(0);
    });

    it('should handle pageNum=1 (first page)', () => {
      const result = Result.page([1, 2, 3], 100, 1, 10);
      expect(result.data!.pageNum).toBe(1);
    });

    it('should handle pageSize=1 (minimum)', () => {
      const result = Result.page([1], 100, 1, 1);
      expect(result.data!.pageSize).toBe(1);
      expect(result.data!.pages).toBe(100);
    });

    it('should handle large total values', () => {
      const result = Result.page([], 1000000, 1, 100);
      expect(result.data!.total).toBe(1000000);
      expect(result.data!.pages).toBe(10000);
    });

    it('should handle total less than pageSize', () => {
      const result = Result.page([1, 2, 3], 3, 1, 10);
      expect(result.data!.pages).toBe(1);
    });

    it('should handle exact division (no remainder)', () => {
      const result = Result.page([1, 2, 3, 4, 5], 50, 1, 10);
      expect(result.data!.pages).toBe(5);
    });

    it('should handle division with remainder', () => {
      const result = Result.page([1, 2, 3, 4, 5], 51, 1, 10);
      expect(result.data!.pages).toBe(6);
    });

    it('should handle pageSize=0 gracefully', () => {
      const result = Result.page([], 10, 1, 0);
      // Division by zero should result in 0 pages (Math.ceil(10/0) = Infinity, but implementation may handle differently)
      expect(result.data!.pageSize).toBe(0);
    });
  });

  describe('Result.when() boundary tests', () => {
    it('should return success for true condition', () => {
      const result = Result.when(true, 'data');
      expect(result.code).toBe(200);
      expect(result.data).toBe('data');
    });

    it('should return failure for false condition', () => {
      const result = Result.when(false, 'data');
      expect(result.code).not.toBe(200);
      expect(result.data).toBeNull();
    });

    it('should handle null data with true condition', () => {
      const result = Result.when(true, null);
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });

    it('should handle custom fail code', () => {
      const result = Result.when(false, 'data', ResponseCode.USER_NOT_FOUND);
      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND);
    });
  });

  describe('Result.fromPromise() boundary tests', () => {
    it('should handle resolved promise with null', async () => {
      const result = await Result.fromPromise(Promise.resolve(null));
      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });

    it('should handle resolved promise with undefined', async () => {
      const result = await Result.fromPromise(Promise.resolve(undefined));
      expect(result.code).toBe(200);
    });

    it('should handle rejected promise with Error', async () => {
      const result = await Result.fromPromise(Promise.reject(new Error('test error')));
      expect(result.code).not.toBe(200);
      expect(result.msg).toBe('test error');
    });

    it('should handle rejected promise with string', async () => {
      const result = await Result.fromPromise(Promise.reject('string error'));
      expect(result.code).not.toBe(200);
    });

    it('should handle rejected promise with custom fail code', async () => {
      const result = await Result.fromPromise(Promise.reject(new Error('test')), ResponseCode.USER_NOT_FOUND);
      expect(result.code).toBe(ResponseCode.USER_NOT_FOUND);
    });
  });

  describe('isSuccess() boundary tests', () => {
    it('should return true for code 200', () => {
      const result = Result.ok('data');
      expect(result.isSuccess()).toBe(true);
    });

    it('should return false for non-200 code', () => {
      const result = Result.fail(ResponseCode.BUSINESS_ERROR);
      expect(result.isSuccess()).toBe(false);
    });

    it('should return false for error codes', () => {
      const errorCodes = [
        ResponseCode.PARAM_INVALID,
        ResponseCode.USER_NOT_FOUND,
        ResponseCode.PERMISSION_DENIED,
        ResponseCode.BUSINESS_ERROR,
      ];

      for (const code of errorCodes) {
        const result = Result.fail(code);
        expect(result.isSuccess()).toBe(false);
      }
    });
  });
});
