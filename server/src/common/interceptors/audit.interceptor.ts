import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request } from 'express';
import { AuditService, AuditLogData } from '../audit/audit.service';
import { AUDIT_KEY, AuditConfig } from '../decorators/audit.decorator';
import { ClsService } from 'nestjs-cls';

/**
 * 审计日志拦截器
 *
 * @description 自动记录带有 @Audit 装饰器的方法的审计日志
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
    private readonly cls: ClsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditConfig = this.reflector.get<AuditConfig>(AUDIT_KEY, context.getHandler());

    // 如果没有审计装饰器，直接执行
    if (!auditConfig) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    // 存储请求信息到 CLS 上下文
    this.cls.set('request', {
      ip: this.getClientIp(request),
      headers: request.headers,
    });

    // 获取目标信息
    const targetId = this.extractTargetId(request, auditConfig);

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        const auditData: AuditLogData = {
          action: auditConfig.action,
          module: auditConfig.module,
          targetType: auditConfig.targetType,
          targetId,
          oldValue: auditConfig.recordOldValue ? this.cls.get('auditOldValue') : undefined,
          newValue: auditConfig.recordNewValue ? this.safeStringify(request.body) : undefined,
          status: '0',
          duration,
        };

        this.auditService.log(auditData).catch((error) => {
          this.logger.error(`Failed to log audit: ${error.message}`, error.stack);
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const auditData: AuditLogData = {
          action: auditConfig.action,
          module: auditConfig.module,
          targetType: auditConfig.targetType,
          targetId,
          oldValue: auditConfig.recordOldValue ? this.cls.get('auditOldValue') : undefined,
          newValue: auditConfig.recordNewValue ? this.safeStringify(request.body) : undefined,
          status: '1',
          errorMsg: error.message || 'Unknown error',
          duration,
        };

        this.auditService.log(auditData).catch((logError) => {
          this.logger.error(`Failed to log audit error: ${logError.message}`, logError.stack);
        });

        return throwError(() => error);
      }),
    );
  }

  /**
   * 提取目标ID
   */
  private extractTargetId(request: Request, config: AuditConfig): string | undefined {
    if (config.targetIdParam) {
      // 从路由参数中提取
      return (request.params as Record<string, string>)?.[config.targetIdParam]?.toString();
    }
    if (config.targetIdBody) {
      // 从请求体中提取
      return (request.body as Record<string, unknown>)?.[config.targetIdBody]?.toString();
    }
    // 默认尝试从 params.id 提取
    return (request.params as Record<string, string>)?.id?.toString();
  }

  /**
   * 获取客户端IP
   */
  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(',')[0].trim();
    }
    return request.ip || request.socket?.remoteAddress || '0.0.0.0';
  }

  /**
   * 安全的JSON序列化
   */
  private safeStringify(obj: unknown): string | undefined {
    if (!obj) return undefined;
    try {
      // 脱敏敏感字段
      const sanitized = this.sanitizeObject(obj);
      return JSON.stringify(sanitized);
    } catch {
      return undefined;
    }
  }

  /**
   * 脱敏敏感字段
   */
  private sanitizeObject(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;

    const sensitiveFields = ['password', 'token', 'secret', 'credential', 'apiKey', 'privateKey'];
    const result = { ...obj };

    for (const key of Object.keys(result)) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        result[key] = '******';
      } else if (typeof result[key] === 'object') {
        result[key] = this.sanitizeObject(result[key]);
      }
    }

    return result;
  }
}
