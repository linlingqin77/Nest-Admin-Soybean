import { Result, ResponseCode } from '../response';

/**
 * 批量操作结果项
 */
export interface BatchResultItem<T = unknown> {
  /** 操作索引 */
  index: number;
  /** 是否成功 */
  success: boolean;
  /** 成功时返回的数据 */
  data?: T;
  /** 失败时的错误信息 */
  error?: string;
}

/**
 * 批量操作结果
 */
export interface BatchResult<T = unknown> {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failedCount: number;
  /** 总数量 */
  totalCount: number;
  /** 详细结果 */
  results: BatchResultItem<T>[];
}

/**
 * 批量操作验证器
 */
export interface BatchValidator<T> {
  /** 验证函数，返回错误信息或 null */
  validate: (item: T, index: number) => Promise<string | null>;
}

/**
 * 批量操作处理器
 */
export interface BatchProcessor<T, R = unknown> {
  /** 处理函数，返回处理结果 */
  process: (item: T, index: number) => Promise<R>;
}

/**
 * 批量操作配置
 */
export interface BatchOperationConfig<T, R = unknown> {
  /** 验证器列表 */
  validators?: BatchValidator<T>[];
  /** 处理器 */
  processor: BatchProcessor<T, R>;
  /** 是否在遇到错误时继续处理 */
  continueOnError?: boolean;
}

/**
 * 批量操作辅助类
 *
 * @description 提供通用的批量操作处理逻辑，减少 Service 层的重复代码
 * 支持批量创建、批量删除、批量更新等操作
 *
 * @example
 * ```typescript
 * const result = await BatchOperationHelper.execute(users, {
 *   validators: [
 *     { validate: async (user) => await this.checkUserExists(user.userName) ? '用户名已存在' : null },
 *   ],
 *   processor: {
 *     process: async (user) => await this.userRepo.create(user),
 *   },
 * });
 * ```
 */
export class BatchOperationHelper {
  /**
   * 执行批量操作
   * @param items 要处理的项目列表
   * @param config 操作配置
   * @returns 批量操作结果
   */
  static async execute<T, R = unknown>(
    items: T[],
    config: BatchOperationConfig<T, R>,
  ): Promise<BatchResult<R>> {
    const results: BatchResultItem<R>[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        // 执行验证
        if (config.validators) {
          let validationError: string | null = null;
          for (const validator of config.validators) {
            validationError = await validator.validate(item, i);
            if (validationError) break;
          }

          if (validationError) {
            results.push({ index: i, success: false, error: validationError });
            failedCount++;
            continue;
          }
        }

        // 执行处理
        const data = await config.processor.process(item, i);
        results.push({ index: i, success: true, data });
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '操作失败';
        results.push({ index: i, success: false, error: errorMessage });
        failedCount++;

        if (!config.continueOnError) {
          // 标记剩余项为未处理
          for (let j = i + 1; j < items.length; j++) {
            results.push({ index: j, success: false, error: '操作已中止' });
            failedCount++;
          }
          break;
        }
      }
    }

    return {
      successCount,
      failedCount,
      totalCount: items.length,
      results,
    };
  }

  /**
   * 执行批量删除操作
   * @param ids 要删除的 ID 列表
   * @param config 删除配置
   * @returns 批量操作结果
   */
  static async executeDelete<T = number>(
    ids: T[],
    config: {
      /** 检查是否可删除，返回错误信息或 null */
      canDelete?: (id: T, index: number) => Promise<string | null>;
      /** 执行删除 */
      doDelete: (id: T, index: number) => Promise<void>;
      /** 不可删除的 ID 列表 */
      blockedIds?: T[];
      /** 不可删除的错误信息 */
      blockedMessage?: string;
    },
  ): Promise<BatchResult<T>> {
    const results: BatchResultItem<T>[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];

      // 检查是否在阻止列表中
      if (config.blockedIds?.includes(id)) {
        results.push({
          index: i,
          success: false,
          error: config.blockedMessage || '该项不可删除',
        });
        failedCount++;
        continue;
      }

      try {
        // 检查是否可删除
        if (config.canDelete) {
          const error = await config.canDelete(id, i);
          if (error) {
            results.push({ index: i, success: false, error });
            failedCount++;
            continue;
          }
        }

        // 执行删除
        await config.doDelete(id, i);
        results.push({ index: i, success: true, data: id });
        successCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '删除失败';
        results.push({ index: i, success: false, error: errorMessage });
        failedCount++;
      }
    }

    return {
      successCount,
      failedCount,
      totalCount: ids.length,
      results,
    };
  }

  /**
   * 将批量操作结果包装为 Result 响应
   * @param batchResult 批量操作结果
   * @returns Result 响应
   */
  static toResult<T>(batchResult: BatchResult<T>): Result<BatchResult<T>> {
    return Result.ok(batchResult);
  }

  /**
   * 创建唯一性验证器
   * @param checkExists 检查是否存在的函数
   * @param getField 获取字段值的函数
   * @param fieldName 字段名称（用于错误信息）
   */
  static createUniqueValidator<T>(
    checkExists: (value: unknown) => Promise<boolean>,
    getField: (item: T) => unknown,
    fieldName: string,
  ): BatchValidator<T> {
    return {
      validate: async (item: T) => {
        const value = getField(item);
        if (value && (await checkExists(value))) {
          return `${fieldName} "${value}" 已存在`;
        }
        return null;
      },
    };
  }

  /**
   * 创建必填字段验证器
   * @param getField 获取字段值的函数
   * @param fieldName 字段名称（用于错误信息）
   */
  static createRequiredValidator<T>(
    getField: (item: T) => unknown,
    fieldName: string,
  ): BatchValidator<T> {
    return {
      validate: async (item: T) => {
        const value = getField(item);
        if (value === undefined || value === null || value === '') {
          return `${fieldName} 不能为空`;
        }
        return null;
      },
    };
  }
}
