import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TRANSACTIONAL_KEY,
  TransactionalOptions,
  IsolationLevel,
  Propagation,
} from '../decorators/transactional.decorator';
import { Prisma } from '@prisma/client';

/**
 * Prisma 隔离级别映射
 */
const ISOLATION_LEVEL_MAP: Record<IsolationLevel, Prisma.TransactionIsolationLevel> = {
  [IsolationLevel.ReadUncommitted]: Prisma.TransactionIsolationLevel.ReadUncommitted,
  [IsolationLevel.ReadCommitted]: Prisma.TransactionIsolationLevel.ReadCommitted,
  [IsolationLevel.RepeatableRead]: Prisma.TransactionIsolationLevel.RepeatableRead,
  [IsolationLevel.Serializable]: Prisma.TransactionIsolationLevel.Serializable,
};

/**
 * 事务拦截器
 *
 * @description 拦截带有 @Transactional 装饰器的方法，自动包装在事务中执行
 */
@Injectable()
export class TransactionalInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TransactionalInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<TransactionalOptions>(TRANSACTIONAL_KEY, context.getHandler());

    // 如果没有事务装饰器，直接执行
    if (!options) {
      return next.handle();
    }

    // 只读事务不需要包装
    if (options.readOnly) {
      return next.handle();
    }

    // 处理事务传播行为
    switch (options.propagation) {
      case Propagation.NOT_SUPPORTED:
      case Propagation.NEVER:
        return next.handle();

      case Propagation.SUPPORTS:
        // 如果当前没有事务上下文，直接执行
        return next.handle();

      case Propagation.REQUIRED:
      case Propagation.REQUIRES_NEW:
      case Propagation.MANDATORY:
      default:
        return this.executeInTransaction(next, options);
    }
  }

  /**
   * 在事务中执行
   */
  private executeInTransaction(next: CallHandler, options: TransactionalOptions): Observable<any> {
    return from(
      this.prisma.$transaction(
        async (tx) => {
          // 将事务客户端注入到请求上下文
          // 这里需要配合 CLS 模块使用
          return new Promise((resolve, reject) => {
            next.handle().subscribe({
              next: (value) => resolve(value),
              error: (err) => {
                // 检查是否需要回滚
                if (this.shouldRollback(err, options)) {
                  reject(err);
                } else {
                  resolve(err);
                }
              },
            });
          });
        },
        {
          isolationLevel: ISOLATION_LEVEL_MAP[options.isolationLevel || IsolationLevel.ReadCommitted],
          timeout: options.timeout,
        },
      ),
    ).pipe(
      mergeMap((result) => {
        if (result instanceof Error) {
          throw result;
        }
        return [result];
      }),
    );
  }

  /**
   * 判断是否需要回滚
   */
  private shouldRollback(error: Error, options: TransactionalOptions): boolean {
    // 检查 noRollbackFor
    if (options.noRollbackFor?.length) {
      for (const ExceptionType of options.noRollbackFor) {
        if (error instanceof ExceptionType) {
          return false;
        }
      }
    }

    // 检查 rollbackFor
    if (options.rollbackFor?.length) {
      for (const ExceptionType of options.rollbackFor) {
        if (error instanceof ExceptionType) {
          return true;
        }
      }
      // 如果指定了 rollbackFor，但错误不在列表中，不回滚
      return false;
    }

    // 默认所有异常都回滚
    return true;
  }
}
