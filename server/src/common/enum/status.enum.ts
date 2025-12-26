import { Status, DelFlag } from '@prisma/client';

/**
 * 数据状态枚举
 * 使用 Prisma 生成的枚举，保持类型安全
 * - NORMAL: 正常/启用
 * - DISABLED: 停用/禁用
 */
export const StatusEnum = Status;
export type StatusEnum = Status;

// 为了向后兼容，保留 STOP 别名
export const StatusEnumCompat = {
  ...Status,
  STOP: Status.DISABLED, // 向后兼容别名
} as const;

/** StatusEnum Swagger Schema */
export const StatusEnumSchema = {
  description: `数据状态枚举
- NORMAL: 正常/启用
- DISABLED: 停用/禁用`,
};

/**
 * 删除标志枚举
 * 使用 Prisma 生成的枚举，保持类型安全
 * - NORMAL: 正常（未删除）
 * - DELETED: 已删除
 */
export const DelFlagEnum = DelFlag;
export type DelFlagEnum = DelFlag;

// 为了向后兼容，保留 DELETE 别名
export const DelFlagEnumCompat = {
  ...DelFlag,
  DELETE: DelFlag.DELETED, // 向后兼容别名
} as const;

/** DelFlagEnum Swagger Schema */
export const DelFlagEnumSchema = {
  description: `删除标志枚举
- NORMAL: 正常（未删除）
- DELETED: 已删除`,
};
