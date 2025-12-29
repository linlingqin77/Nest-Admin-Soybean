/**
 * 数据权限范围枚举
 * - ALL: 全部数据权限
 * - CUSTOM: 自定数据权限
 * - DEPT: 本部门数据权限
 * - DEPT_AND_CHILD: 本部门及以下数据权限
 * - SELF: 仅本人数据权限
 */
export enum DataScopeEnum {
  /** 全部数据权限 */
  DATA_SCOPE_ALL = 'ALL',
  /** 自定数据权限 */
  DATA_SCOPE_CUSTOM = 'CUSTOM',
  /** 本部门数据权限 */
  DATA_SCOPE_DEPT = 'DEPT',
  /** 本部门及以下数据权限 */
  DATA_SCOPE_DEPT_AND_CHILD = 'DEPT_AND_CHILD',
  /** 仅本人数据权限 */
  DATA_SCOPE_SELF = 'SELF',
}

/** DataScopeEnum Swagger Schema */
export const DataScopeEnumSchema = {
  description: `数据权限范围枚举
- ALL: 全部数据权限
- CUSTOM: 自定数据权限
- DEPT: 本部门数据权限
- DEPT_AND_CHILD: 本部门及以下数据权限
- SELF: 仅本人数据权限`,
};
