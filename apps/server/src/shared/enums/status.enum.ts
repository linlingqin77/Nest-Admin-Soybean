/**
 * 数据状态枚举
 * - NORMAL (0): 正常/启用
 * - STOP (1): 停用/禁用
 */
export enum StatusEnum {
  /** 正常/启用 */
  NORMAL = '0',
  /** 停用/禁用 */
  STOP = '1',
}

/** StatusEnum Swagger Schema */
export const StatusEnumSchema = {
  description: `数据状态枚举
- NORMAL (0): 正常/启用
- STOP (1): 停用/禁用`,
};

/**
 * 删除标志枚举
 *
 * @deprecated 此处仅保留 Swagger Schema，运行时值由 @nest-admin/types 的 DelFlagEnum 提供
 */
export const DelFlagEnumSchema = {
  description: `删除标志枚举
- NORMAL (0): 正常（未删除）
- DELETE (1): 已删除`,
};

/**
 * 租户状态枚举
 */
export enum TenantStatus {
  /** 正常 */
  NORMAL = '0',
  /** 停用 */
  DISABLED = '1',
  /** 过期 */
  EXPIRED = '2',
}

/**
 * 是否枚举
 */
export enum YesNo {
  /** 否 */
  NO = '0',
  /** 是 */
  YES = '1',
}
