/**
 * 权限 SQL 生成模板
 *
 * 生成角色-菜单关联的 INSERT 语句
 * - 支持批量分配权限
 * - 支持指定角色
 *
 * @modules sql/permission
 */

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
-- ${functionName}权限分配 SQL
-- ----------------------------

-- 为角色分配${functionName}菜单权限
${insertStatements}
`;
}

/**
 * 生成权限删除 SQL
 */
export function permissionDeleteSqlTemplate(options: PermissionSqlTemplateOptions): string {
  const { functionName, menuId } = options;

  // 生成按钮菜单ID
  const queryBtnId = menuId + 1;
  const addBtnId = menuId + 2;
  const editBtnId = menuId + 3;
  const removeBtnId = menuId + 4;
  const exportBtnId = menuId + 5;

  const menuIds = [menuId, queryBtnId, addBtnId, editBtnId, removeBtnId, exportBtnId];

  return `-- ----------------------------
-- 删除${functionName}权限分配 SQL
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
-- ${functionName}完整权限初始化 SQL
-- ----------------------------

-- =============================================
-- 第一部分：创建菜单
-- =============================================

-- 1. 主菜单
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${menuId}, '${functionName}', ${parentMenuId}, ${orderNum}, '${businessName}', '${componentPath}', NULL, 1, 0, 'C', '0', '0', '${permPrefix}:list', '${menuIcon}', 'admin', NOW(), NULL, NULL, '${functionName}菜单', '${tenantId}');

-- 2. 按钮权限
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${queryBtnId}, '${functionName}查询', ${menuId}, 1, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:query', '#', 'admin', NOW(), NULL, NULL, NULL, '${tenantId}');

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${addBtnId}, '${functionName}新增', ${menuId}, 2, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:add', '#', 'admin', NOW(), NULL, NULL, NULL, '${tenantId}');

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${editBtnId}, '${functionName}修改', ${menuId}, 3, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:edit', '#', 'admin', NOW(), NULL, NULL, NULL, '${tenantId}');

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${removeBtnId}, '${functionName}删除', ${menuId}, 4, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:remove', '#', 'admin', NOW(), NULL, NULL, NULL, '${tenantId}');

INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${exportBtnId}, '${functionName}导出', ${menuId}, 5, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:export', '#', 'admin', NOW(), NULL, NULL, NULL, '${tenantId}');

-- =============================================
-- 第二部分：分配权限给角色
-- =============================================

${roleMenuInserts}
`;
}
