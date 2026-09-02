/**
 * 权限 SQL 生成模板
 *
 * 生成角色-菜单关联的 INSERT 语句
 * - 支持批量分配权限
 * - 支持指定角色
 *
 * C5 安全修复：所有外部输入字符串在拼入模板前都通过 assertSafeText
 * 校验，防止函数名/表注释中含 SQL 注入字符破坏生成的 SQL。
 *
 * @modules sql/permission
 */

import { assertSafeText } from '../../utils/sanitize';

/**
 * SQL 字符串字面量转义（单引号、反斜杠、NULL 等）
 * 避免 SQL 注入：把任意字符串变成安全的单引号字符串内容
 */
function escapeSqlString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "''").replace(/\0/g, '');
}

export interface PermissionSqlTemplateOptions {
  /** 业务名称 (PascalCase) */
  BusinessName: string;
  /** 业务名称 (camelCase) */
  businessName: string;
  /** 模块名称 */
  moduleName: string;
  /** 功能名称 (中文) */
  functionName: string;
  /** 角色ID列表 */
  roleIds?: number[];
  /** 菜单ID（主菜单） */
  menuId: number;
  /** 租户ID */
  tenantId?: string;
}

/**
 * 生成角色-菜单关联 SQL
 */
export function permissionSqlTemplate(options: PermissionSqlTemplateOptions): string {
  const {
    functionName,
    roleIds = [1], // 默认分配给超级管理员
    menuId,
    tenantId = '000000',
  } = options;

  // 安全：functionName 用于 SQL 注释，必须校验
  const safeFunctionName = assertSafeText(functionName, 'functionName', 100);
  const safeTenantId = escapeSqlString(tenantId);

  // 生成按钮菜单ID
  const queryBtnId = menuId + 1;
  const addBtnId = menuId + 2;
  const editBtnId = menuId + 3;
  const removeBtnId = menuId + 4;
  const exportBtnId = menuId + 5;

  const menuIds = [menuId, queryBtnId, addBtnId, editBtnId, removeBtnId, exportBtnId];

  const insertStatements = roleIds
    .flatMap((roleId) =>
      menuIds.map((mid) => `INSERT INTO sys_role_menu (role_id, menu_id) VALUES (${roleId}, ${mid});`),
    )
    .join('\n');

  return `-- ----------------------------
-- ${safeFunctionName}权限分配 SQL
-- ----------------------------

-- 为角色分配${safeFunctionName}菜单权限
${insertStatements}
`;
}

/**
 * 生成权限删除 SQL
 */
export function permissionDeleteSqlTemplate(options: PermissionSqlTemplateOptions): string {
  const { functionName, menuId } = options;

  // 安全：functionName 用于 SQL 注释，必须校验
  const safeFunctionName = assertSafeText(functionName, 'functionName', 100);

  // 生成按钮菜单ID
  const queryBtnId = menuId + 1;
  const addBtnId = menuId + 2;
  const editBtnId = menuId + 3;
  const removeBtnId = menuId + 4;
  const exportBtnId = menuId + 5;

  const menuIds = [menuId, queryBtnId, addBtnId, editBtnId, removeBtnId, exportBtnId];

  return `-- ----------------------------
-- 删除${safeFunctionName}权限分配 SQL
-- ----------------------------

-- 删除角色-菜单关联
DELETE FROM sys_role_menu WHERE menu_id IN (${menuIds.join(', ')});
`;
}

/**
 * 生成完整的权限初始化 SQL（包含菜单和权限分配）
 */
export function fullPermissionSqlTemplate(
  options: PermissionSqlTemplateOptions & {
    parentMenuId?: number;
    menuIcon?: string;
    orderNum?: number;
  },
): string {
  const {
    BusinessName,
    businessName,
    moduleName,
    functionName,
    roleIds = [1],
    menuId,
    parentMenuId = 0,
    menuIcon = 'carbon:document',
    orderNum = 1,
    tenantId = '000000',
  } = options;

  // 安全：所有进入 SQL 字符串的字段都必须校验 + 转义
  assertSafeText(BusinessName, 'BusinessName', 64);
  assertSafeText(businessName, 'businessName', 64);
  assertSafeText(moduleName, 'moduleName', 64);
  const safeFunctionName = assertSafeText(functionName, 'functionName', 100);
  const safeTenantId = escapeSqlString(tenantId);
  const safeMenuIcon = assertSafeText(menuIcon, 'menuIcon', 64);

  const permPrefix = `${moduleName}:${businessName}`;
  const componentPath = `${moduleName}/${businessName}/index`;

  // 生成按钮菜单ID
  const queryBtnId = menuId + 1;
  const addBtnId = menuId + 2;
  const editBtnId = menuId + 3;
  const removeBtnId = menuId + 4;
  const exportBtnId = menuId + 5;

  const menuIds = [menuId, queryBtnId, addBtnId, editBtnId, removeBtnId, exportBtnId];

  const roleMenuInserts = roleIds
    .flatMap((roleId) =>
      menuIds.map((mid) => `INSERT INTO sys_role_menu (role_id, menu_id) VALUES (${roleId}, ${mid});`),
    )
    .join('\n');

  return `-- ----------------------------
-- ${safeFunctionName}完整权限初始化 SQL
-- ----------------------------

-- =============================================
-- 第一部分：创建菜单
-- =============================================

-- 1. 主菜单
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${menuId}, '${escapeSqlString(safeFunctionName)}', ${parentMenuId}, ${orderNum}, '${businessName}', '${componentPath}', NULL, 1, 0, 'C', '0', '0', '${permPrefix}:list', '${safeMenuIcon}', 'admin', NOW(), NULL, NULL, '${escapeSqlString(safeFunctionName + '菜单')}', '${safeTenantId}');

-- 2. 按钮权限
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${queryBtnId}, '${escapeSqlString(safeFunctionName + '查询')}', ${menuId}, 1, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:query', '#', 'admin', NOW(), NULL, NULL, NULL, '${safeTenantId}');

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${addBtnId}, '${escapeSqlString(safeFunctionName + '新增')}', ${menuId}, 2, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:add', '#', 'admin', NOW(), NULL, NULL, NULL, '${safeTenantId}');

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${editBtnId}, '${escapeSqlString(safeFunctionName + '修改')}', ${menuId}, 3, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:edit', '#', 'admin', NOW(), NULL, NULL, NULL, '${safeTenantId}');

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${removeBtnId}, '${escapeSqlString(safeFunctionName + '删除')}', ${menuId}, 4, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:remove', '#', 'admin', NOW(), NULL, NULL, NULL, '${safeTenantId}');

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${exportBtnId}, '${escapeSqlString(safeFunctionName + '导出')}', ${menuId}, 5, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:export', '#', 'admin', NOW(), NULL, NULL, NULL, '${safeTenantId}');

-- =============================================
-- 第二部分：分配权限给角色
-- =============================================

${roleMenuInserts}
`;
}
