import { Injectable, Logger, Optional, Scope } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

/**
 * 日志上下文类型
 */
export interface LogContext {
  /** 操作动作 */
  action?: string;
  /** 模块名称 */
  modules?: string;
  /** 用户ID */
  userId?: number;
  /** 租户ID */
  tenantId?: number;
  /** 请求ID */
  requestId?: string;
  /** 额外数据 */
  [key: string]: unknown;
}

/**
 * 结构化日志服务
 *
 * 提供统一的结构化日志记录方法，自动注入请求上下文信息。
 * 遵循企业级日志最佳实践。
 *
 * @example
 * // 在 Service 中使用
 * @Injectable()
 * export class UserService {
 *   private readonly structuredLogger: StructuredLoggerService;
 *
 *   constructor(
 *     private readonly cls: ClsService,
 *     logger: Logger,
 *   ) {
 *     this.structuredLogger = new StructuredLoggerService(cls, UserService.name);
 *   }
 *
 *   async createUser(dto: CreateUserDto) {
 *     this.structuredLogger.info({ action: 'user.create', username: dto.username });
 *     // ...
 *   }
 * }
 */
@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLoggerService {
  private readonly logger: Logger;

  constructor(
    private readonly cls: ClsService,
    @Optional()
    context?: string,
  ) {
    this.logger = new Logger(context || 'Application');
  }

  /**
   * 设置日志上下文名称
   */
  setContext(context: string): void {
    // @ts-ignore - accessing private property for context update
    this.logger.context = context;
  }

  /**
   * 获取请求上下文信息
   */
  private getRequestContext(): Partial<LogContext> {
    try {
      return {
        requestId: this.cls.get('requestId'),
        userId: this.cls.get('userId'),
        tenantId: this.cls.get('tenantId'),
      };
    } catch {
      return {};
    }
  }

  /**
   * 构建完整的日志上下文
   */
  private buildContext(context?: LogContext): LogContext {
    return {
      ...this.getRequestContext(),
      ...context,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 记录错误日志
   *
   * 用于记录系统错误、异常、严重问题。
   *
   * @param message 错误消息或 Error 对象
   * @param context 日志上下文
   */
  error(message: string | Error, context?: LogContext): void {
    const ctx = this.buildContext(context);

    if (message instanceof Error) {
      this.logger.error({
        ...ctx,
        error: message.message,
        stack: message.stack?.split('\n').slice(0, 10),
      });
    } else {
      this.logger.error({ ...ctx, message });
    }
  }

  /**
   * 记录警告日志
   *
   * 用于记录警告信息、潜在问题、已处理的异常。
   *
   * @param message 警告消息
   * @param context 日志上下文
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn({ ...this.buildContext(context), message });
  }

  /**
   * 记录信息日志
   *
   * 用于记录重要业务操作、状态变更。
   *
   * @param context 日志上下文（必须包含 action 字段）
   */
  info(context: LogContext & { action: string }): void {
    this.logger.log(this.buildContext(context));
  }

  /**
   * 记录调试日志
   *
   * 用于记录调试信息、详细流程追踪。
   *
   * @param message 调试消息
   * @param context 日志上下文
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug({ ...this.buildContext(context), message });
  }

  /**
   * 记录详细日志
   *
   * 用于记录非常详细的追踪信息。
   *
   * @param message 详细消息
   * @param context 日志上下文
   */
  verbose(message: string, context?: LogContext): void {
    this.logger.verbose({ ...this.buildContext(context), message });
  }

  /**
   * 记录业务操作日志
   *
   * 专门用于记录业务操作，自动包含操作结果。
   *
   * @param action 操作名称
   * @param success 是否成功
   * @param context 额外上下文
   */
  logOperation(action: string, success: boolean, context?: Omit<LogContext, 'action'>): void {
    const level = success ? 'info' : 'warn';
    const ctx = this.buildContext({ ...context, action, success });

    if (level === 'info') {
      this.logger.log(ctx);
    } else {
      this.logger.warn(ctx);
    }
  }

  /**
   * 记录数据库操作日志
   *
   * @param operation 操作类型 (create, read, update, delete)
   * @param table 表名
   * @param duration 执行时间（毫秒）
   * @param context 额外上下文
   */
  logDbOperation(
    operation: 'create' | 'read' | 'update' | 'delete',
    table: string,
    duration: number,
    context?: Omit<LogContext, 'action'>,
  ): void {
    const isSlowQuery = duration > 1000; // 超过 1 秒为慢查询
    const ctx = this.buildContext({
      ...context,
      action: `db.${operation}`,
      table,
      duration,
      slow: isSlowQuery,
    });

    if (isSlowQuery) {
      this.logger.warn(ctx);
    } else {
      this.logger.debug(ctx);
    }
  }

  /**
   * 记录外部服务调用日志
   *
   * @param service 服务名称
   * @param operation 操作名称
   * @param duration 执行时间（毫秒）
   * @param success 是否成功
   * @param context 额外上下文
   */
  logExternalCall(
    service: string,
    operation: string,
    duration: number,
    success: boolean,
    context?: Omit<LogContext, 'action'>,
  ): void {
    const ctx = this.buildContext({
      ...context,
      action: `external.${service}.${operation}`,
      duration,
      success,
    });

    if (success) {
      this.logger.log(ctx);
    } else {
      this.logger.error(ctx);
    }
  }
}

/**
 * 日志装饰器工厂
 *
 * 自动为方法添加日志记录。
 *
 * @param action 操作名称
 * @param options 选项
 */
export function Log(action: string, options?: { logParams?: boolean; logResult?: boolean }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = new Logger(target.constructor.name);
      const startTime = Date.now();

      const logContext: Record<string, unknown> = {
        action,
        method: propertyKey,
      };

      if (options?.logParams) {
        logContext.params = args;
      }

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        logger.log({
          ...logContext,
          success: true,
          duration,
          ...(options?.logResult ? { result } : {}),
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        logger.error({
          ...logContext,
          success: false,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    };

    return descriptor;
  };
}
