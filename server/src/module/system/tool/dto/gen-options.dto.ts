import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 数据权限类型枚举
 */
export enum DataScopeTypeEnum {
  ALL = 'ALL',
  CUSTOM = 'CUSTOM',
  DEPT = 'DEPT',
  DEPT_AND_CHILD = 'DEPT_AND_CHILD',
  SELF = 'SELF',
}

/**
 * 企业级功能配置 DTO
 */
export class GenOptionsDto {
  // ========== 树表配置 ==========
  @ApiProperty({ required: false, description: '树编码字段' })
  @IsOptional()
  @IsString()
  treeCode?: string;

  @ApiProperty({ required: false, description: '树父编码字段' })
  @IsOptional()
  @IsString()
  treeParentCode?: string;

  @ApiProperty({ required: false, description: '树名称字段' })
  @IsOptional()
  @IsString()
  treeName?: string;

  @ApiProperty({ required: false, description: '上级菜单ID' })
  @IsOptional()
  @IsNumber()
  parentMenuId?: number;

  @ApiProperty({ required: false, description: '上级菜单名称' })
  @IsOptional()
  @IsString()
  parentMenuName?: string;

  // ========== 数据权限配置 ==========
  @ApiProperty({ required: false, description: '是否启用数据权限' })
  @IsOptional()
  @IsBoolean()
  enableDataScope?: boolean;

  @ApiProperty({ required: false, description: '数据权限关联字段' })
  @IsOptional()
  @IsString()
  dataScopeColumn?: string;

  @ApiProperty({ required: false, description: '数据权限类型', enum: DataScopeTypeEnum })
  @IsOptional()
  @IsEnum(DataScopeTypeEnum)
  dataScopeType?: DataScopeTypeEnum;

  // ========== 导入导出配置 ==========
  @ApiProperty({ required: false, description: '是否启用导出功能' })
  @IsOptional()
  @IsBoolean()
  enableExport?: boolean;

  @ApiProperty({ required: false, description: '是否启用导入功能' })
  @IsOptional()
  @IsBoolean()
  enableImport?: boolean;

  @ApiProperty({ required: false, description: '导出字段列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exportFields?: string[];

  @ApiProperty({ required: false, description: '导入字段列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  importFields?: string[];

  @ApiProperty({ required: false, description: '导出文件名模板' })
  @IsOptional()
  @IsString()
  exportFileName?: string;

  // ========== 多租户配置 ==========
  @ApiProperty({ required: false, description: '是否启用多租户' })
  @IsOptional()
  @IsBoolean()
  enableTenant?: boolean;

  @ApiProperty({ required: false, description: '租户字段名' })
  @IsOptional()
  @IsString()
  tenantColumn?: string;

  // ========== 审计日志配置 ==========
  @ApiProperty({ required: false, description: '是否启用操作日志' })
  @IsOptional()
  @IsBoolean()
  enableOperlog?: boolean;

  @ApiProperty({ required: false, description: '操作日志标题' })
  @IsOptional()
  @IsString()
  operlogTitle?: string;

  // ========== 高级查询配置 ==========
  @ApiProperty({ required: false, description: '是否启用高级搜索' })
  @IsOptional()
  @IsBoolean()
  enableAdvancedSearch?: boolean;

  @ApiProperty({ required: false, description: '默认排序字段' })
  @IsOptional()
  @IsString()
  defaultSortField?: string;

  @ApiProperty({ required: false, description: '默认排序方向' })
  @IsOptional()
  @IsString()
  defaultSortOrder?: 'asc' | 'desc';

  // ========== 前端增强配置 ==========
  @ApiProperty({ required: false, description: '是否启用列宽调整' })
  @IsOptional()
  @IsBoolean()
  enableColumnResize?: boolean;

  @ApiProperty({ required: false, description: '是否启用列显示切换' })
  @IsOptional()
  @IsBoolean()
  enableColumnToggle?: boolean;

  @ApiProperty({ required: false, description: '是否启用行内编辑' })
  @IsOptional()
  @IsBoolean()
  enableInlineEdit?: boolean;

  @ApiProperty({ required: false, description: '是否启用批量编辑' })
  @IsOptional()
  @IsBoolean()
  enableBatchEdit?: boolean;

  @ApiProperty({ required: false, description: '表格固定高度' })
  @IsOptional()
  @IsNumber()
  tableHeight?: number;

  // ========== API 文档配置 ==========
  @ApiProperty({ required: false, description: 'API 分组名称' })
  @IsOptional()
  @IsString()
  apiGroup?: string;

  @ApiProperty({ required: false, description: 'API 描述' })
  @IsOptional()
  @IsString()
  apiDescription?: string;

  // ========== 代码质量配置 ==========
  @ApiProperty({ required: false, description: '是否生成单元测试' })
  @IsOptional()
  @IsBoolean()
  enableUnitTest?: boolean;

  @ApiProperty({ required: false, description: '是否生成 E2E 测试' })
  @IsOptional()
  @IsBoolean()
  enableE2ETest?: boolean;
}

/**
 * 列扩展配置 DTO
 */
export class ColumnOptionsDto {
  // ========== 导入导出配置 ==========
  @ApiProperty({ required: false, description: '是否导出字段' })
  @IsOptional()
  @IsString()
  isExport?: string;

  @ApiProperty({ required: false, description: '是否导入字段' })
  @IsOptional()
  @IsString()
  isImport?: string;

  @ApiProperty({ required: false, description: '导出格式化' })
  @IsOptional()
  @IsString()
  exportFormat?: string;

  @ApiProperty({ required: false, description: '导入校验规则' })
  @IsOptional()
  @IsString()
  importValidation?: string;

  // ========== 表格显示配置 ==========
  @ApiProperty({ required: false, description: '列宽度' })
  @IsOptional()
  @IsNumber()
  columnWidth?: number;

  @ApiProperty({ required: false, description: '列对齐方式' })
  @IsOptional()
  @IsString()
  columnAlign?: 'left' | 'center' | 'right';

  @ApiProperty({ required: false, description: '列固定位置' })
  @IsOptional()
  @IsString()
  columnFixed?: 'left' | 'right';

  @ApiProperty({ required: false, description: '是否可排序' })
  @IsOptional()
  @IsString()
  columnSortable?: string;

  @ApiProperty({ required: false, description: '是否显示省略号' })
  @IsOptional()
  @IsString()
  columnEllipsis?: string;

  // ========== 表单配置 ==========
  @ApiProperty({ required: false, description: '表单列占比' })
  @IsOptional()
  @IsNumber()
  formColSpan?: number;

  @ApiProperty({ required: false, description: '表单占位符' })
  @IsOptional()
  @IsString()
  formPlaceholder?: string;

  @ApiProperty({ required: false, description: '表单默认值' })
  @IsOptional()
  @IsString()
  formDefaultValue?: string;

  @ApiProperty({ required: false, description: '是否禁用' })
  @IsOptional()
  @IsString()
  formDisabled?: string;

  @ApiProperty({ required: false, description: '是否只读' })
  @IsOptional()
  @IsString()
  formReadonly?: string;

  // ========== 字段联动配置 ==========
  @ApiProperty({ required: false, description: '联动字段名' })
  @IsOptional()
  @IsString()
  linkageField?: string;

  @ApiProperty({ required: false, description: '联动类型' })
  @IsOptional()
  @IsString()
  linkageType?: 'show' | 'hide' | 'enable' | 'disable';

  @ApiProperty({ required: false, description: '联动触发值' })
  @IsOptional()
  @IsString()
  linkageValue?: string;

  // ========== 数据校验配置 ==========
  @ApiProperty({ required: false, description: '最小值/最小长度' })
  @IsOptional()
  @IsNumber()
  validationMin?: number;

  @ApiProperty({ required: false, description: '最大值/最大长度' })
  @IsOptional()
  @IsNumber()
  validationMax?: number;

  @ApiProperty({ required: false, description: '正则校验' })
  @IsOptional()
  @IsString()
  validationPattern?: string;

  @ApiProperty({ required: false, description: '校验失败提示' })
  @IsOptional()
  @IsString()
  validationMessage?: string;
}
