/**
 * 租户异常单元测试
 *
 * @description
 * 测试各种租户异常场景
 *
 * _Requirements: 10.6_
 */

import { HttpStatus } from '@nestjs/common';
import {
  CrossTenantAccessException,
  TenantContextMissingException,
  TenantDisabledException,
  TenantException,
  TenantExpiredException,
  TenantFeatureDisabledException,
  TenantNotFoundException,
  TenantQuotaExceededException,
} from '@/core/tenancy/exceptions/tenant.exception';

describe('TenantException', () => {
  describe('TenantException (base class)', () => {
    it('should create exception with default status', () => {
      const exception = new TenantException('测试错误');

      expect(exception.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(exception.getResponse()).toEqual({
        code: HttpStatus.BAD_REQUEST,
        message: '测试错误',
        success: false,
      });
    });

    it('should create exception with custom status', () => {
      const exception = new TenantException('服务器错误', HttpStatus.INTERNAL_SERVER_ERROR);

      expect(exception.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(exception.getResponse()).toEqual({
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '服务器错误',
        success: false,
      });
    });
  });

  describe('TenantNotFoundException', () => {
    it('should create exception with tenantId', () => {
      const exception = new TenantNotFoundException('000001');

      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      const response = exception.getResponse() as any;
      expect(response.message).toContain('000001');
      expect(response.message).toContain('租户不存在');
    });

    it('should create exception without tenantId', () => {
      const exception = new TenantNotFoundException();

      expect(exception.getStatus()).toBe(HttpStatus.NOT_FOUND);
      const response = exception.getResponse() as any;
      expect(response.message).toBe('租户不存在');
    });
  });

  describe('TenantDisabledException', () => {
    it('should create exception with tenantId', () => {
      const exception = new TenantDisabledException('000001');

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = exception.getResponse() as any;
      expect(response.message).toContain('000001');
      expect(response.message).toContain('停用');
    });

    it('should create exception without tenantId', () => {
      const exception = new TenantDisabledException();

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = exception.getResponse() as any;
      expect(response.message).toContain('停用');
      expect(response.message).toContain('联系管理员');
    });
  });

  describe('TenantExpiredException', () => {
    it('should create exception with tenantId', () => {
      const exception = new TenantExpiredException('000001');

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = exception.getResponse() as any;
      expect(response.message).toContain('000001');
      expect(response.message).toContain('过期');
    });

    it('should create exception without tenantId', () => {
      const exception = new TenantExpiredException();

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = exception.getResponse() as any;
      expect(response.message).toContain('过期');
      expect(response.message).toContain('续费');
    });
  });

  describe('TenantContextMissingException', () => {
    it('should create exception with correct message', () => {
      const exception = new TenantContextMissingException();

      expect(exception.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      const response = exception.getResponse() as any;
      expect(response.message).toContain('租户上下文缺失');
      expect(response.message).toContain('登录');
    });
  });

  describe('TenantQuotaExceededException', () => {
    it('should create exception with quota details', () => {
      const exception = new TenantQuotaExceededException('用户数', 100, 100);

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = exception.getResponse() as any;
      expect(response.message).toContain('用户数');
      expect(response.message).toContain('100');
      expect(response.message).toContain('配额');
    });

    it('should create exception with storage quota', () => {
      const exception = new TenantQuotaExceededException('存储空间', 1024, 1024);

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = exception.getResponse() as any;
      expect(response.message).toContain('存储空间');
      expect(response.message).toContain('1024');
    });

    it('should create exception with API call quota', () => {
      const exception = new TenantQuotaExceededException('API调用次数', 10000, 10000);

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = exception.getResponse() as any;
      expect(response.message).toContain('API调用次数');
      expect(response.message).toContain('10000');
    });
  });

  describe('TenantFeatureDisabledException', () => {
    it('should create exception with feature name', () => {
      const exception = new TenantFeatureDisabledException('高级报表');

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = exception.getResponse() as any;
      expect(response.message).toContain('高级报表');
      expect(response.message).toContain('未启用');
    });

    it('should create exception with different feature', () => {
      const exception = new TenantFeatureDisabledException('API访问');

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = exception.getResponse() as any;
      expect(response.message).toContain('API访问');
    });
  });

  describe('CrossTenantAccessException', () => {
    it('should create exception with default message', () => {
      const exception = new CrossTenantAccessException();

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = exception.getResponse() as any;
      expect(response.message).toContain('无权访问');
      expect(response.message).toContain('其他租户');
    });

    it('should create exception with custom message', () => {
      const exception = new CrossTenantAccessException('尝试访问租户 000002 的数据');

      expect(exception.getStatus()).toBe(HttpStatus.FORBIDDEN);
      const response = exception.getResponse() as any;
      expect(response.message).toBe('尝试访问租户 000002 的数据');
    });
  });

  describe('Exception inheritance', () => {
    it('all exceptions should extend TenantException', () => {
      expect(new TenantNotFoundException()).toBeInstanceOf(TenantException);
      expect(new TenantDisabledException()).toBeInstanceOf(TenantException);
      expect(new TenantExpiredException()).toBeInstanceOf(TenantException);
      expect(new TenantContextMissingException()).toBeInstanceOf(TenantException);
      expect(new TenantQuotaExceededException('test', 1, 1)).toBeInstanceOf(TenantException);
      expect(new TenantFeatureDisabledException('test')).toBeInstanceOf(TenantException);
      expect(new CrossTenantAccessException()).toBeInstanceOf(TenantException);
    });

    it('all exceptions should have success: false in response', () => {
      const exceptions = [
        new TenantNotFoundException(),
        new TenantDisabledException(),
        new TenantExpiredException(),
        new TenantContextMissingException(),
        new TenantQuotaExceededException('test', 1, 1),
        new TenantFeatureDisabledException('test'),
        new CrossTenantAccessException(),
      ];

      exceptions.forEach((exception) => {
        const response = exception.getResponse() as any;
        expect(response.success).toBe(false);
      });
    });
  });

  describe('Exception HTTP status codes', () => {
    it('should use correct HTTP status codes', () => {
      expect(new TenantNotFoundException().getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(new TenantDisabledException().getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(new TenantExpiredException().getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(new TenantContextMissingException().getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(new TenantQuotaExceededException('test', 1, 1).getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(new TenantFeatureDisabledException('test').getStatus()).toBe(HttpStatus.FORBIDDEN);
      expect(new CrossTenantAccessException().getStatus()).toBe(HttpStatus.FORBIDDEN);
    });
  });
});
