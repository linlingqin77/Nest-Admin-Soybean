import { ClassConstructor, plainToInstance } from 'class-transformer';

/**
 * 序列化选项
 * - excludeExtraneousValues: 只保留 @Expose 标记的字段
 * - enableImplicitConversion: 启用隐式转换，触发 @Transform 装饰器（如 @DateFormat）
 */
const SERIALIZE_OPTIONS = {
  excludeExtraneousValues: true,
  enableImplicitConversion: true,
};

/**
 * 将普通对象转换为 DTO 实例
 *
 * @description 使用 class-transformer 进行转换，自动触发 @DateFormat 等装饰器
 * - excludeExtraneousValues: true 只保留 @Expose 标记的字段
 * - enableImplicitConversion: true 启用隐式转换，触发 @Transform 装饰器
 *
 * @param cls DTO 类
 * @param plain 普通对象
 * @returns DTO 实例
 *
 * @example
 * ```typescript
 * const dto = toDto(UserResponseDto, user);
 * ```
 */
export function toDto<T>(cls: ClassConstructor<T>, plain: object | null | undefined): T | null {
  if (plain === null || plain === undefined) {
    return null;
  }
  return plainToInstance(cls, plain, SERIALIZE_OPTIONS);
}

/**
 * 将普通对象数组转换为 DTO 实例数组
 *
 * @description 使用 class-transformer 进行转换，自动触发 @DateFormat 等装饰器
 *
 * @param cls DTO 类
 * @param plainList 普通对象数组
 * @returns DTO 实例数组
 *
 * @example
 * ```typescript
 * const dtos = toDtoList(UserResponseDto, users);
 * ```
 */
export function toDtoList<T>(cls: ClassConstructor<T>, plainList: object[] | null | undefined): T[] {
  if (!plainList || !Array.isArray(plainList)) {
    return [];
  }
  return plainList.map((item) => plainToInstance(cls, item, SERIALIZE_OPTIONS));
}

/**
 * 转换分页数据
 *
 * @param cls DTO 类
 * @param data 包含 rows 和 total 的分页数据
 * @returns 转换后的分页数据
 *
 * @example
 * ```typescript
 * const pageData = toDtoPage(UserResponseDto, { rows: users, total: 100 });
 * ```
 */
export function toDtoPage<T, R extends Record<string, unknown> = Record<string, unknown>>(
  cls: ClassConstructor<T>,
  data: { rows: R[]; total: number } | null | undefined,
): { rows: T[]; total: number } {
  if (!data) {
    return { rows: [], total: 0 };
  }
  return {
    rows: toDtoList(cls, data.rows as object[]),
    total: data.total,
  };
}
