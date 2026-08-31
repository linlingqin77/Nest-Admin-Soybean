import {
  Injectable,
  NestInterceptor,
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { PrismaService } from 'src/platform/prisma';
import {
  OPTIMISTIC_LOCK_KEY,
  OptimisticLockOptions,
  OptimisticLockException,
} from 'src/core/decorators/optimistic-lock.decorator';

/**
 * 乐观锁拦截器
 */
@Injectable()
export class OptimisticLockInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const options = this.reflector.get<Required<OptimisticLockOptions>>(OPTIMISTIC_LOCK_KEY, context.getHandler());

    if (!options || !options.model) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const id = this.getValueFromPath(request, options.idPath);
    const version = this.getValueFromPath(request, options.versionPath);

    if (id === undefined || version === undefined) {
      // 如果没有提供 ID 或版本号，跳过乐观锁检查
      return next.handle();
    }

    // 检查当前版本
    const model = this.prisma[options.model];
    if (!model) {
      throw new Error(`Model ${options.model} not found in Prisma client`);
    }

    const current = await model.findUnique({
      where: { [options.idField]: id },
      select: { [options.versionField]: true },
    });

    if (!current) {
      throw new HttpException('数据不存在', HttpStatus.NOT_FOUND);
    }

    const currentVersion = current[options.versionField];
    if (currentVersion !== version) {
      throw new OptimisticLockException(options.message);
    }

    // 在请求中注入新版本号，供 Service 使用
    if (request.body) {
      request.body[options.versionField] = currentVersion + 1;
    }

    return next.handle();
  }

  /**
   * 从请求对象中获取指定路径的值
   */
  private getValueFromPath(request: any, path: string): any {
    const parts = path.split('.');
    let value = request;

    for (const part of parts) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }
}
