import * as fc from 'fast-check';
import { getResponseMessage, ResponseCode, ResponseMessage } from '@/shared/response/response.interface';

/**
 * Property-Based Tests for ResponseCode and ResponseMessage
 *
 * Feature: api-response-validation
 * Property 11: ResponseCode Message Mapping
 * Validates: Requirements 4.5
 *
 * For any ResponseCode enum value, there SHALL exist a corresponding message
 * in the ResponseMessage map.
 */
describe('ResponseCode Property-Based Tests', () => {
  // Get all ResponseCode enum values (numeric values only)
  const allResponseCodes = Object.values(ResponseCode).filter(
    (value): value is ResponseCode => typeof value === 'number',
  );

  /**
   * Property 11: ResponseCode Message Mapping
   *
   * For any ResponseCode enum value, there SHALL exist a corresponding message
   * in the ResponseMessage map.
   *
   * **Validates: Requirements 4.5**
   */
  describe('Property 11: ResponseCode Message Mapping', () => {
    it('For any ResponseCode enum value, there SHALL exist a corresponding message in ResponseMessage', () => {
      fc.assert(
        fc.property(fc.constantFrom(...allResponseCodes), (code: ResponseCode) => {
          // Property: Every ResponseCode should have a corresponding message
          const message = ResponseMessage[code];

          // Message should exist and be a non-empty string
          return message !== undefined && typeof message === 'string' && message.length > 0;
        }),
        { numRuns: 100 },
      );
    });

    it('For any ResponseCode, getResponseMessage should return a non-empty string', () => {
      fc.assert(
        fc.property(fc.constantFrom(...allResponseCodes), (code: ResponseCode) => {
          const message = getResponseMessage(code);

          // getResponseMessage should always return a non-empty string
          return typeof message === 'string' && message.length > 0;
        }),
        { numRuns: 100 },
      );
    });

    it('ResponseMessage map should have exactly the same keys as ResponseCode enum', () => {
      // Get all keys from ResponseMessage
      const messageKeys = Object.keys(ResponseMessage)
        .map(Number)
        .filter((n) => !isNaN(n));

      // Property: The sets should be equal
      const codeSet = new Set(allResponseCodes);
      const messageKeySet = new Set(messageKeys);

      // Check that both sets have the same size
      expect(codeSet.size).toBe(messageKeySet.size);

      // Check that every code has a message
      for (const code of allResponseCodes) {
        expect(messageKeySet.has(code)).toBe(true);
      }

      // Check that every message key is a valid code
      for (const key of messageKeys) {
        expect(codeSet.has(key as ResponseCode)).toBe(true);
      }
    });

    it('For any ResponseCode, the message should be consistent between ResponseMessage and getResponseMessage', () => {
      fc.assert(
        fc.property(fc.constantFrom(...allResponseCodes), (code: ResponseCode) => {
          const directMessage = ResponseMessage[code];
          const functionMessage = getResponseMessage(code);

          // Both should return the same message
          return directMessage === functionMessage;
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Additional property tests for ResponseCode categories
   */
  describe('ResponseCode Category Validation', () => {
    it('Success code should be 200', () => {
      expect(ResponseCode.SUCCESS).toBe(200);
      expect(ResponseMessage[ResponseCode.SUCCESS]).toBe('操作成功');
    });

    it('Client error codes should be in range 400-499', () => {
      const clientErrorCodes = [
        ResponseCode.BAD_REQUEST,
        ResponseCode.UNAUTHORIZED,
        ResponseCode.FORBIDDEN,
        ResponseCode.NOT_FOUND,
        ResponseCode.METHOD_NOT_ALLOWED,
        ResponseCode.REQUEST_TIMEOUT,
        ResponseCode.CONFLICT,
        ResponseCode.GONE,
        ResponseCode.UNPROCESSABLE_ENTITY,
        ResponseCode.TOO_MANY_REQUESTS,
      ];

      for (const code of clientErrorCodes) {
        expect(code).toBeGreaterThanOrEqual(400);
        expect(code).toBeLessThan(500);
        expect(ResponseMessage[code]).toBeDefined();
      }
    });

    it('Server error codes should be in range 500-599', () => {
      const serverErrorCodes = [
        ResponseCode.INTERNAL_SERVER_ERROR,
        ResponseCode.NOT_IMPLEMENTED,
        ResponseCode.BAD_GATEWAY,
        ResponseCode.SERVICE_UNAVAILABLE,
        ResponseCode.GATEWAY_TIMEOUT,
      ];

      for (const code of serverErrorCodes) {
        expect(code).toBeGreaterThanOrEqual(500);
        expect(code).toBeLessThan(600);
        expect(ResponseMessage[code]).toBeDefined();
      }
    });

    it('Business error codes should be in range 1000-1999', () => {
      const businessErrorCodes = [
        ResponseCode.BUSINESS_ERROR,
        ResponseCode.PARAM_INVALID,
        ResponseCode.DATA_NOT_FOUND,
        ResponseCode.DATA_ALREADY_EXISTS,
        ResponseCode.DATA_IN_USE,
        ResponseCode.OPERATION_FAILED,
      ];

      for (const code of businessErrorCodes) {
        expect(code).toBeGreaterThanOrEqual(1000);
        expect(code).toBeLessThan(2000);
        expect(ResponseMessage[code]).toBeDefined();
      }
    });

    it('Authentication error codes should be in range 2000-2999', () => {
      const authErrorCodes = [
        ResponseCode.TOKEN_INVALID,
        ResponseCode.TOKEN_EXPIRED,
        ResponseCode.TOKEN_REFRESH_EXPIRED,
        ResponseCode.ACCOUNT_DISABLED,
        ResponseCode.ACCOUNT_LOCKED,
        ResponseCode.PASSWORD_ERROR,
        ResponseCode.CAPTCHA_ERROR,
        ResponseCode.PERMISSION_DENIED,
      ];

      for (const code of authErrorCodes) {
        expect(code).toBeGreaterThanOrEqual(2000);
        expect(code).toBeLessThan(3000);
        expect(ResponseMessage[code]).toBeDefined();
      }
    });

    it('User error codes should be in range 3000-3999', () => {
      const userErrorCodes = [
        ResponseCode.USER_NOT_FOUND,
        ResponseCode.USER_ALREADY_EXISTS,
        ResponseCode.USER_DISABLED,
        ResponseCode.PASSWORD_WEAK,
        ResponseCode.OLD_PASSWORD_ERROR,
      ];

      for (const code of userErrorCodes) {
        expect(code).toBeGreaterThanOrEqual(3000);
        expect(code).toBeLessThan(4000);
        expect(ResponseMessage[code]).toBeDefined();
      }
    });

    it('Tenant error codes should be in range 4000-4999', () => {
      const tenantErrorCodes = [
        ResponseCode.TENANT_NOT_FOUND,
        ResponseCode.TENANT_DISABLED,
        ResponseCode.TENANT_EXPIRED,
        ResponseCode.TENANT_QUOTA_EXCEEDED,
      ];

      for (const code of tenantErrorCodes) {
        expect(code).toBeGreaterThanOrEqual(4000);
        expect(code).toBeLessThan(5000);
        expect(ResponseMessage[code]).toBeDefined();
      }
    });

    it('File error codes should be in range 5000-5999', () => {
      const fileErrorCodes = [
        ResponseCode.FILE_NOT_FOUND,
        ResponseCode.FILE_TYPE_NOT_ALLOWED,
        ResponseCode.FILE_SIZE_EXCEEDED,
        ResponseCode.FILE_UPLOAD_FAILED,
      ];

      for (const code of fileErrorCodes) {
        expect(code).toBeGreaterThanOrEqual(5000);
        expect(code).toBeLessThan(6000);
        expect(ResponseMessage[code]).toBeDefined();
      }
    });

    it('External service error codes should be in range 6000-6999', () => {
      const externalErrorCodes = [
        ResponseCode.EXTERNAL_SERVICE_ERROR,
        ResponseCode.REDIS_ERROR,
        ResponseCode.DATABASE_ERROR,
      ];

      for (const code of externalErrorCodes) {
        expect(code).toBeGreaterThanOrEqual(6000);
        expect(code).toBeLessThan(7000);
        expect(ResponseMessage[code]).toBeDefined();
      }
    });
  });
});
