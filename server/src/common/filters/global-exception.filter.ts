import {
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import {
  BusinessException,
  AuthenticationException,
  AuthorizationException,
  ValidationException,
} from '../exceptions/business.exception';
import { ResponseCode } from '../response/response.interface';

/**
 * 全局异常过滤器
 *
 * @description 统一处理所有异常，返回标准化的响应格式
 *
 * 异常处理优先级：
 * 1. BusinessException - 业务异常，返回 HTTP 200
 * 2. AuthenticationException - 认证异常，返回 HTTP 401
 * 3. AuthorizationException - 授权异常，返回 HTTP 403
 * 4. ValidationException / BadRequestException - 参数验证异常，返回 HTTP 400
 * 5. HttpException - 其他 HTTP 异常
 * 6. Error - 未知异常，返回 HTTP 500
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly cls?: ClsService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 获取请求ID用于日志追踪
    const requestId = this.cls?.get?.('requestId') || request.headers['x-request-id'] || '-';

    let httpStatus: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: number = ResponseCode.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let data: any = null;

    // 1. 业务异常处理
    if (exception instanceof BusinessException) {
      const resp = exception.getResponse() as any;
      httpStatus = HttpStatus.OK; // 业务异常返回 200
      code = resp.code ?? ResponseCode.BUSINESS_ERROR;
      message = resp.msg ?? resp.message ?? message;
      data = resp.data ?? null;
    }
    // 2. 认证异常处理
    else if (exception instanceof AuthenticationException) {
      const resp = exception.getResponse() as any;
      httpStatus = HttpStatus.UNAUTHORIZED;
      code = resp.code ?? ResponseCode.UNAUTHORIZED;
      message = resp.msg ?? resp.message ?? '认证失败';
      data = resp.data ?? null;
    }
    // 3. 授权异常处理
    else if (exception instanceof AuthorizationException) {
      const resp = exception.getResponse() as any;
      httpStatus = HttpStatus.FORBIDDEN;
      code = resp.code ?? ResponseCode.FORBIDDEN;
      message = resp.msg ?? resp.message ?? '权限不足';
      data = resp.data ?? null;
    }
    // 4. 参数验证异常处理
    else if (exception instanceof ValidationException || exception instanceof BadRequestException) {
      httpStatus = HttpStatus.BAD_REQUEST;
      code = ResponseCode.PARAM_INVALID;
      const resp = exception.getResponse();
      if (typeof resp === 'object' && resp !== null) {
        const body = resp as any;
        // class-validator 返回的错误消息数组
        if (Array.isArray(body.message)) {
          message = body.message[0];
          data = body.message.length > 1 ? { errors: body.message } : null;
        } else {
          message = body.message ?? body.msg ?? '参数验证失败';
          data = body.data ?? null;
        }
      } else if (typeof resp === 'string') {
        message = resp;
      }
    }
    // 5. 其他 HTTP 异常处理
    else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      code = httpStatus;
      const resp = exception.getResponse();
      if (typeof resp === 'object' && resp !== null) {
        const body = resp as any;
        message = Array.isArray(body.message) ? body.message[0] : (body.message ?? body.msg ?? message);
        data = body.data ?? null;
        // 如果响应中有 code，使用它
        if (body.code !== undefined) {
          code = body.code;
        }
      } else if (typeof resp === 'string') {
        message = resp;
      }
    }
    // 6. 未知异常处理
    else if (exception instanceof Error) {
      message = process.env.NODE_ENV === 'development' ? exception.message : '服务器内部错误';

      // 记录完整错误信息
      this.logger.error(
        {
          requestId,
          message: exception.message,
          stack: exception.stack,
          path: request.url,
          method: request.method,
        },
        'Unhandled Exception',
      );
    }

    // 构建响应体
    const payload: Record<string, any> = {
      code,
      msg: message,
      data,
    };

    // 开发环境添加调试信息
    if (process.env.NODE_ENV === 'development') {
      payload.timestamp = new Date().toISOString();
      payload.path = request.url;
      payload.method = request.method;
      payload.requestId = requestId;
      if (exception instanceof Error) {
        payload.stack = exception.stack?.split('\n').slice(0, 5);
      }
    }

    // 记录错误日志（5xx 错误）
    if (httpStatus >= 500) {
      this.logger.error({
        requestId,
        httpStatus,
        code,
        message,
        path: request.url,
        method: request.method,
        body: this.sanitizeBody(request.body),
      });
    } else if (httpStatus >= 400) {
      // 4xx 错误使用 warn 级别
      this.logger.warn({
        requestId,
        httpStatus,
        code,
        message,
        path: request.url,
        method: request.method,
      });
    }

    response.status(httpStatus).json(payload);
  }

  /**
   * 清理请求体中的敏感信息
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'passwd',
      'pwd',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'secretKey',
      'apiKey',
    ];

    const sanitized = { ...body };
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }
}
