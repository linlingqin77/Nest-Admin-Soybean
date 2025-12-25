import { Test, TestingModule } from '@nestjs/testing';
import {
  BusinessException,
  AuthenticationException,
  AuthorizationException,
  ValidationException,
  NotFoundException,
} from './business.exception';
import { ResponseCode } from '../response/response.interface';

describe('BusinessException', () => {
  describe('constructor', () => {
    it('should create exception with code and default message', () => {
      const exception = new BusinessException(ResponseCode.USER_NOT_FOUND);

      expect(exception.errorCode).toBe(ResponseCode.USER_NOT_FOUND);
      expect(exception.getStatus()).toBe(200); // 业务异常返回 200

      const response = exception.getResponse() as any;
      expect(response.code).toBe(ResponseCode.USER_NOT_FOUND);
      expect(response.msg).toBe('用户不存在');
    });

    it('should create exception with custom message', () => {
      const exception = new BusinessException(ResponseCode.PARAM_INVALID, '邮箱格式不正确');

      const response = exception.getResponse() as any;
      expect(response.msg).toBe('邮箱格式不正确');
    });

    it('should create exception with data', () => {
      const data = { field: 'email', value: 'invalid' };
      const exception = new BusinessException(ResponseCode.PARAM_INVALID, '参数错误', data);

      expect(exception.errorData).toEqual(data);
      const response = exception.getResponse() as any;
      expect(response.data).toEqual(data);
    });
  });

  describe('static throw', () => {
    it('should throw BusinessException', () => {
      expect(() => {
        BusinessException.throw(ResponseCode.USER_NOT_FOUND);
      }).toThrow(BusinessException);
    });
  });

  describe('static throwIf', () => {
    it('should throw when condition is true', () => {
      expect(() => {
        BusinessException.throwIf(true, '用户不存在', ResponseCode.USER_NOT_FOUND);
      }).toThrow(BusinessException);
    });

    it('should not throw when condition is false', () => {
      expect(() => {
        BusinessException.throwIf(false, '用户不存在', ResponseCode.USER_NOT_FOUND);
      }).not.toThrow();
    });
  });

  describe('static throwIfNull', () => {
    it('should throw for null value', () => {
      expect(() => {
        BusinessException.throwIfNull(null);
      }).toThrow(BusinessException);
    });

    it('should throw for undefined value', () => {
      expect(() => {
        BusinessException.throwIfNull(undefined);
      }).toThrow(BusinessException);
    });

    it('should not throw for valid value', () => {
      expect(() => {
        BusinessException.throwIfNull({ id: 1 });
      }).not.toThrow();
    });

    it('should narrow type after assertion', () => {
      const value: string | null = 'test';
      BusinessException.throwIfNull(value);
      // TypeScript should know value is string here
      expect(value.length).toBe(4);
    });
  });

  describe('static throwIfEmpty', () => {
    it('should throw for empty array', () => {
      expect(() => {
        BusinessException.throwIfEmpty([]);
      }).toThrow(BusinessException);
    });

    it('should not throw for non-empty array', () => {
      expect(() => {
        BusinessException.throwIfEmpty([1, 2, 3]);
      }).not.toThrow();
    });
  });
});

describe('AuthenticationException', () => {
  it('should return 401 status', () => {
    const exception = new AuthenticationException();

    expect(exception.getStatus()).toBe(401);
    const response = exception.getResponse() as any;
    expect(response.code).toBe(ResponseCode.UNAUTHORIZED);
  });

  it('should use custom code and message', () => {
    const exception = new AuthenticationException(ResponseCode.TOKEN_EXPIRED, '登录已过期');

    const response = exception.getResponse() as any;
    expect(response.code).toBe(ResponseCode.TOKEN_EXPIRED);
    expect(response.msg).toBe('登录已过期');
  });
});

describe('AuthorizationException', () => {
  it('should return 403 status', () => {
    const exception = new AuthorizationException();

    expect(exception.getStatus()).toBe(403);
    const response = exception.getResponse() as any;
    expect(response.code).toBe(ResponseCode.FORBIDDEN);
  });
});

describe('ValidationException', () => {
  it('should return 400 status with single error', () => {
    const exception = new ValidationException('用户名不能为空');

    expect(exception.getStatus()).toBe(400);
    const response = exception.getResponse() as any;
    expect(response.msg).toBe('用户名不能为空');
    expect(response.data).toBeNull();
  });

  it('should return 400 status with multiple errors', () => {
    const errors = ['用户名不能为空', '密码不能为空'];
    const exception = new ValidationException(errors);

    const response = exception.getResponse() as any;
    expect(response.msg).toBe('用户名不能为空');
    expect(response.data).toEqual({ errors });
  });
});

describe('NotFoundException', () => {
  it('should return 404 status with default message', () => {
    const exception = new NotFoundException();

    expect(exception.getStatus()).toBe(404);
    const response = exception.getResponse() as any;
    expect(response.msg).toBe('资源不存在');
  });

  it('should return 404 status with custom resource name', () => {
    const exception = new NotFoundException('用户');

    const response = exception.getResponse() as any;
    expect(response.msg).toBe('用户不存在');
  });
});
