/**
 * 状态常量
 * Status Constants
 */
export const STATUS = {
  /**
   * 正常状态
   * Normal status
   */
  NORMAL: '0',
  
  /**
   * 停用状态
   * Disabled status
   */
  DISABLED: '1',
} as const;

/**
 * 删除标志常量
 * Delete Flag Constants
 */
export const DEL_FLAG = {
  /**
   * 正常（未删除）
   * Normal (not deleted)
   */
  NORMAL: '0',
  
  /**
   * 已删除
   * Deleted
   */
  DELETED: '2',
} as const;

/**
 * 状态值类型
 * Status value type
 */
export type StatusValue = typeof STATUS[keyof typeof STATUS];

/**
 * 删除标志值类型
 * Delete flag value type
 */
export type DelFlagValue = typeof DEL_FLAG[keyof typeof DEL_FLAG];
