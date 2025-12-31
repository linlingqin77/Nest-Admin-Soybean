import { RequestIdMiddleware } from './request-id.middleware';
import { Request, Response, NextFunction } from 'express';
import { ClsService } from 'nestjs-cls';

describe('RequestIdMiddleware', () => {
  let middleware: RequestIdMiddleware;
  let mockClsService: jest.Mocked<ClsService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockClsService = {
      set: jest.fn(),
      get: jest.fn(),
      getId: jest.fn(),
    } as unknown as jest.Mocked<ClsService>;

    middleware = new RequestIdMiddleware(mockClsService);

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('use', () => {
    it('should generate a new Request ID when not provided in headers', () => {
      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      // Should set requestId on request object
      expect(mockRequest['requestId']).toBeDefined();
      expect(mockRequest['id']).toBeDefined();
      expect(mockRequest['requestId']).toBe(mockRequest['id']);

      // Should be a valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(mockRequest['requestId']).toMatch(uuidRegex);

      // Should set response header
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-Id', mockRequest['requestId']);

      // Should store in CLS
      expect(mockClsService.set).toHaveBeenCalledWith('requestId', mockRequest['requestId']);

      // Should call next
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use existing Request ID from headers', () => {
      const existingRequestId = 'existing-request-id-12345';
      mockRequest.headers = {
        'x-request-id': existingRequestId,
      };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      // Should use the existing Request ID
      expect(mockRequest['requestId']).toBe(existingRequestId);
      expect(mockRequest['id']).toBe(existingRequestId);

      // Should set response header with existing ID
      expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-Id', existingRequestId);

      // Should store in CLS
      expect(mockClsService.set).toHaveBeenCalledWith('requestId', existingRequestId);

      // Should call next
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle null CLS service gracefully', () => {
      const middlewareWithoutCls = new RequestIdMiddleware(null as unknown as ClsService);

      expect(() => {
        middlewareWithoutCls.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).not.toThrow();

      // Should still set requestId on request object
      expect(mockRequest['requestId']).toBeDefined();

      // Should still set response header
      expect(mockResponse.setHeader).toHaveBeenCalled();

      // Should call next
      expect(mockNext).toHaveBeenCalled();
    });

    it('should generate unique Request IDs for different requests', () => {
      const requestIds: string[] = [];

      for (let i = 0; i < 10; i++) {
        const req: Partial<Request> = { headers: {} };
        middleware.use(req as Request, mockResponse as Response, mockNext);
        requestIds.push(req['requestId']);
      }

      // All Request IDs should be unique
      const uniqueIds = new Set(requestIds);
      expect(uniqueIds.size).toBe(10);
    });
  });
});
