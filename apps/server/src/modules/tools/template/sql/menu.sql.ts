/**
 * 菜单 SQL 生成模板
 *
 * 生成符合 SysMenu 表结构的 INSERT 语句
 * - 包含目录、菜单、按钮三级结构
 * - 支持权限标识生成
 *
 * @modules sql/menu
 */

export interface MenuSqlTemplateOptions {
  /** 业务名称 (PascalCase) */
  BusinessName: string;
  /** 业务名称 (camelCase) */
  businessName: string;
  /** 模块名称 */
  moduleName: string;
  /** 功能名称 (中文) */
  functionName: string;
  /** 父菜单ID */
  parentMenuId?: number;
  /** 菜单图标 */
  menuIcon?: string;
  /** 排序号 */
  orderNum?: number;
  /** 租户ID */
  tenantId?: string;
}

/**
 * 生成菜单 SQL
 */
export function menuSqlTemplate(options: MenuSqlTemplateOptions): string {
  const {
    BusinessName,
    businessName,
    moduleName,
    functionName,
    parentMenuId = 0,
    menuIcon = 'carbon:document',
    orderNum = 1,
    tenantId = '000000',
  } = options;

  // 生成菜单ID（使用时间戳作为基础）
  const baseMenuId = Date.now() % 100000000;
  const menuId = baseMenuId;
  const listBtnId = baseMenuId + 1;
  const queryBtnId = baseMenuId + 2;
  const addBtnId = baseMenuId + 3;
  const editBtnId = baseMenuId + 4;
  const removeBtnId = baseMenuId + 5;
  const exportBtnId = baseMenuId + 6;

  const permPrefix = `${moduleName}:${businessName}`;
  const routePath = `/${moduleName}/${businessName}`;
  const componentPath = `${moduleName}/${businessName}/index`;

  return `-- ----------------------------
-- ${functionName}菜单 SQL
-- ----------------------------

-- 1. 菜单
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${menuId}, '${functionName}', ${parentMenuId}, ${orderNum}, '${businessName}', '${componentPath}', NULL, 1, 0, 'C', '0', '0', '${permPrefix}:list', '${menuIcon}', 'admin', NOW(), NULL, NULL, '${functionName}菜单', '${tenantId}');

-- 2. 按钮权限
-- 查询按钮
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${queryBtnId}, '${functionName}查询', ${menuId}, 1, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:query', '#', 'admin', NOW(), NULL, NULL, NULL, '${tenantId}');

-- 新增按钮
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${addBtnId}, '${functionName}新增', ${menuId}, 2, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:add', '#', 'admin', NOW(), NULL, NULL, NULL, '${tenantId}');

-- 修改按钮
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${editBtnId}, '${functionName}修改', ${menuId}, 3, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:edit', '#', 'admin', NOW(), NULL, NULL, NULL, '${tenantId}');

-- 删除按钮
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${removeBtnId}, '${functionName}删除', ${menuId}, 4, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:remove', '#', 'admin', NOW(), NULL, NULL, NULL, '${tenantId}');

-- 导出按钮
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${exportBtnId}, '${functionName}导出', ${menuId}, 5, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:export', '#', 'admin', NOW(), NULL, NULL, NULL, '${tenantId}');
`;
}

/**
 * 生成菜单删除 SQL
 */
export function menuDeleteSqlTemplate(options: MenuSqlTemplateOptions): string {
  const { moduleName, businessName, functionName } = options;
  const permPrefix = `${moduleName}:${businessName}`;

  return `-- ----------------------------
-- 删除${functionName}菜单 SQL
-- ----------------------------

-- 删除按钮权限
DELETE FROM sys_menu WHERE perms LIKE '${permPrefix}:%';

-- 删除菜单
DELETE FROM sys_menu WHERE menu_name = '${functionName}' AND perms = '${permPrefix}:list';
`;
}
