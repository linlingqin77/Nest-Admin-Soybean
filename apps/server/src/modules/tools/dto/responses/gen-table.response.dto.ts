import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';
import { DateFormat } from 'src/shared/decorators/date-format.decorator';

/**
 * 代码生成表列响应 DTO
 */
export class GenTableColumnResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '列ID' })
  columnId: number;

  @Expose()
  @ApiProperty({ description: '表ID' })
  tableId: number;

  @Expose()
  @ApiProperty({ description: '列名称' })
  columnName: string;

  @Expose()
  @ApiPropertyOptional({ description: '列描述' })
  columnComment?: string;

  @Expose()
  @ApiPropertyOptional({ description: '列类型' })
  columnType?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Java类型' })
  javaType?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Java字段名' })
  javaField?: string;

  @Expose()
  @ApiPropertyOptional({ description: '是否主键（1是）' })
  isPk?: string;

  @Expose()
  @ApiPropertyOptional({ description: '是否自增（1是）' })
  isIncrement?: string;

  @Expose()
  @ApiPropertyOptional({ description: '是否必填（1是）' })
  isRequired?: string;

  @Expose()
  @ApiPropertyOptional({ description: '是否为插入字段（1是）' })
  isInsert?: string;

  @Expose()
  @ApiPropertyOptional({ description: '是否编辑字段（1是）' })
  isEdit?: string;

  @Expose()
  @ApiPropertyOptional({ description: '是否列表字段（1是）' })
  isList?: string;

  @Expose()
  @ApiPropertyOptional({ description: '是否查询字段（1是）' })
  isQuery?: string;

  @Expose()
  @ApiPropertyOptional({ description: '查询方式（等于、不等于、大于、小于、范围）' })
  queryType?: string;

  @Expose()
  @ApiPropertyOptional({ description: '显示类型（文本框、文本域、下拉框、复选框、单选框、日期控件）' })
  htmlType?: string;

  @Expose()
  @ApiPropertyOptional({ description: '字典类型' })
  dictType?: string;

  @Expose()
  @ApiPropertyOptional({ description: '排序' })
  sort?: number;

  // createTime, updateTime, remark 继承自 BaseResponseDto，已自动应用 @DateFormat() 装饰器
}

/**
 * 代码生成表响应 DTO
 *
 * @description 继承 BaseResponseDto，自动处理：
 * - createTime/updateTime 日期格式化（通过 @DateFormat() 装饰器）
 * - 敏感字段排除（delFlag, tenantId 等）
 */
export class GenTableResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '表ID' })
  tableId: number;

  @Expose()
  @ApiProperty({ description: '表名称' })
  tableName: string;

  @Expose()
  @ApiPropertyOptional({ description: '表描述' })
  tableComment?: string;

  @Expose()
  @ApiPropertyOptional({ description: '关联子表的表名' })
  subTableName?: string;

  @Expose()
  @ApiPropertyOptional({ description: '子表关联的外键名' })
  subTableFkName?: string;

  @Expose()
  @ApiPropertyOptional({ description: '实体类名称' })
  className?: string;

  @Expose()
  @ApiPropertyOptional({ description: '使用的模板（crud单表操作 tree树表操作）' })
  tplCategory?: string;

  @Expose()
  @ApiPropertyOptional({ description: '前端模板类型（element-ui模版 element-plus模版）' })
  tplWebType?: string;

  @Expose()
  @ApiPropertyOptional({ description: '生成包路径' })
  packageName?: string;

  @Expose()
  @ApiPropertyOptional({ description: '生成模块名' })
  moduleName?: string;

  @Expose()
  @ApiPropertyOptional({ description: '生成业务名' })
  businessName?: string;

  @Expose()
  @ApiPropertyOptional({ description: '生成功能名' })
  functionName?: string;

  @Expose()
  @ApiPropertyOptional({ description: '生成功能作者' })
  functionAuthor?: string;

  @Expose()
  @ApiPropertyOptional({ description: '生成代码方式（0zip压缩包 1自定义路径）' })
  genType?: string;

  @Expose()
  @ApiPropertyOptional({ description: '生成路径（不填默认项目路径）' })
  genPath?: string;

  @Expose()
  @ApiPropertyOptional({ description: '其它生成选项' })
  options?: string;

  @Expose()
  @ApiPropertyOptional({ description: '表列信息', type: [GenTableColumnResponseDto] })
  @Type(() => GenTableColumnResponseDto)
  columns?: GenTableColumnResponseDto[];

  // createTime, updateTime, remark 继承自 BaseResponseDto，已自动应用 @DateFormat() 装饰器
}

/**
 * 代码生成表列表响应 DTO
 */
export class GenTableListResponseDto {
  @ApiProperty({ description: '表列表', type: [GenTableResponseDto] })
  rows: GenTableResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

/**
 * 数据库表信息响应 DTO
 */
export class DbTableResponseDto {
  @Expose()
  @ApiProperty({ description: '表名称' })
  tableName: string;

  @Expose()
  @ApiPropertyOptional({ description: '表描述' })
  tableComment?: string;

  @Expose()
  @ApiPropertyOptional({ description: '创建时间', example: '2025-01-01 00:00:00' })
  @DateFormat()
  createTime?: string;

  @Expose()
  @ApiPropertyOptional({ description: '更新时间', example: '2025-01-01 00:00:00' })
  @DateFormat()
  updateTime?: string;
}

/**
 * 数据库表列表响应 DTO
 */
export class DbTableListResponseDto {
  @ApiProperty({ description: '表列表', type: [DbTableResponseDto] })
  list: DbTableResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}
