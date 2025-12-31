import * as fc from 'fast-check';
import { Result } from './result';
import { ResponseCode } from './response.interface';

/**
 * 属性测试：错误响应格式
 *
 * Feature: enterprise-app-optimization
 * Property 12: 错误响应格式
 * Validates: Requirements 6.6
 *
 * 对于任意 API 错误，响应应该符合统一格式：
 * { code: number, msg: string, data: any, requestId: string, timestamp: string }
 */
describe('Result Property-Based Tests', () => {
  /**
   * Property 12: 错误响应格式
   * 对于任意错误码和消息，Result.fail 应该返回符合统一格式的响应
   */
  describe('Property 12: Error Response Format', () => {
    it('should always produce valid error response format for any error code and message', () => {
      // 定义有效的错误码范围
      const errorCodeArb = fc.oneof(
        // 客户端错误码
        fc.constant(ResponseCode.BAD_REQUEST),
        fc.constant(ResponseCode.UNAUTHORIZED),
        fc.constant(ResponseCode.FORBIDDEN),
        fc.constant(ResponseCode.NOT_FOUND),
        fc.constant(ResponseCode.TOO_MANY_REQUESTS),
        // 服务端错误码
        fc.constant(ResponseCode.INTERNAL_SERVER_ERROR),
        fc.constant(ResponseCode.SERVICE_UNAVAILABLE),
        // 业务错误码
        fc.constant(ResponseCode.BUSINESS_ERROR),
        fc.constant(ResponseCode.PARAM_INVALID),
        fc.constant(ResponseCode.DATA_NOT_FOUND),
        fc.constant(ResponseCode.USER_NOT_FOUND),
        fc.constant(ResponseCode.TOKEN_INVALID),
        fc.constant(ResponseCode.TOKEN_EXPIRED),
        fc.constant(ResponseCode.PERMISSION_DENIED),
        fc.constant(ResponseCode.TENANT_NOT_FOUND),
        // 随机数字错误码
        fc.integer({ min: 400, max: 599 }),
        fc.integer({ min: 1000, max: 9999 }),
      );

      fc.assert(
        fc.property(
          errorCodeArb,
          fc.string({ minLength: 0, maxLength: 200 }),
          (code, message) => {
            const result = Result.fail(code, message || undefined);

            // 验证响应格式
            expect(typeof result.code).toBe('number');
            expect(typeof result.msg).toBe('string');
            expect(result.msg.length).toBeGreaterThan(0);
            // data 可以是 null 或任意值
            expect('data' in result).toBe(true);
            // requestId 和 timestamp 是可选的，但字段应该存在
            expect('requestId' in result).toBe(true);
            expect('timestamp' in result).toBe(true);

            // 验证错误码正确传递
            expect(result.code).toBe(code);

            // 验证 isSuccess 返回 false（除非是 200）
            if (code !== ResponseCode.SUCCESS) {
              expect(result.isSuccess()).toBe(false);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should always include requestId and timestamp when set', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.date(),
          fc.integer({ min: 400, max: 599 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (requestId, date, code, message) => {
            const timestamp = date.toISOString();
            const result = new Result(code, message, null, requestId, timestamp);

            // 验证 requestId 和 timestamp 正确设置
            expect(result.requestId).toBe(requestId);
            expect(result.timestamp).toBe(timestamp);

            // 验证 requestId 是有效的 UUID 格式
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            expect(uuidRegex.test(result.requestId!)).toBe(true);

            // 验证 timestamp 是有效的 ISO 8601 格式
            const parsedDate = new Date(result.timestamp!);
            expect(parsedDate.toISOString()).toBe(timestamp);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should produce consistent response structure for all error types', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // 不同类型的错误数据
            fc.constant(null),
            fc.record({ field: fc.string(), error: fc.string() }),
            fc.array(fc.string(), { minLength: 1, maxLength: 5 }),
            fc.record({ errors: fc.array(fc.string()) }),
          ),
          fc.integer({ min: 400, max: 599 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (errorData, code, message) => {
            const result = Result.fail(code, message, errorData);

            // 验证响应结构一致性
            expect(result).toHaveProperty('code');
            expect(result).toHaveProperty('msg');
            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('requestId');
            expect(result).toHaveProperty('timestamp');

            // 验证数据正确传递
            if (errorData !== undefined) {
              expect(result.data).toEqual(errorData);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * 补充属性：成功响应格式一致性
   */
  describe('Success Response Format Consistency', () => {
    it('should produce valid success response format for any data', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(null),
            fc.constant(undefined),
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.record({ id: fc.integer(), name: fc.string() }),
            fc.array(fc.record({ id: fc.integer() })),
          ),
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
          (data, message) => {
            const result = Result.ok(data, message);

            // 验证成功响应格式
            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(typeof result.msg).toBe('string');
            expect(result.msg.length).toBeGreaterThan(0);
            expect(result.isSuccess()).toBe(true);

            // 验证数据正确传递
            if (data !== undefined) {
              expect(result.data).toEqual(data);
            } else {
              expect(result.data).toBeNull();
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * 补充属性：分页响应格式一致性
   */
  describe('Pagination Response Format Consistency', () => {
    it('should produce valid pagination response format', () => {
      fc.assert(
        fc.property(
          fc.array(fc.record({ id: fc.integer(), name: fc.string() }), { minLength: 0, maxLength: 20 }),
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (rows, total, pageNum, pageSize) => {
            const result = Result.page(rows, total, pageNum, pageSize);

            // 验证分页响应格式
            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(result.isSuccess()).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data!.rows).toEqual(rows);
            expect(result.data!.total).toBe(total);
            expect(result.data!.pageNum).toBe(pageNum);
            expect(result.data!.pageSize).toBe(pageSize);

            // 验证页数计算正确
            const expectedPages = Math.ceil(total / pageSize);
            expect(result.data!.pages).toBe(expectedPages);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
