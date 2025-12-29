/**
 * 代码生成器接口定义
 * 包含企业级功能配置
 */

import { GenTable, GenTableColumn } from '@prisma/client';

// ==================== 数据库内省接口 ====================

/**
 * 表元数据
 */
export interface TableMetadata {
  tableName: string;
  tableComment: string | null;
  createTime: Date | null;
  updateTime: Date | null;
}

/**
 * 列元数据
 */
export interface ColumnMetadata {
  columnName: string;
  columnComment: string | null;
  columnType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isAutoIncrement: boolean;
  defaultValue: string | null;
  maxLength: number | null;
  sort: number;
}

// ==================== 代码生成配置接口 ====================

/**
 * 模板类型
 */
export type TplCategory = 'crud' | 'tree' | 'sub';

/**
 * 前端模板类型
 */
export type TplWebType = 'element-plus' | 'naive-ui';

/**
 * 生成类型
 */
export type GenType = 'ZIP' | 'PATH';

/**
 * 数据权限类型
 */
export type DataScopeType = 'ALL' | 'CUSTOM' | 'DEPT' | 'DEPT_AND_CHILD' | 'SELF';

/**
 * 查询类型
 */
export type QueryType = 'EQ' | 'NE' | 'GT' | 'GE' | 'LT' | 'LE' | 'LIKE' | 'BETWEEN' | 'IN' | 'NOT_IN';

/**
 * HTML 控件类型
 */
export type HtmlType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'datetime'
  | 'date'
  | 'time'
  | 'upload'
  | 'editor'
  | 'number'
  | 'imageUpload'
  | 'fileUpload'
  | 'switch'
  | 'slider'
  | 'rate'
  | 'colorPicker'
  | 'treeSelect'
  | 'cascader'
  | 'transfer';

/**
 * 企业级功能配置选项
 */
export interface GenOptions {
  // 树表配置
  treeCode?: string;
  treeParentCode?: string;
  treeName?: string;
  parentMenuId?: number;
  parentMenuName?: string;

  // 数据权限配置
  enableDataScope?: boolean;
  dataScopeColumn?: string;
  dataScopeType?: DataScopeType;

  // 导入导出配置
  enableExport?: boolean;
  enableImport?: boolean;
  exportFields?: string[];
  importFields?: string[];
  exportFileName?: string;

  // 多租户配置
  enableTenant?: boolean;
  tenantColumn?: string;

  // 审计日志配置
  enableOperlog?: boolean;
  operlogTitle?: string;

  // 高级查询配置
  enableAdvancedSearch?: boolean;
  defaultSortField?: string;
  defaultSortOrder?: 'asc' | 'desc';

  // 前端增强配置
  enableColumnResize?: boolean;
  enableColumnToggle?: boolean;
  enableInlineEdit?: boolean;
  enableBatchEdit?: boolean;
  tableHeight?: number;

  // API 文档配置
  apiGroup?: string;
  apiDescription?: string;

  // 代码质量配置
  enableUnitTest?: boolean;
  enableE2ETest?: boolean;
}

/**
 * 列扩展配置
 */
export interface ColumnOptions {
  // 导入导出配置
  isExport?: string;
  isImport?: string;
  exportFormat?: string;
  importValidation?: string;

  // 表格显示配置
  columnWidth?: number;
  columnAlign?: 'left' | 'center' | 'right';
  columnFixed?: 'left' | 'right';
  columnSortable?: string;
  columnEllipsis?: string;

  // 表单配置
  formColSpan?: number;
  formPlaceholder?: string;
  formDefaultValue?: string;
  formDisabled?: string;
  formReadonly?: string;

  // 字段联动配置
  linkageField?: string;
  linkageType?: 'show' | 'hide' | 'enable' | 'disable';
  linkageValue?: string;

  // 数据校验配置
  validationMin?: number;
  validationMax?: number;
  validationPattern?: string;
  validationMessage?: string;
}

// ==================== 代码生成结果接口 ====================

/**
 * 生成的文件
 */
export interface GeneratedFile {
  fileName: string;
  filePath: string;
  content: string;
  fileType: 'backend' | 'frontend' | 'sql';
}

/**
 * 生成选项
 */
export interface GenerateOptions {
  tableIds: number[];
  genType: GenType;
  genPath?: string;
}

/**
 * 生成结果
 */
export interface GenerateResult {
  success: boolean;
  files: GeneratedFile[];
  zipBuffer?: Buffer;
  errors?: string[];
}

// ==================== 模板上下文接口 ====================

/**
 * 模板渲染上下文
 */
export interface TemplateContext {
  // 表信息
  table: GenTable;
  tableName: string;
  tableComment: string;
  className: string;
  classNameLower: string;

  // 模块信息
  moduleName: string;
  businessName: string;
  BusinessName: string;
  functionName: string;
  functionAuthor: string;

  // 路径信息
  packageName: string;
  apiPath: string;

  // 字段信息
  columns: GenTableColumn[];
  pkColumn: GenTableColumn | null;
  primaryKey: string | null;
  listColumns: GenTableColumn[];
  formColumns: GenTableColumn[];
  queryColumns: GenTableColumn[];
  insertColumns: GenTableColumn[];
  editColumns: GenTableColumn[];

  // 辅助信息
  datetime: string;
  hasDict: boolean;
  dictTypes: string[];

  // 企业级功能配置
  options: GenOptions;

  // 主子表配置
  subTable?: GenTable & { columns: GenTableColumn[] };
  subTableFkColumn?: GenTableColumn;
}

/**
 * 带列信息的表
 */
export interface GenTableWithColumns extends GenTable {
  columns: GenTableColumn[];
}

// ==================== 类型映射 ====================

/**
 * PostgreSQL 类型到 TypeScript 类型的映射
 */
export const TYPE_MAPPING: Record<string, string> = {
  // 数值类型
  int2: 'number',
  int4: 'number',
  int8: 'number',
  integer: 'number',
  bigint: 'number',
  smallint: 'number',
  decimal: 'number',
  numeric: 'number',
  real: 'number',
  float4: 'number',
  float8: 'number',
  'double precision': 'number',

  // 字符串类型
  varchar: 'string',
  char: 'string',
  text: 'string',
  uuid: 'string',

  // 布尔类型
  bool: 'boolean',
  boolean: 'boolean',

  // 日期时间类型
  timestamp: 'Date',
  timestamptz: 'Date',
  date: 'Date',
  time: 'string',
  timetz: 'string',

  // JSON 类型
  json: 'object',
  jsonb: 'object',
};

/**
 * 数据库类型到表单控件的映射
 */
export const HTML_TYPE_MAPPING: Record<string, HtmlType> = {
  varchar: 'input',
  char: 'input',
  text: 'textarea',
  int2: 'number',
  int4: 'number',
  int8: 'number',
  integer: 'number',
  bigint: 'number',
  decimal: 'number',
  numeric: 'number',
  bool: 'radio',
  boolean: 'radio',
  timestamp: 'datetime',
  timestamptz: 'datetime',
  date: 'date',
};
