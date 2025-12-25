import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsString, IsEnum, Min, Max, IsDateString, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * 排序方向枚举
 */
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * 时间范围 DTO
 */
export class DateRangeDto {
  @ApiPropertyOptional({ description: '开始时间', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  beginTime?: string;

  @ApiPropertyOptional({ description: '结束时间', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}

/**
 * 基础分页 DTO
 *
 * @description 提供标准的分页参数，所有需要分页的接口都应继承此类
 *
 * @example
 * ```typescript
 * export class ListUserDto extends PageQueryDto {
 *   @IsOptional()
 *   @IsString()
 *   userName?: string;
 * }
 * ```
 */
export class PageQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageNum?: number = 1;

  @ApiPropertyOptional({ description: '每页条数', default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ description: '排序字段' })
  @IsOptional()
  @IsString()
  orderByColumn?: string;

  @ApiPropertyOptional({ description: '排序方向', enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  @Transform(({ value }) => value?.toLowerCase())
  isAsc?: SortOrder;

  @ApiPropertyOptional({ description: '时间范围', type: DateRangeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  params?: DateRangeDto;

  /**
   * 获取分页偏移量
   */
  get skip(): number {
    return ((this.pageNum || 1) - 1) * (this.pageSize || 10);
  }

  /**
   * 获取每页条数
   */
  get take(): number {
    return this.pageSize || 10;
  }

  /**
   * 获取排序配置
   */
  getOrderBy(defaultField?: string): Record<string, 'asc' | 'desc'> | undefined {
    const field = this.orderByColumn || defaultField;
    if (!field) return undefined;
    return { [field]: this.isAsc || SortOrder.DESC };
  }

  /**
   * 获取时间范围条件
   */
  getDateRange(fieldName: string = 'createTime'): Record<string, any> | undefined {
    if (!this.params?.beginTime && !this.params?.endTime) {
      return undefined;
    }

    const condition: any = {};
    if (this.params.beginTime) {
      condition.gte = new Date(this.params.beginTime);
    }
    if (this.params.endTime) {
      condition.lte = new Date(this.params.endTime + ' 23:59:59');
    }

    return { [fieldName]: condition };
  }
}

/**
 * 带状态筛选的分页 DTO
 */
export class PageQueryWithStatusDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '状态', example: '0' })
  @IsOptional()
  @IsString()
  status?: string;
}

/**
 * ID 数组 DTO（用于批量操作）
 */
export class IdsDto {
  @ApiProperty({ description: 'ID 数组', example: [1, 2, 3], type: [Number] })
  @IsInt({ each: true })
  @Type(() => Number)
  ids: number[];
}

/**
 * 字符串 ID 数组 DTO
 */
export class StringIdsDto {
  @ApiProperty({ description: 'ID 数组', example: ['1', '2', '3'], type: [String] })
  @IsString({ each: true })
  ids: string[];
}

/**
 * 单个 ID 参数 DTO
 */
export class IdParamDto {
  @ApiProperty({ description: 'ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  id: number;
}

/**
 * 基础实体 DTO（包含通用审计字段）
 */
export class BaseEntityDto {
  @ApiPropertyOptional({ description: '创建者' })
  createBy?: string;

  @ApiPropertyOptional({ description: '创建时间' })
  createTime?: Date;

  @ApiPropertyOptional({ description: '更新者' })
  updateBy?: string;

  @ApiPropertyOptional({ description: '更新时间' })
  updateTime?: Date;

  @ApiPropertyOptional({ description: '备注' })
  remark?: string;
}

/**
 * 带租户的基础实体 DTO
 */
export class TenantEntityDto extends BaseEntityDto {
  @ApiPropertyOptional({ description: '租户ID' })
  tenantId?: string;
}
