import { IsString, IsOptional, IsInt, IsEnum, IsArray, ValidateNested, ValidateIf, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PageQueryDto } from 'src/shared/dto';
import { IsPascalCase, IsKebabCase } from 'src/shared/validators';
import { GenTableColumnUpdateDto } from './gen-table-column.dto';

/**
 * 模板类型枚举
 *
 * @description 代码生成模板类型
 * Requirements: 4.2
 */
export enum TplCategory {
  /** 单表 CRUD */
  CRUD = 'crud',
  /** 树形表 */
  TREE = 'tree',
  /** 主子表 */
  SUB = 'sub',
}

/**
 * 前端模板类型枚举
 *
 * @description 前端代码生成模板类型
 * Requirements: 4.2
 */
export enum TplWebType {
  /** Vue3 + Element Plus */
  ELEMENT_PLUS = 'element-plus',
  /** Vue3 + Naive UI */
  NAIVE_UI = 'naive-ui',
}

/**
 * 创建代码生成表配置 DTO
 *
 * @description 用于创建代码生成表配置
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export class CreateGenTableDto {
  @ApiProperty({ description: '表名称', example: 'sys_user' })
  @IsString()
  @IsNotEmpty({ message: '表名称不能为空' })
  tableName!:  string;

  @ApiProperty({ description: '表描述', example: '用户表' })
  @IsString()
  @IsNotEmpty({ message: '表描述不能为空' })
  tableComment!:  string;

  @ApiProperty({ description: '实体类名称（PascalCase）', example: 'SysUser' })
  @IsString()
  @IsNotEmpty({ message: '实体类名称不能为空' })
  @IsPascalCase({ message: 'className 必须符合 PascalCase 命名规范（首字母大写，如 UserInfo）' })
  className!:  string;

  @ApiProperty({ description: '生成包路径', example: 'src/modules' })
  @IsString()
  @IsNotEmpty({ message: '生成包路径不能为空' })
  packageName!:  string;

  @ApiProperty({ description: '生成模块名（kebab-case）', example: 'system' })
  @IsString()
  @IsNotEmpty({ message: '生成模块名不能为空' })
  @IsKebabCase({ message: 'moduleName 必须符合 kebab-case 命名规范（小写字母和连字符，如 user-info）' })
  moduleName!:  string;

  @ApiProperty({ description: '生成业务名（kebab-case）', example: 'user' })
  @IsString()
  @IsNotEmpty({ message: '生成业务名不能为空' })
  @IsKebabCase({ message: 'businessName 必须符合 kebab-case 命名规范（小写字母和连字符，如 user-info）' })
  businessName!:  string;

  @ApiProperty({ description: '生成功能名', example: '用户管理' })
  @IsString()
  @IsNotEmpty({ message: '生成功能名不能为空' })
  functionName!:  string;

  @ApiProperty({ description: '生成功能作者', example: 'admin' })
  @IsString()
  @IsNotEmpty({ message: '生成功能作者不能为空' })
  functionAuthor!:  string;

  @ApiPropertyOptional({ description: '数据源ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dataSourceId?: number;

  @ApiPropertyOptional({ description: '模板组ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  templateGroupId?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

/**
 * 更新代码生成表配置 DTO
 *
 * @description 用于更新代码生成表配置
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export class UpdateGenTableDto {
  @ApiProperty({ description: '表ID' })
  @Type(() => Number)
  @IsInt()
  tableId!:  number;

  @ApiPropertyOptional({ description: '表名称' })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiPropertyOptional({ description: '表描述' })
  @IsOptional()
  @IsString()
  tableComment?: string;

  @ApiPropertyOptional({ description: '实体类名称（PascalCase）' })
  @IsOptional()
  @IsString()
  @IsPascalCase({ message: 'className 必须符合 PascalCase 命名规范（首字母大写，如 UserInfo）' })
  className?: string;

  @ApiPropertyOptional({ description: '生成包路径' })
  @IsOptional()
  @IsString()
  packageName?: string;

  @ApiPropertyOptional({ description: '生成模块名（kebab-case）' })
  @IsOptional()
  @IsString()
  @IsKebabCase({ message: 'moduleName 必须符合 kebab-case 命名规范（小写字母和连字符，如 user-info）' })
  moduleName?: string;

  @ApiPropertyOptional({ description: '生成业务名（kebab-case）' })
  @IsOptional()
  @IsString()
  @IsKebabCase({ message: 'businessName 必须符合 kebab-case 命名规范（小写字母和连字符，如 user-info）' })
  businessName?: string;

  @ApiPropertyOptional({ description: '生成功能名' })
  @IsOptional()
  @IsString()
  functionName?: string;

  @ApiPropertyOptional({ description: '生成功能作者' })
  @IsOptional()
  @IsString()
  functionAuthor?: string;

  @ApiPropertyOptional({ description: '模板类型', enum: TplCategory })
  @IsOptional()
  @IsEnum(TplCategory, { message: 'tplCategory 必须是 crud、tree 或 sub' })
  tplCategory?: TplCategory;

  @ApiPropertyOptional({ description: '前端模板类型', enum: TplWebType })
  @IsOptional()
  @IsEnum(TplWebType, { message: 'tplWebType 必须是 element-plus 或 naive-ui' })
  tplWebType?: TplWebType;

  @ApiPropertyOptional({ description: '生成类型（0: zip压缩包, 1: 自定义路径）' })
  @IsOptional()
  @IsString()
  genType?: string;

  @ApiPropertyOptional({ description: '生成路径' })
  @IsOptional()
  @IsString()
  genPath?: string;

  @ApiPropertyOptional({ description: '数据源ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dataSourceId?: number;

  @ApiPropertyOptional({ description: '模板组ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  templateGroupId?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;

  // 树形表配置 (Requirements: 4.3)
  @ApiPropertyOptional({ description: '树编码字段（树形表必填）' })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.tplCategory === TplCategory.TREE)
  @IsNotEmpty({ message: '树形表必须配置树编码字段' })
  treeCode?: string;

  @ApiPropertyOptional({ description: '树父编码字段（树形表必填）' })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.tplCategory === TplCategory.TREE)
  @IsNotEmpty({ message: '树形表必须配置树父编码字段' })
  treeParentCode?: string;

  @ApiPropertyOptional({ description: '树名称字段（树形表必填）' })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.tplCategory === TplCategory.TREE)
  @IsNotEmpty({ message: '树形表必须配置树名称字段' })
  treeName?: string;

  // 主子表配置 (Requirements: 4.4)
  @ApiPropertyOptional({ description: '子表名称（主子表必填）' })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.tplCategory === TplCategory.SUB)
  @IsNotEmpty({ message: '主子表必须配置子表名称' })
  subTableName?: string;

  @ApiPropertyOptional({ description: '子表外键名称（主子表必填）' })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.tplCategory === TplCategory.SUB)
  @IsNotEmpty({ message: '主子表必须配置子表外键名称' })
  subTableFkName?: string;

  @ApiPropertyOptional({ description: '其他选项（JSON格式）' })
  @IsOptional()
  @IsString()
  options?: string;

  @ApiPropertyOptional({ description: '列配置列表', type: [GenTableColumnUpdateDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GenTableColumnUpdateDto)
  columns?: GenTableColumnUpdateDto[];
}

/**
 * 查询代码生成表列表 DTO
 *
 * @description 用于查询代码生成表列表
 */
export class ListGenTableRequestDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '表名称（模糊查询）' })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiPropertyOptional({ description: '表描述（模糊查询）' })
  @IsOptional()
  @IsString()
  tableComment?: string;

  @ApiPropertyOptional({ description: '数据源ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dataSourceId?: number;
}

/**
 * 查询数据库表列表 DTO
 *
 * @description 用于查询数据库中未导入的表列表
 */
export class ListDbTableRequestDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '表名称（模糊查询）' })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiPropertyOptional({ description: '表描述（模糊查询）' })
  @IsOptional()
  @IsString()
  tableComment?: string;

  @ApiPropertyOptional({ description: '数据源ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dataSourceId?: number;
}

/**
 * 导入表 DTO
 *
 * @description 用于导入数据库表
 * Requirements: 2.1, 2.2
 */
export class ImportTablesDto {
  @ApiProperty({ description: '表名称列表（逗号分隔）', example: 'sys_user,sys_role' })
  @IsString()
  @IsNotEmpty({ message: '表名称列表不能为空' })
  tableNames!:  string;

  @ApiPropertyOptional({ description: '数据源ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dataSourceId?: number;

  @ApiPropertyOptional({ description: '模板组ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  templateGroupId?: number;
}

/**
 * 表ID列表 DTO
 *
 * @description 用于批量操作
 */
export class TableIdsDto {
  @ApiProperty({ description: '表ID列表（逗号分隔）', example: '1,2,3' })
  @IsString()
  @IsNotEmpty({ message: '表ID列表不能为空' })
  tableIds!:  string;
}

/**
 * 生成代码 DTO
 *
 * @description 用于生成代码
 * Requirements: 8.1, 8.3
 */
export class GenerateCodeDto {
  @ApiProperty({ description: '表ID列表', type: [Number], example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  tableIds!:  number[];

  @ApiPropertyOptional({ description: '模板组ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  templateGroupId?: number;

  @ApiPropertyOptional({ description: '项目名称（用于ZIP文件命名）', example: 'my-project' })
  @IsOptional()
  @IsString()
  projectName?: string;
}

/**
 * 批量生成代码（通过表名）DTO
 *
 * @description 用于通过表名批量生成代码
 * Requirements: 8.1, 8.3, 8.5
 */
export class BatchGenCodeDto {
  @ApiProperty({ description: '表名称列表（逗号分隔）', example: 'sys_user,sys_role' })
  @IsString()
  @IsNotEmpty({ message: '表名称列表不能为空' })
  tableNames!:  string;

  @ApiPropertyOptional({ description: '项目名称（用于ZIP文件命名）', example: 'my-project' })
  @IsOptional()
  @IsString()
  projectName?: string;
}

/**
 * 同步表结构 DTO
 *
 * @description 用于同步表结构
 * Requirements: 2.4, 2.5, 2.6
 */
export class SyncTableDto {
  @ApiProperty({ description: '表名称', example: 'sys_user' })
  @IsString()
  @IsNotEmpty({ message: '表名称不能为空' })
  tableName!:  string;
}
