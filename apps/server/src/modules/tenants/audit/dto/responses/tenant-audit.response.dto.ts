import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';
import { DateFormat } from 'src/shared/decorators';

/**
 * 租户审计日志Vo（内部使用）
 */
export class TenantAuditLogVo {
  @ApiProperty({ description: '日志ID' })
  id!:  number;

  @ApiProperty({ description: '租户ID' })
  tenantId!:  string;

  @ApiProperty({ description: '企业名称' })
  companyName!:  string;

  @ApiProperty({ description: '操作人ID' })
  operatorId!:  number;

  @ApiProperty({ description: '操作人名称' })
  operatorName!:  string;

  @ApiProperty({ description: '操作类型' })
  actionType!:  string;

  @ApiProperty({ description: '操作描述' })
  actionDesc!:  string;

  @ApiProperty({ description: '模块' })
  modules!:  string;

  @ApiProperty({ description: 'IP地址' })
  ipAddress!:  string;

  @ApiPropertyOptional({ description: '用户代理' })
  userAgent?: string;

  @ApiPropertyOptional({ description: '请求URL' })
  requestUrl?: string;

  @ApiPropertyOptional({ description: '请求方法' })
  requestMethod?: string;

  @ApiProperty({ description: '操作时间' })
  operateTime!:  Date;
}

/**
 * 租户审计日志详情Vo（内部使用）
 */
export class TenantAuditLogDetailVo extends TenantAuditLogVo {
  @ApiPropertyOptional({ description: '请求参数' })
  requestParams?: string;

  @ApiPropertyOptional({ description: '操作前数据' })
  beforeData?: string;

  @ApiPropertyOptional({ description: '操作后数据' })
  afterData?: string;

  @ApiPropertyOptional({ description: '响应数据' })
  responseData?: string;

  @ApiPropertyOptional({ description: '操作结果' })
  result?: string;

  @ApiPropertyOptional({ description: '错误信息' })
  errorMessage?: string;
}

/**
 * 审计日志列表Vo（内部使用）
 */
export class TenantAuditLogListVo {
  @ApiProperty({ description: '日志记录' })
  rows!:  TenantAuditLogVo[];

  @ApiProperty({ description: '总数' })
  total!:  number;
}

/**
 * 租户审计日志响应 DTO
 */
export class TenantAuditLogResponseDto extends BaseResponseDto {
  @ApiProperty({ description: '日志ID' })
  @Expose()
  id!:  number;

  @ApiProperty({ description: '租户ID' })
  @Expose()
  override tenantId!: number;

  @ApiProperty({ description: '企业名称' })
  @Expose()
  companyName!:  string;

  @ApiProperty({ description: '操作人ID' })
  @Expose()
  operatorId!:  number;

  @ApiProperty({ description: '操作人名称' })
  @Expose()
  operatorName!:  string;

  @ApiProperty({ description: '操作类型' })
  @Expose()
  actionType!:  string;

  @ApiProperty({ description: '操作描述' })
  @Expose()
  actionDesc!:  string;

  @ApiProperty({ description: '模块' })
  @Expose()
  modules!:  string;

  @ApiProperty({ description: 'IP地址' })
  @Expose()
  ipAddress!:  string;

  @ApiPropertyOptional({ description: '用户代理' })
  @Expose()
  userAgent?: string;

  @ApiPropertyOptional({ description: '请求URL' })
  @Expose()
  requestUrl?: string;

  @ApiPropertyOptional({ description: '请求方法' })
  @Expose()
  requestMethod?: string;

  @ApiProperty({ description: '操作时间' })
  @Expose()
  @DateFormat()
  operateTime!:  string;
}

/**
 * 审计日志统计ResponseDto
 */
export class TenantAuditLogStatsVo {
  @ApiProperty({ description: '今日操作数' })
  todayCount!:  number;

  @ApiProperty({ description: '本周操作数' })
  weekCount!:  number;

  @ApiProperty({ description: '本月操作数' })
  monthCount!:  number;

  @ApiProperty({ description: '按操作类型统计' })
  byActionType!: { actionType: string; count: number }[];

  @ApiProperty({ description: '按模块统计' })
  byModule!: { module: string; count: number }[];
}

/**
 * 审计日志统计ResponseDto
 */
export class TenantAuditLogStatsResponseDto {
  @ApiProperty({ description: '今日操作数' })
  @Expose()
  todayCount!:  number;

  @ApiProperty({ description: '本周操作数' })
  @Expose()
  weekCount!:  number;

  @ApiProperty({ description: '本月操作数' })
  @Expose()
  monthCount!:  number;

  @ApiProperty({ description: '按操作类型统计' })
  @Expose()
  byActionType!: { actionType: string; count: number }[];

  @ApiProperty({ description: '按模块统计' })
  @Expose()
  byModule!: { module: string; count: number }[];
}
