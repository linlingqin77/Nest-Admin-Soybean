/**
 * 菜单 SQL 生成模板
 *
 * 生成符合 SysMenu 表结构的 INSERT 语句
 * - 包含目录、菜单、按钮三级结构
 * - 支持权限标识生成
 *
 * C5 安全修复：所有外部输入字符串在拼入模板前都通过 assertSafeText
 * 校验，防止函数名/表注释/模块名中含 SQL 注入字符破坏生成的 SQL。
 *
 * @modules sql/menu
 */

import { assertSafeText } from '../../utils/sanitize';

/**
 * SQL 字符串字面量转义（单引号、反斜杠、NULL 等）
 * 避免 SQL 注入：把任意字符串变成安全的单引号字符串内容
 */
function escapeSqlString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''") // SQL 标准：用 '' 转义 '
    .replace(/\0/g, ''); // 移除 NULL 字节
}

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

  // 安全：所有进入 SQL 字符串的字段都必须校验 + 转义
  assertSafeText(BusinessName, 'BusinessName', 64);
  assertSafeText(businessName, 'businessName', 64);
  assertSafeText(moduleName, 'moduleName', 64);
  const safeFunctionName = assertSafeText(functionName, 'functionName', 100);
  // tenantId 用单引号转义防 SQL 注入
  const safeTenantId = escapeSqlString(tenantId);
  // menuIcon 用 assertSafeText 校验
  const safeMenuIcon = assertSafeText(menuIcon, 'menuIcon', 64);

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
-- ${safeFunctionName}菜单 SQL
-- ----------------------------

-- 1. 菜单
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${menuId}, '${escapeSqlString(safeFunctionName)}', ${parentMenuId}, ${orderNum}, '${businessName}', '${componentPath}', NULL, 1, 0, 'C', '0', '0', '${permPrefix}:list', '${safeMenuIcon}', 'admin', NOW(), NULL, NULL, '${escapeSqlString(safeFunctionName + '菜单')}', '${safeTenantId}');

-- 2. 按钮权限
-- 查询按钮
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${queryBtnId}, '${escapeSqlString(safeFunctionName + '查询')}', ${menuId}, 1, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:query', '#', 'admin', NOW(), NULL, NULL, NULL, '${safeTenantId}');

-- 新增按钮
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${addBtnId}, '${escapeSqlString(safeFunctionName + '新增')}', ${menuId}, 2, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:add', '#', 'admin', NOW(), NULL, NULL, NULL, '${safeTenantId}');

-- 修改按钮
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${editBtnId}, '${escapeSqlString(safeFunctionName + '修改')}', ${menuId}, 3, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:edit', '#', 'admin', NOW(), NULL, NULL, NULL, '${safeTenantId}');

-- 删除按钮
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${removeBtnId}, '${escapeSqlString(safeFunctionName + '删除')}', ${menuId}, 4, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:remove', '#', 'admin', NOW(), NULL, NULL, NULL, '${safeTenantId}');

-- 导出按钮
INSERT INTO sys_menu (menu_id, menu_name, parent_id, order_num, path, component, query_param, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark, tenant_id)
VALUES (${exportBtnId}, '${escapeSqlString(safeFunctionName + '导出')}', ${menuId}, 5, '', NULL, NULL, 1, 0, 'F', '0', '0', '${permPrefix}:export', '#', 'admin', NOW(), NULL, NULL, NULL, '${safeTenantId}');
`;
}

/**
 * 生成菜单删除 SQL
 */
export function menuDeleteSqlTemplate(options: MenuSqlTemplateOptions): string {
  const { moduleName, businessName, functionName } = options;

  // 安全：所有标识符类输入必须校验
  assertSafeText(moduleName, 'moduleName', 64);
  assertSafeText(businessName, 'businessName', 64);
  const safeFunctionName = assertSafeText(functionName, 'functionName', 100);

  const permPrefix = `${moduleName}:${businessName}`;

  return `-- ----------------------------
-- 删除${safeFunctionName}菜单 SQL
-- ----------------------------

-- 删除按钮权限
DELETE FROM sys_menu WHERE perms LIKE '${permPrefix}:%';

-- 删除菜单
DELETE FROM sys_menu WHERE menu_name = '${escapeSqlString(safeFunctionName)}' AND perms = '${permPrefix}:list';
`;
}
