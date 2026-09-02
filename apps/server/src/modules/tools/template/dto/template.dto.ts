import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PageQueryDto } from 'src/shared/dto';

/**
 * 模板语言枚举
 */
export enum TemplateLanguage {
  TYPESCRIPT = 'typescript',
  VUE = 'vue',
  SQL = 'sql',
}

/**
 * 创建模板组 DTO
 *
 * @description 用于创建新的模板组
 * Requirements: 6.2, 15.4, 15.5
 */
export class CreateTemplateGroupDto {
  @ApiProperty({
    description: '模板组名称',
    example: 'NestJS + Vue3 标准模板',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: '模板组名称不能为空' })
  @MinLength(1, { message: '模板组名称至少1个字符' })
  @MaxLength(100, { message: '模板组名称最多100个字符' })
  name!: string;

  @ApiPropertyOptional({
    description: '模板组描述',
    example: '适用于 NestJS 后端和 Vue3 前端的标准代码生成模板',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '描述最多500个字符' })
  description?: string;

  @ApiPropertyOptional({
    description: '是否为默认模板组',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/**
 * 更新模板组 DTO
 *
 * @description 用于更新模板组信息
 * Requirements: 6.2, 15.4, 15.5
 */
export class UpdateTemplateGroupDto {
  @ApiPropertyOptional({
    description: '模板组名称',
    example: 'NestJS + Vue3 标准模板',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '模板组名称至少1个字符' })
  @MaxLength(100, { message: '模板组名称最多100个字符' })
  name?: string;

  @ApiPropertyOptional({
    description: '模板组描述',
    example: '适用于 NestJS 后端和 Vue3 前端的标准代码生成模板',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '描述最多500个字符' })
  description?: string;

  @ApiPropertyOptional({
    description: '是否为默认模板组',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: '状态（0正常 1停用）',
    example: '0',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['0', '1'], { message: '状态值必须是 0 或 1' })
  status?: string;
}

/**
 * 查询模板组列表 DTO
 *
 * @description 用于分页查询模板组列表
 * Requirements: 6.2, 15.4, 15.5
 */
export class ListTemplateGroupRequestDto extends PageQueryDto {
  @ApiPropertyOptional({
    description: '模板组名称（模糊查询）',
    example: 'NestJS',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '状态（0正常 1停用）',
    example: '0',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['0', '1'], { message: '状态值必须是 0 或 1' })
  status?: string;

  @ApiPropertyOptional({
    description: '是否只查询系统级模板',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  systemOnly?: boolean;
}

/**
 * 创建模板 DTO
 *
 * @description 用于创建新的模板
 * Requirements: 6.2, 15.4, 15.5
 */
export class CreateTemplateDto {
  @ApiProperty({
    description: '模板组ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: '模板组ID必须是整数' })
  groupId!: number;

  @ApiProperty({
    description: '模板名称',
    example: 'Controller 模板',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: '模板名称不能为空' })
  @MinLength(1, { message: '模板名称至少1个字符' })
  @MaxLength(100, { message: '模板名称最多100个字符' })
  name!: string;

  @ApiProperty({
    description: '输出文件名模板',
    example: '${businessName}.controller.ts',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: '输出文件名不能为空' })
  @MaxLength(200, { message: '输出文件名最多200个字符' })
  fileName!: string;

  @ApiProperty({
    description: '输出路径模板',
    example: 'server/src/modules/${moduleName}/${businessName}',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty({ message: '输出路径不能为空' })
  @MaxLength(500, { message: '输出路径最多500个字符' })
  filePath!: string;

  @ApiProperty({
    description: '模板内容',
    example:
      'import { Controller } from "@nestjs/common";\n\n@Controller("${businessName}")\nexport class ${className}Controller {}',
  })
  @IsString()
  @IsNotEmpty({ message: '模板内容不能为空' })
  content!: string;

  @ApiProperty({
    description: '模板语言',
    enum: TemplateLanguage,
    example: TemplateLanguage.TYPESCRIPT,
  })
  @IsEnum(TemplateLanguage, { message: '模板语言必须是 typescript、vue 或 sql' })
  language!: TemplateLanguage;

  @ApiPropertyOptional({
    description: '排序号',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number;
}

/**
 * 更新模板 DTO
 *
 * @description 用于更新模板信息
 * Requirements: 6.2, 15.4, 15.5
 */
export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: '模板名称',
    example: 'Controller 模板',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: '模板名称至少1个字符' })
  @MaxLength(100, { message: '模板名称最多100个字符' })
  name?: string;

  @ApiPropertyOptional({
    description: '输出文件名模板',
    example: '${businessName}.controller.ts',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: '输出文件名最多200个字符' })
  fileName?: string;

  @ApiPropertyOptional({
    description: '输出路径模板',
    example: 'server/src/modules/${moduleName}/${businessName}',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '输出路径最多500个字符' })
  filePath?: string;

  @ApiPropertyOptional({
    description: '模板内容',
    example:
      'import { Controller } from "@nestjs/common";\n\n@Controller("${businessName}")\nexport class ${className}Controller {}',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: '模板语言',
    enum: TemplateLanguage,
    example: TemplateLanguage.TYPESCRIPT,
  })
  @IsOptional()
  @IsEnum(TemplateLanguage, { message: '模板语言必须是 typescript、vue 或 sql' })
  language?: TemplateLanguage;

  @ApiPropertyOptional({
    description: '排序号',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number;

  @ApiPropertyOptional({
    description: '状态（0正常 1停用）',
    example: '0',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['0', '1'], { message: '状态值必须是 0 或 1' })
  status?: string;
}

/**
 * 查询模板列表 DTO
 *
 * @description 用于分页查询模板列表
 * Requirements: 6.2, 15.4, 15.5
 */
export class ListTemplateRequestDto extends PageQueryDto {
  @ApiPropertyOptional({
    description: '模板组ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  groupId?: number;

  @ApiPropertyOptional({
    description: '模板名称（模糊查询）',
    example: 'Controller',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '模板语言',
    enum: TemplateLanguage,
    example: TemplateLanguage.TYPESCRIPT,
  })
  @IsOptional()
  @IsEnum(TemplateLanguage, { message: '模板语言必须是 typescript、vue 或 sql' })
  language?: TemplateLanguage;

  @ApiPropertyOptional({
    description: '状态（0正常 1停用）',
    example: '0',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['0', '1'], { message: '状态值必须是 0 或 1' })
  status?: string;
}

/**
 * 验证模板语法 DTO
 *
 * @description 用于验证模板语法是否正确
 * Requirements: 6.5
 */
export class ValidateTemplateDto {
  @ApiProperty({
    description: '模板内容',
    example:
      'import { Controller } from "@nestjs/common";\n\n@Controller("${businessName}")\nexport class ${className}Controller {}',
  })
  @IsString()
  @IsNotEmpty({ message: '模板内容不能为空' })
  content!: string;
}

/**
 * 模板导入项 DTO
 *
 * @description 导入模板组时的单个模板数据
 * Requirements: 6.6
 */
export class ImportTemplateItemDto {
  @ApiProperty({ description: '模板名称' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: '输出文件名模板' })
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @ApiProperty({ description: '输出路径模板' })
  @IsString()
  @IsNotEmpty()
  filePath!: string;

  @ApiProperty({ description: '模板内容' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ description: '模板语言', enum: TemplateLanguage })
  @IsEnum(TemplateLanguage)
  language!: TemplateLanguage;

  @ApiPropertyOptional({ description: '排序号' })
  @IsOptional()
  @IsInt()
  sort?: number;
}

/**
 * 导入模板组 DTO
 *
 * @description 用于导入模板组（JSON 格式）
 * Requirements: 6.6
 */
export class ImportTemplateGroupDto {
  @ApiProperty({
    description: '模板组名称',
    example: 'NestJS + Vue3 标准模板',
  })
  @IsString()
  @IsNotEmpty({ message: '模板组名称不能为空' })
  name!: string;

  @ApiPropertyOptional({
    description: '模板组描述',
    example: '适用于 NestJS 后端和 Vue3 前端的标准代码生成模板',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: '模板列表',
    type: [ImportTemplateItemDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: '至少需要一个模板' })
  @ValidateNested({ each: true })
  @Type(() => ImportTemplateItemDto)
  templates!: ImportTemplateItemDto[];
}

/**
 * 模板响应 DTO
 *
 * @description 模板信息响应格式
 * Requirements: 15.4, 15.5
 */
export class TemplateResponseDto {
  @ApiProperty({ description: '模板ID', example: 1 })
  id!: number;

  @ApiProperty({ description: '模板组ID', example: 1 })
  groupId!: number;

  @ApiProperty({ description: '模板名称', example: 'Controller 模板' })
  name!: string;

  @ApiProperty({ description: '输出文件名模板', example: '${businessName}.controller.ts' })
  fileName!: string;

  @ApiProperty({ description: '输出路径模板', example: 'server/src/modules/${moduleName}/${businessName}' })
  filePath!: string;

  @ApiProperty({ description: '模板内容' })
  content!: string;

  @ApiProperty({ description: '模板语言', enum: TemplateLanguage, example: TemplateLanguage.TYPESCRIPT })
  language!: string;

  @ApiProperty({ description: '排序号', example: 0 })
  sort!: number;

  @ApiProperty({ description: '状态（0正常 1停用）', example: '0' })
  status!: string;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T00:00:00.000Z' })
  createTime!: Date;

  @ApiPropertyOptional({ description: '更新时间', example: '2024-01-01T00:00:00.000Z' })
  updateTime?: Date;
}

/**
 * 模板组响应 DTO
 *
 * @description 模板组信息响应格式
 * Requirements: 15.4, 15.5
 */
export class TemplateGroupResponseDto {
  @ApiProperty({ description: '模板组ID', example: 1 })
  id!: number;

  @ApiPropertyOptional({ description: '租户ID（null表示系统级）', example: '000000' })
  tenantId?: string | null;

  @ApiProperty({ description: '模板组名称', example: 'NestJS + Vue3 标准模板' })
  name!: string;

  @ApiPropertyOptional({ description: '模板组描述', example: '适用于 NestJS 后端和 Vue3 前端的标准代码生成模板' })
  description?: string;

  @ApiProperty({ description: '是否为默认模板组', example: false })
  isDefault!: boolean;

  @ApiProperty({ description: '状态（0正常 1停用）', example: '0' })
  status!: string;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T00:00:00.000Z' })
  createTime!: Date;

  @ApiPropertyOptional({ description: '更新时间', example: '2024-01-01T00:00:00.000Z' })
  updateTime?: Date;

  @ApiPropertyOptional({ description: '模板列表', type: [TemplateResponseDto] })
  templates?: TemplateResponseDto[];
}

/**
 * 模板组导出 DTO
 *
 * @description 模板组导出格式（JSON）
 * Requirements: 6.6
 */
export class ExportTemplateGroupDto {
  @ApiProperty({ description: '模板组名称' })
  name!: string;

  @ApiPropertyOptional({ description: '模板组描述' })
  description?: string;

  @ApiProperty({ description: '导出时间' })
  exportTime!: string;

  @ApiProperty({ description: '版本号' })
  version!: string;

  @ApiProperty({ description: '模板列表', type: [ImportTemplateItemDto] })
  templates!: ImportTemplateItemDto[];
}

/**
 * 模板渲染上下文 DTO
 *
 * @description 模板渲染时的上下文数据
 * Requirements: 6.4
 */
export class TemplateContextDto {
  @ApiProperty({ description: '表名', example: 'sys_user' })
  tableName!: string;

  @ApiProperty({ description: '类名', example: 'SysUser' })
  className!: string;

  @ApiProperty({ description: '业务名', example: 'user' })
  businessName!: string;

  @ApiProperty({ description: '模块名', example: 'system' })
  moduleName!: string;

  @ApiProperty({ description: '功能名', example: '用户管理' })
  functionName!: string;

  @ApiPropertyOptional({ description: '作者', example: 'admin' })
  author?: string;

  @ApiPropertyOptional({ description: '日期时间', example: '2024-01-01' })
  datetime?: string;

  @ApiPropertyOptional({ description: '是否租户感知', example: true })
  tenantAware?: boolean;

  @ApiPropertyOptional({ description: '主键字段' })
  primaryKey?: Record<string, any>;

  @ApiPropertyOptional({ description: '列信息列表' })
  columns?: Record<string, any>[];
}
