import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 仪表盘时间范围查询RequestDTO
 */
export class DashboardTimeRangeQueryRequestDto {
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
 * 即将到期租户查询RequestDTO
 */
export class ExpiringTenantsQueryRequestDto {
  @ApiPropertyOptional({ description: '到期天数阈值', default: 30 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  days?: number;
}
