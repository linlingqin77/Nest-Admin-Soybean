import { Prisma } from '@prisma/client';
import { PaginationHelper } from './pagination.helper';

/**
 * 查询条件构建器
 *
 * @description 提供通用的 Prisma 查询条件构建方法，减少 Service 层的重复代码
 * 支持常见的查询模式：模糊搜索、精确匹配、日期范围、状态过滤等
 *
 * @example
 * ```typescript
 * const where = QueryBuilder.create<Prisma.SysUserWhereInput>()
 *   .addDelFlag()
 *   .addContains('userName', query.userName)
 *   .addContains('phonenumber', query.phonenumber)
 *   .addEquals('status', query.status)
 *   .addDateRange('createTime', query.params)
 *   .build();
 * ```
 */
export class QueryBuilder<T extends Record<string, unknown>> {
  private conditions: T;

  private constructor(initialConditions: Partial<T> = {}) {
    this.conditions = { ...initialConditions } as T;
  }

  /**
   * 创建查询构建器实例
   * @param initialConditions 初始条件
   */
  static create<T extends Record<string, unknown>>(initialConditions: Partial<T> = {}): QueryBuilder<T> {
    return new QueryBuilder<T>(initialConditions);
  }

  /**
   * 添加软删除过滤条件（delFlag = '0'）
   */
  addDelFlag(): this {
    (this.conditions as Record<string, unknown>).delFlag = '0';
    return this;
  }

  /**
   * 添加模糊搜索条件（contains）
   * @param field 字段名
   * @param value 搜索值
   */
  addContains(field: string, value?: string): this {
    if (value) {
      (this.conditions as Record<string, unknown>)[field] = { contains: value };
    }
    return this;
  }

  /**
   * 添加精确匹配条件
   * @param field 字段名
   * @param value 匹配值
   */
  addEquals<V>(field: string, value?: V): this {
    if (value !== undefined && value !== null && value !== '') {
      (this.conditions as Record<string, unknown>)[field] = value;
    }
    return this;
  }

  /**
   * 添加数字精确匹配条件
   * @param field 字段名
   * @param value 数字值
   */
  addNumber(field: string, value?: number | string): this {
    if (value !== undefined && value !== null && value !== '') {
      (this.conditions as Record<string, unknown>)[field] = Number(value);
    }
    return this;
  }

  /**
   * 添加日期范围条件
   * @param field 字段名
   * @param params 日期范围参数 { beginTime, endTime }
   */
  addDateRange(field: string, params?: { beginTime?: string; endTime?: string }): this {
    const dateRange = PaginationHelper.buildDateRange(params);
    if (dateRange) {
      (this.conditions as Record<string, unknown>)[field] = dateRange;
    }
    return this;
  }

  /**
   * 添加 IN 条件
   * @param field 字段名
   * @param values 值数组
   */
  addIn<V>(field: string, values?: V[]): this {
    if (values && values.length > 0) {
      (this.conditions as Record<string, unknown>)[field] = { in: values };
    }
    return this;
  }

  /**
   * 添加 NOT IN 条件
   * @param field 字段名
   * @param values 值数组
   */
  addNotIn<V>(field: string, values?: V[]): this {
    if (values && values.length > 0) {
      (this.conditions as Record<string, unknown>)[field] = { notIn: values };
    }
    return this;
  }

  /**
   * 添加 OR 条件
   * @param conditions OR 条件数组
   */
  addOr(conditions: Array<Record<string, unknown>>): this {
    if (conditions.length > 0) {
      (this.conditions as Record<string, unknown>).OR = conditions;
    }
    return this;
  }

  /**
   * 添加 AND 条件
   * @param conditions AND 条件数组
   */
  addAnd(conditions: Array<Record<string, unknown>>): this {
    if (conditions.length > 0) {
      const existing = (this.conditions as Record<string, unknown>).AND as Array<Record<string, unknown>> | undefined;
      (this.conditions as Record<string, unknown>).AND = existing ? [...existing, ...conditions] : conditions;
    }
    return this;
  }

  /**
   * 添加自定义条件
   * @param field 字段名
   * @param condition 条件对象
   */
  addCustom(field: string, condition: unknown): this {
    if (condition !== undefined && condition !== null) {
      (this.conditions as Record<string, unknown>)[field] = condition;
    }
    return this;
  }

  /**
   * 条件添加（仅当条件为真时添加）
   * @param shouldAdd 是否添加
   * @param field 字段名
   * @param value 值
   */
  addIf<V>(shouldAdd: boolean, field: string, value: V): this {
    if (shouldAdd) {
      (this.conditions as Record<string, unknown>)[field] = value;
    }
    return this;
  }

  /**
   * 合并其他条件
   * @param other 其他条件对象
   */
  merge(other: Partial<T>): this {
    Object.assign(this.conditions, other);
    return this;
  }

  /**
   * 构建最终的查询条件
   */
  build(): T {
    return this.conditions;
  }
}

/**
 * 快捷方法：创建带软删除过滤的查询条件
 */
export function createWhereWithDelFlag<T extends Record<string, unknown>>(
  additionalConditions?: Partial<T>,
): T {
  return QueryBuilder.create<T>({ delFlag: '0', ...additionalConditions } as Partial<T>).build();
}

/**
 * 快捷方法：构建标准列表查询条件
 * @param query 查询参数
 * @param fieldMappings 字段映射配置
 */
export function buildListQuery<T extends Record<string, unknown>>(
  query: Record<string, unknown>,
  fieldMappings: {
    contains?: string[];
    equals?: string[];
    number?: string[];
    dateRange?: { field: string; paramsKey?: string };
  },
): T {
  const builder = QueryBuilder.create<T>().addDelFlag();

  // 处理模糊搜索字段
  fieldMappings.contains?.forEach((field) => {
    builder.addContains(field, query[field] as string);
  });

  // 处理精确匹配字段
  fieldMappings.equals?.forEach((field) => {
    builder.addEquals(field, query[field]);
  });

  // 处理数字字段
  fieldMappings.number?.forEach((field) => {
    builder.addNumber(field, query[field] as number | string);
  });

  // 处理日期范围
  if (fieldMappings.dateRange) {
    const paramsKey = fieldMappings.dateRange.paramsKey || 'params';
    builder.addDateRange(
      fieldMappings.dateRange.field,
      query[paramsKey] as { beginTime?: string; endTime?: string },
    );
  }

  return builder.build();
}
