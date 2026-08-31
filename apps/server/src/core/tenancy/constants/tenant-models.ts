/**
 * 租户隔离模型常量定义
 *
 * 统一管理需要租户隔离的 Prisma 模型列表
 * 所有需要自动添加 tenantId 过滤的模型都应在此定义
 */

/**
 * 需要租户隔离的模型列表
 *
 * 这些模型在查询时会自动添加 tenantId 过滤条件
 * 在创建时会自动设置 tenantId 字段
 */
export const TENANT_MODELS = new Set<string>([
  'SysConfig',
  'SysDept',
  'SysDictData',
  'SysDictType',
  'SysJob',
  'SysLogininfor',
  'SysMenu',
  'SysNotice',
  'SysOperLog',
  'SysPost',
  'SysRole',
  'SysUpload',
  'SysUser',
  'SysFileFolder',
  'SysFileShare',
  'SysAuditLog',
  'SysTenantFeature',
  'SysTenantUsage',
]);

/**
 * 检查模型是否需要租户过滤
 *
 * @param model Prisma 模型名称
 * @returns 是否需要租户隔离
 */
export function hasTenantField(model: string): boolean {
  return TENANT_MODELS.has(model);
}

/**
 * 超级租户ID
 * 超级租户可以跨租户访问数据
 */
export const SUPER_TENANT_ID = '000000';
