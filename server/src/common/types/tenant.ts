/**
 * Tenant Type Definitions
 * 租户相关类型定义
 */

/**
 * Tenant context data
 * 租户上下文数据
 */
export type TenantContext = {
  tenantId: string;
  ignoreTenant?: boolean;
};
