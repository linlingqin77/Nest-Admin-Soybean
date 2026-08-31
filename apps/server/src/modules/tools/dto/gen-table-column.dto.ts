import { IsString, IsOptional, IsNumber, IsInt, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 查询类型枚举
 *
 * @description 代码生成查询类型
 * Requirements: 5.4
 */
export enum QueryType {
  /** 等于 */
  EQ = 'EQ',
  /** 不等于 */
  NE = 'NE',
  /** 大于 */
  GT = 'GT',
  /** 大于等于 */
  GTE = 'GTE',
  /** 小于 */
  LT = 'LT',
  /** 小于等于 */
  LTE = 'LTE',
  /** 模糊查询 */
  LIKE = 'LIKE',
  /** 范围查询 */
  BETWEEN = 'BETWEEN',
}

/**
 * HTML 控件类型枚举
 *
 * @description 代码生成 HTML 控件类型
 * Requirements: 5.5
 */
export enum HtmlType {
  /** 文本框 */
  INPUT = 'input',
  /** 文本域 */
  TEXTAREA = 'textarea',
  /** 下拉框 */
  SELECT = 'select',
  /** 单选框 */
  RADIO = 'radio',
  /** 复选框 */
  CHECKBOX = 'checkbox',
  /** 日期控件 */
  DATETIME = 'datetime',
  /** 图片上传 */
  IMAGE_UPLOAD = 'imageUpload',
  /** 文件上传 */
  FILE_UPLOAD = 'fileUpload',
  /** 富文本编辑器 */
  EDITOR = 'editor',
}

/**
 * 创建代码生成列配置 DTO
 *
 * @description 用于创建代码生成列配置
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export class CreateGenTableColumnDto {
  @ApiProperty({ description: '归属表编号' })
  @Type(() => Number)
  @IsInt()
  tableId: number;

  @ApiProperty({ description: '列名称', example: 'user_name' })
  @IsString()
  @IsNotEmpty({ message: '列名称不能为空' })
  columnName: string;

  @ApiProperty({ description: '列描述', example: '用户名' })
  @IsString()
  @IsNotEmpty({ message: '列描述不能为空' })
  columnComment: string;

  @ApiProperty({ description: '列类型', example: 'varchar(64)' })
  @IsString()
  @IsNotEmpty({ message: '列类型不能为空' })
  columnType: string;

  @ApiProperty({ description: 'Java 字段名', example: 'userName' })
  @IsString()
  @IsNotEmpty({ message: 'Java 字段名不能为空' })
  javaField: string;

  @ApiProperty({ description: 'Java 类型', example: 'String' })
  @IsString()
  @IsNotEmpty({ message: 'Java 类型不能为空' })
  javaType: string;

  @ApiPropertyOptional({ description: '查询方式', enum: QueryType, default: QueryType.EQ })
  @IsOptional()
  @IsString()
  queryType?: string;

  @ApiPropertyOptional({ description: 'HTML 控件类型', enum: HtmlType, default: HtmlType.INPUT })
  @IsOptional()
  @IsString()
  htmlType?: string;

  @ApiPropertyOptional({ description: '字典类型' })
  @IsOptional()
  @IsString()
  dictType?: string;

  @ApiPropertyOptional({ description: '是否主键（1是）', default: '0' })
  @IsOptional()
  @IsString()
  isPk?: string;

  @ApiPropertyOptional({ description: '是否自增（1是）', default: '0' })
  @IsOptional()
  @IsString()
  isIncrement?: string;

  @ApiPropertyOptional({ description: '是否必填（1是）', default: '0' })
  @IsOptional()
  @IsString()
  isRequired?: string;

  @ApiPropertyOptional({ description: '是否为插入字段（1是）', default: '1' })
  @IsOptional()
  @IsString()
  isInsert?: string;

  @ApiPropertyOptional({ description: '是否编辑字段（1是）', default: '1' })
  @IsOptional()
  @IsString()
  isEdit?: string;

  @ApiPropertyOptional({ description: '是否列表字段（1是）', default: '1' })
  @IsOptional()
  @IsString()
  isList?: string;

  @ApiPropertyOptional({ description: '是否查询字段（1是）', default: '1' })
  @IsOptional()
  @IsString()
  isQuery?: string;

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number;
}

/**
 * 更新代码生成列配置 DTO
 *
 * @description 用于更新代码生成列配置
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */
export class GenTableColumnUpdateDto {
  @ApiProperty({ description: '列ID' })
  @Type(() => Number)
  @IsInt()
  columnId: number;

  @ApiPropertyOptional({ description: '列描述' })
  @IsOptional()
  @IsString()
  columnComment?: string;

  @ApiPropertyOptional({ description: 'Java 类型' })
  @IsOptional()
  @IsString()
  javaType?: string;

  @ApiPropertyOptional({ description: 'Java 字段名' })
  @IsOptional()
  @IsString()
  javaField?: string;

  @ApiPropertyOptional({ description: '是否为插入字段（1是）' })
  @IsOptional()
  @IsString()
  isInsert?: string;

  @ApiPropertyOptional({ description: '是否编辑字段（1是）' })
  @IsOptional()
  @IsString()
  isEdit?: string;

  @ApiPropertyOptional({ description: '是否列表字段（1是）' })
  @IsOptional()
  @IsString()
  isList?: string;

  @ApiPropertyOptional({ description: '是否查询字段（1是）' })
  @IsOptional()
  @IsString()
  isQuery?: string;

  @ApiPropertyOptional({ description: '查询方式', enum: QueryType })
  @IsOptional()
  @IsString()
  queryType?: string;

  @ApiPropertyOptional({ description: '是否必填（1是）' })
  @IsOptional()
  @IsString()
  isRequired?: string;

  @ApiPropertyOptional({ description: 'HTML 控件类型', enum: HtmlType })
  @IsOptional()
  @IsString()
  htmlType?: string;

  @ApiPropertyOptional({ description: '字典类型' })
  @IsOptional()
  @IsString()
  dictType?: string;

  @ApiPropertyOptional({ description: '排序' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort?: number;
}

/**
 * 列排序 DTO
 *
 * @description 用于列拖拽排序
 * Requirements: 5.6
 */
export class ColumnSortDto {
  @ApiProperty({ description: '列ID' })
  @Type(() => Number)
  @IsInt()
  columnId: number;

  @ApiProperty({ description: '新排序值' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sort: number;
}

/**
 * 批量更新列排序 DTO
 *
 * @description 用于批量更新列排序
 * Requirements: 5.6
 */
export class BatchColumnSortDto {
  @ApiProperty({ description: '表ID' })
  @Type(() => Number)
  @IsInt()
  tableId: number;

  @ApiProperty({ description: '列排序列表', type: [ColumnSortDto] })
  columns: ColumnSortDto[];
}
