import { HttpException, HttpStatus } from '@nestjs/common';
import { ResponseCode, getResponseMessage } from '../response/response.interface';

/**
 * 业务异常基类
 *
 * @description 用于统一处理业务逻辑异常，返回给前端友好的错误信息
 * 业务异常统一返回 HTTP 200 状态码，通过 code 字段区分具体错误
 *
 * @example
 * // 使用预定义错误码
 * throw new BusinessException(ResponseCode.USER_NOT_FOUND);
 *
 * // 自定义错误消息
 * throw new BusinessException(ResponseCode.PARAM_INVALID, '用户名不能为空');
 *
 * // 携带额外数据
 * throw new BusinessException(ResponseCode.DATA_IN_USE, '该角色下存在用户', { userCount: 5 });
 */
export class BusinessException extends HttpException {
  /** 业务错误码 */
  public readonly errorCode: number;

  /** 额外数据 */
  public readonly errorData?: any;

  constructor(code: ResponseCode | number, message?: string, data?: any) {
    const msg = message ?? getResponseMessage(code as ResponseCode) ?? '业务处理失败';

    super(
      {
        code,
        msg,
        data: data ?? null,
      },
      HttpStatus.OK, // 业务异常统一返回 200 状态码
    );

    this.errorCode = code;
    this.errorData = data;
  }

  /**
   * 静态方法抛出异常
   */
  static throw(code: ResponseCode | number, message?: string, data?: any): never {
    throw new BusinessException(code, message, data);
  }

  /**
   * 条件抛出异常
   */
  static throwIf(condition: boolean, message?: string, code?: ResponseCode | number, data?: any): void {
    if (condition) {
      throw new BusinessException(code ?? ResponseCode.BUSINESS_ERROR, message, data);
    }
  }

  /**
   * 空值检查并抛出异常
   */
  static throwIfNull<T>(
    value: T | null | undefined,
    message?: string,
    code?: ResponseCode | number,
  ): asserts value is T {
    if (value === null || value === undefined) {
      throw new BusinessException(code ?? ResponseCode.DATA_NOT_FOUND, message);
    }
  }

  /**
   * 空数组检查并抛出异常
   */
  static throwIfEmpty<T>(value: T[], message?: string, code?: ResponseCode | number): asserts value is T[] {
    if (!value || value.length === 0) {
      throw new BusinessException(code ?? ResponseCode.DATA_NOT_FOUND, message);
    }
  }
}

/**
 * 认证异常
 * 用于处理认证相关的错误，返回 HTTP 401 状态码
 */
export class AuthenticationException extends HttpException {
  constructor(code: ResponseCode | number = ResponseCode.UNAUTHORIZED, message?: string) {
    const msg = message ?? getResponseMessage(code as ResponseCode) ?? '认证失败';

    super(
      {
        code,
        msg,
        data: null,
      },
      HttpStatus.UNAUTHORIZED,
    );
  }

  static throw(code: ResponseCode | number, message?: string): never {
    throw new AuthenticationException(code, message);
  }
}

/**
 * 授权异常
 * 用于处理权限不足的错误，返回 HTTP 403 状态码
 */
export class AuthorizationException extends HttpException {
  constructor(code: ResponseCode | number = ResponseCode.FORBIDDEN, message?: string) {
    const msg = message ?? getResponseMessage(code as ResponseCode) ?? '权限不足';

    super(
      {
        code,
        msg,
        data: null,
      },
      HttpStatus.FORBIDDEN,
    );
  }

  static throw(code: ResponseCode | number, message?: string): never {
    throw new AuthorizationException(code, message);
  }
}

/**
 * 参数验证异常
 */
export class ValidationException extends HttpException {
  constructor(errors: string | string[], code: ResponseCode | number = ResponseCode.PARAM_INVALID) {
    const message = Array.isArray(errors) ? errors[0] : errors;
    const data = Array.isArray(errors) && errors.length > 1 ? { errors } : null;

    super(
      {
        code,
        msg: message,
        data,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * 资源未找到异常
 */
export class NotFoundException extends HttpException {
  constructor(resource: string = '资源', code: ResponseCode | number = ResponseCode.DATA_NOT_FOUND) {
    super(
      {
        code,
        msg: `${resource}不存在`,
        data: null,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
