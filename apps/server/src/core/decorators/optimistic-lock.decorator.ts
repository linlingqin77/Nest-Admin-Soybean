import { applyDecorators, HttpException, HttpStatus, SetMetadata, UseInterceptors } from '@nestjs/common';
import { OptimisticLockInterceptor } from 'src/core/http/interceptors/optimistic-lock.interceptor';

export const OPTIMISTIC_LOCK_KEY = 'OPTIMISTIC_LOCK';

/**
 * 乐观锁配置选项
 */
export interface OptimisticLockOptions {
  /** 模型名称（Prisma 模型名，如 'sysUser'） */
  model: string;
  /** 主键字段名，默认 'id' */
  idField?: string;
  /** 从请求中获取 ID 的路径，如 'body.userId' 或 'params.id' */
  idPath?: string;
  /** 版本字段名，默认 'version' */
  versionField?: string;
  /** 从请求中获取版本的路径，如 'body.version' */
  versionPath?: string;
  /** 冲突时的错误消息 */
  message?: string;
}

/**
 * 默认配置
 */
const DEFAULT_OPTIONS: Required<Omit<OptimisticLockOptions, 'model'>> & { model: string } = {
  model: '',
  idField: 'id',
  idPath: 'body.id',
  versionField: 'version',
  versionPath: 'body.version',
  message: '数据已被其他用户修改，请刷新后重试',
};

/**
 * 乐观锁冲突异常
 */
export class OptimisticLockException extends HttpException {
  constructor(message: string = '数据已被其他用户修改，请刷新后重试') {
    super(message, HttpStatus.CONFLICT);
  }
}

/**
 * 乐观锁装饰器
 *
 * @description
 * 用于实现乐观锁机制，防止并发更新导致的数据覆盖问题。
 * 在更新操作时，会检查数据库中的版本号是否与请求中的版本号一致，
 * 如果不一致则抛出冲突异常。
 *
 * 注意：使用此装饰器的模型需要有 version 字段（Int 类型）
 *
 * @example
 * ```typescript
 * // 在 Prisma schema 中添加 version 字段
 * model SysConfig {
 *   configId  Int     @id @default(autoincrement())
 *   configKey String
 *   configValue String
 *   version   Int     @default(0)
 * }
 *
 * // 在 Service 中使用
 * @OptimisticLock({
 *   model: 'sysConfig',
 *   idField: 'configId',
 *   idPath: 'body.configId',
 * })
 * async update(updateDto: UpdateConfigDto) {
 *   // 更新逻辑
 * }
 * ```
 *
 * @param options 乐观锁配置
 */
export function OptimisticLock(options: OptimisticLockOptions) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  return applyDecorators(SetMetadata(OPTIMISTIC_LOCK_KEY, mergedOptions), UseInterceptors(OptimisticLockInterceptor));
}

export { OptimisticLockInterceptor };

/**
 * 乐观锁更新辅助函数
 *
 * @description
 * 用于在 Service 中执行带乐观锁的更新操作。
 * 会自动递增版本号并处理并发冲突。
 *
 * @example
 * ```typescript
 * const result = await optimisticUpdate(
 *   this.prisma.sysConfig,
 *   { configId: dto.configId },
 *   dto.version,
 *   { configValue: dto.configValue }
 * );
 * ```
 */
export async function optimisticUpdate<T>(
  model: any,
  where: Record<string, any>,
  expectedVersion: number,
  data: Record<string, any>,
  versionField: string = 'version',
): Promise<T> {
  // 使用 updateMany 配合版本条件实现原子性更新
  const result = await model.updateMany({
    where: {
      ...where,
      [versionField]: expectedVersion,
    },
    data: {
      ...data,
      [versionField]: expectedVersion + 1,
    },
  });

  if (result.count === 0) {
    throw new OptimisticLockException();
  }

  // 返回更新后的数据
  return model.findUnique({ where });
}
