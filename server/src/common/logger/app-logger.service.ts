import { Injectable, Scope, LoggerService } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ClsService } from 'nestjs-cls';

/**
 * AppLogger 服务
 *
 * 统一的日志服务，继承自 PinoLogger，自动注入租户和用户上下文信息
 *
 * @example
 * ```typescript
 * constructor(private readonly logger: AppLogger) {
 *   this.logger.setContext('UserService');
 * }
 *
 * this.logger.log('User created successfully');
 * this.logger.error('Failed to create user', error.stack);
 * ```
 */
@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger implements LoggerService {
  constructor(
    private readonly pinoLogger: PinoLogger,
    private readonly cls: ClsService,
  ) {}

  /**
   * 获取上下文信息（租户ID和用户ID）
   */
  private getContextInfo(): { tenantId?: string | number; userId?: number } {
    const tenantId = this.cls.get('tenantId');
    const userId = this.cls.get('userId');
    const user = this.cls.get('user');

    return {
      tenantId: tenantId || undefined,
      userId: userId || user?.userId || user?.user?.userId || undefined,
    };
  }

  /**
   * 设置日志上下文
   * @param context 上下文名称
   */
  setContext(context: string): void {
    this.pinoLogger.setContext(context);
  }

  /**
   * 记录普通日志
   * @param message 日志消息
   * @param context 上下文名称（可选）
   */
  log(message: string, context?: string): void {
    const contextInfo = this.getContextInfo();
    this.pinoLogger.info({ ...contextInfo, message, context });
  }

  /**
   * 记录错误日志
   * @param message 错误消息
   * @param trace 堆栈信息（可选）
   * @param context 上下文名称（可选）
   */
  error(message: string, trace?: string, context?: string): void {
    const contextInfo = this.getContextInfo();
    this.pinoLogger.error({ ...contextInfo, message, trace, context });
  }

  /**
   * 记录警告日志
   * @param message 警告消息
   * @param context 上下文名称（可选）
   */
  warn(message: string, context?: string): void {
    const contextInfo = this.getContextInfo();
    this.pinoLogger.warn({ ...contextInfo, message, context });
  }

  /**
   * 记录调试日志
   * @param message 调试消息
   * @param context 上下文名称（可选）
   */
  debug(message: string, context?: string): void {
    const contextInfo = this.getContextInfo();
    this.pinoLogger.debug({ ...contextInfo, message, context });
  }

  /**
   * 记录详细日志
   * @param message 详细消息
   * @param context 上下文名称（可选）
   */
  verbose(message: string, context?: string): void {
    const contextInfo = this.getContextInfo();
    this.pinoLogger.trace({ ...contextInfo, message, context });
  }
}
