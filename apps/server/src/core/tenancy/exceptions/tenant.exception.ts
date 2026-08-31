import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 租户异常基类
 */
export class TenantException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(
      {
        code: status,
        message,
        success: false,
      },
      status,
    );
  }
}

/**
 * 租户未找到异常
 */
export class TenantNotFoundException extends TenantException {
  constructor(tenantId?: string) {
    super(tenantId ? `租户不存在: ${tenantId}` : '租户不存在', HttpStatus.NOT_FOUND);
  }
}

/**
 * 租户已禁用异常
 */
export class TenantDisabledException extends TenantException {
  constructor(tenantId?: string) {
    super(tenantId ? `租户已被停用: ${tenantId}` : '租户已被停用，请联系管理员', HttpStatus.FORBIDDEN);
  }
}

/**
 * 租户已过期异常
 */
export class TenantExpiredException extends TenantException {
  constructor(tenantId?: string) {
    super(tenantId ? `租户已过期: ${tenantId}` : '租户已过期，请联系管理员续费', HttpStatus.FORBIDDEN);
  }
}

/**
 * 租户上下文缺失异常
 */
export class TenantContextMissingException extends TenantException {
  constructor() {
    super('租户上下文缺失，请确保已登录', HttpStatus.UNAUTHORIZED);
  }
}

/**
 * 租户配额超限异常
 */
export class TenantQuotaExceededException extends TenantException {
  constructor(resource: string, current: number, limit: number) {
    super(`租户${resource}配额已用尽，当前使用: ${current}，配额上限: ${limit}`, HttpStatus.FORBIDDEN);
  }
}

/**
 * 租户功能未启用异常
 */
export class TenantFeatureDisabledException extends TenantException {
  constructor(feature: string) {
    super(`功能 ${feature} 未启用，请联系管理员`, HttpStatus.FORBIDDEN);
  }
}

/**
 * 跨租户访问异常
 */
export class CrossTenantAccessException extends TenantException {
  constructor(message?: string) {
    super(message || '无权访问其他租户的数据', HttpStatus.FORBIDDEN);
  }
}
