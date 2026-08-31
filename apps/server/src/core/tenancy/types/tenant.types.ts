/**
 * 租户相关类型定义
 */

/**
 * 租户上下文数据接口
 */
export interface ITenantContextData {
  /** 租户ID */
  tenantId: string;
  /** 是否忽略租户过滤 */
  ignoreTenant?: boolean;
  /** 请求ID（用于链路追踪） */
  requestId?: string;
}

/**
 * 功能开关检查结果
 */
export interface FeatureCheckResult {
  /** 是否启用 */
  enabled: boolean;
  /** 功能代码 */
  featureCode: string;
  /** 错误消息（如果未启用） */
  message?: string;
}

/**
 * 租户信息接口
 */
export interface ITenantInfo {
  /** 租户ID */
  tenantId: string;
  /** 租户名称 */
  tenantName: string;
  /** 联系人 */
  contactUserName?: string;
  /** 联系电话 */
  contactPhone?: string;
  /** 套餐ID */
  packageId?: number;
  /** 过期时间 */
  expireTime?: Date;
  /** 用户数量限制 */
  accountCount?: number;
  /** 状态 */
  status: string;
  /** 删除标志 */
  delFlag: string;
}

/**
 * 租户套餐接口
 */
export interface ITenantPackage {
  /** 套餐ID */
  packageId: number;
  /** 套餐名称 */
  packageName: string;
  /** 菜单ID列表 */
  menuIds?: string;
  /** 状态 */
  status: string;
  /** 备注 */
  remark?: string;
}

/**
 * Prisma 查询参数类型
 */
export interface PrismaQueryArgs {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  create?: Record<string, unknown>;
  update?: Record<string, unknown>;
  select?: Record<string, unknown>;
  include?: Record<string, unknown>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  skip?: number;
  take?: number;
}

/**
 * 租户隔离模型名称类型
 */
export type TenantModelName =
  | 'SysConfig'
  | 'SysDept'
  | 'SysDictData'
  | 'SysDictType'
  | 'SysJob'
  | 'SysLogininfor'
  | 'SysMenu'
  | 'SysNotice'
  | 'SysOperLog'
  | 'SysPost'
  | 'SysRole'
  | 'SysUpload'
  | 'SysUser'
  | 'SysFileFolder'
  | 'SysFileShare'
  | 'SysAuditLog'
  | 'SysTenantFeature'
  | 'SysTenantUsage';

/**
 * 带租户ID的实体基础接口
 */
export interface ITenantEntity {
  tenantId: string;
}

/**
 * 租户过滤选项
 */
export interface TenantFilterOptions {
  /** 是否忽略租户过滤 */
  ignoreTenant?: boolean;
  /** 指定租户ID（覆盖上下文） */
  tenantId?: string;
}
