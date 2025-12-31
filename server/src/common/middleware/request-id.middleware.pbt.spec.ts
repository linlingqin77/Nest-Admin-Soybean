/**
 * Request ID Middleware Property-Based Tests
 *
 * Feature: enterprise-app-optimization
 * Property 14: 请求追踪
 * Validates: Requirements 2.5
 *
 * This test verifies that request tracing is correctly implemented:
 * For any HTTP request, the response header should contain X-Request-Id,
 * and that ID should appear in all related logs.
 */

import * as fc from 'fast-check';
import { RequestIdMiddleware } from './request-id.middleware';
import { getRequestId } from '../logger/pino-logger.config';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';

describe('Request Tracing Property-Based Tests', () => {
  /**
   * Property 14: Request Tracing
   *
   * For any HTTP request, the response header should contain X-Request-Id,
   * and that ID should appear in all related logs.
   *
   * **Validates: Requirements 2.5**
   */
  describe('Property 14: Request Tracing', () => {
    let middleware: RequestIdMiddleware;
    let mockClsService: jest.Mocked<ClsService>;

    beforeEach(() => {
      mockClsService = {
        set: jest.fn(),
        get: jest.fn(),
        getId: jest.fn(),
      } as unknown as jest.Mocked<ClsService>;

      middleware = new RequestIdMiddleware(mockClsService);
    });

    // Generator for valid UUID v4 format (lowercase)
    const uuidV4Arb = fc.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );

    // Generator for arbitrary request IDs (could be UUID or custom format)
    const requestIdArb = fc.oneof(
      uuidV4Arb,
      fc.stringMatching(/^[a-zA-Z0-9-]{8,64}$/),
    );

    // Generator for HTTP headers
    const headersArb = fc.record({
      'content-type': fc.constant('application/json'),
      'user-agent': fc.stringMatching(/^[a-zA-Z0-9\s./-]{1,100}$/),
    });

    it('should always set X-Request-Id response header for any request', async () => {
      await fc.assert(
        fc.asyncProperty(headersArb, async (headers) => {
          const mockRequest: Partial<Request> = {
            headers: headers as any,
          };

          let responseHeaderSet = false;
          let responseHeaderValue: string | undefined;

          const mockResponse: Partial<Response> = {
            setHeader: jest.fn((name: string, value: string) => {
              if (name === 'X-Request-Id') {
                responseHeaderSet = true;
                responseHeaderValue = value;
              }
              return mockResponse as Response;
            }),
          };

          const mockNext: NextFunction = jest.fn();

          middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

          // Property: Response header X-Request-Id must always be set
          expect(responseHeaderSet).toBe(true);
          expect(responseHeaderValue).toBeDefined();
          expect(typeof responseHeaderValue).toBe('string');
          expect(responseHeaderValue!.length).toBeGreaterThan(0);

          // Property: next() must always be called
          expect(mockNext).toHaveBeenCalled();
        }),
        { numRuns: 100 },
      );
    });

    it('should preserve existing X-Request-Id from request headers', async () => {
      await fc.assert(
        fc.asyncProperty(requestIdArb, async (existingRequestId) => {
          const mockRequest: Partial<Request> = {
            headers: {
              'x-request-id': existingRequestId,
            },
          };

          let responseHeaderValue: string | undefined;

          const mockResponse: Partial<Response> = {
            setHeader: jest.fn((name: string, value: string) => {
              if (name === 'X-Request-Id') {
                responseHeaderValue = value;
              }
              return mockResponse as Response;
            }),
          };

          const mockNext: NextFunction = jest.fn();

          middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

          // Property: When X-Request-Id is provided in request, it should be preserved in response
          expect(responseHeaderValue).toBe(existingRequestId);

          // Property: Request object should have the same requestId
          expect(mockRequest['requestId']).toBe(existingRequestId);
          expect(mockRequest['id']).toBe(existingRequestId);
        }),
        { numRuns: 100 },
      );
    });

    it('should generate unique Request IDs when not provided', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 2, max: 20 }), async (numRequests) => {
          const generatedIds: string[] = [];

          for (let i = 0; i < numRequests; i++) {
            const mockRequest: Partial<Request> = {
              headers: {},
            };

            const mockResponse: Partial<Response> = {
              setHeader: jest.fn((name: string, value: string) => {
                if (name === 'X-Request-Id') {
                  generatedIds.push(value);
                }
                return mockResponse as Response;
              }),
            };

            const mockNext: NextFunction = jest.fn();

            middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
          }

          // Property: All generated Request IDs should be unique
          const uniqueIds = new Set(generatedIds);
          expect(uniqueIds.size).toBe(numRequests);
        }),
        { numRuns: 100 },
      );
    });

    it('should store Request ID in CLS context for logging', async () => {
      await fc.assert(
        fc.asyncProperty(requestIdArb, async (existingRequestId) => {
          const clsSetCalls: Array<{ key: string; value: any }> = [];

          const mockClsServiceWithTracking = {
            set: jest.fn((key: string, value: any) => {
              clsSetCalls.push({ key, value });
            }),
            get: jest.fn(),
            getId: jest.fn(),
          } as unknown as jest.Mocked<ClsService>;

          const middlewareWithTracking = new RequestIdMiddleware(mockClsServiceWithTracking);

          const mockRequest: Partial<Request> = {
            headers: {
              'x-request-id': existingRequestId,
            },
          };

          const mockResponse: Partial<Response> = {
            setHeader: jest.fn().mockReturnThis(),
          };

          const mockNext: NextFunction = jest.fn();

          middlewareWithTracking.use(mockRequest as Request, mockResponse as Response, mockNext);

          // Property: Request ID should be stored in CLS context
          const requestIdCall = clsSetCalls.find((call) => call.key === 'requestId');
          expect(requestIdCall).toBeDefined();
          expect(requestIdCall!.value).toBe(existingRequestId);
        }),
        { numRuns: 100 },
      );
    });

    it('should ensure getRequestId returns consistent value from request object', async () => {
      await fc.assert(
        fc.asyncProperty(requestIdArb, async (requestId) => {
          // Test with requestId property
          const reqWithRequestId = {
            requestId,
            headers: {},
          } as unknown as Request;
          expect(getRequestId(reqWithRequestId)).toBe(requestId);

          // Test with id property
          const reqWithId = {
            id: requestId,
            headers: {},
          } as unknown as Request;
          expect(getRequestId(reqWithId)).toBe(requestId);

          // Test with header
          const reqWithHeader = {
            headers: {
              'x-request-id': requestId,
            },
          } as unknown as Request;
          expect(getRequestId(reqWithHeader)).toBe(requestId);
        }),
        { numRuns: 100 },
      );
    });

    it('should maintain Request ID consistency between request, response, and CLS', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.option(requestIdArb, { nil: undefined }),
          async (maybeExistingRequestId) => {
            let responseRequestId: string | undefined;
            let clsRequestId: string | undefined;

            const mockClsServiceWithTracking = {
              set: jest.fn((key: string, value: any) => {
                if (key === 'requestId') {
                  clsRequestId = value;
                }
              }),
              get: jest.fn(),
              getId: jest.fn(),
            } as unknown as jest.Mocked<ClsService>;

            const middlewareWithTracking = new RequestIdMiddleware(mockClsServiceWithTracking);

            const mockRequest: Partial<Request> = {
              headers: maybeExistingRequestId
                ? { 'x-request-id': maybeExistingRequestId }
                : {},
            };

            const mockResponse: Partial<Response> = {
              setHeader: jest.fn((name: string, value: string) => {
                if (name === 'X-Request-Id') {
                  responseRequestId = value;
                }
                return mockResponse as Response;
              }),
            };

            const mockNext: NextFunction = jest.fn();

            middlewareWithTracking.use(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: All three locations should have the same Request ID
            const requestRequestId = mockRequest['requestId'];

            expect(requestRequestId).toBeDefined();
            expect(responseRequestId).toBeDefined();
            expect(clsRequestId).toBeDefined();

            expect(requestRequestId).toBe(responseRequestId);
            expect(requestRequestId).toBe(clsRequestId);

            // If existing Request ID was provided, it should be preserved
            if (maybeExistingRequestId) {
              expect(requestRequestId).toBe(maybeExistingRequestId);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should generate valid UUID v4 format when no Request ID is provided', async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const mockRequest: Partial<Request> = {
            headers: {},
          };

          let generatedRequestId: string | undefined;

          const mockResponse: Partial<Response> = {
            setHeader: jest.fn((name: string, value: string) => {
              if (name === 'X-Request-Id') {
                generatedRequestId = value;
              }
              return mockResponse as Response;
            }),
          };

          const mockNext: NextFunction = jest.fn();

          middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

          // Property: Generated Request ID should be a valid UUID v4
          const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          expect(generatedRequestId).toMatch(uuidV4Regex);
        }),
        { numRuns: 100 },
      );
    });
  });
});
