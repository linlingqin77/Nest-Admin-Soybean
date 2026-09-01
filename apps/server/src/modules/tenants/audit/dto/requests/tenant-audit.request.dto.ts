import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PageQueryDto } from 'src/shared/dto/base.dto';

/**
 * 审计操作类型枚举
 */
export enum AuditActionType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  PERMISSION_CHANGE = 'permission_change',
  CONFIG_CHANGE = 'config_change',
  EXPORT = 'export',
  OTHER = 'other',
}

/**
 * 租户审计日志查询RequestDTO
 */
export class ListTenantAuditLogRequestDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '租户ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: '操作人姓名' })
  @IsOptional()
  @IsString()
  operatorName?: string;

  @ApiPropertyOptional({ description: '操作类型', enum: AuditActionType })
  @IsOptional()
  @IsEnum(AuditActionType)
  actionType?: AuditActionType;

  @ApiPropertyOptional({ description: '操作模块' })
  @IsOptional()
  @IsString()
  modules?: string;

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
 * 创建审计日志RequestDTO
 */
export class CreateTenantAuditLogRequestDto {
  @ApiProperty({ description: '租户ID' })
  @IsString()
  tenantId!:  string;

  @ApiProperty({ description: '操作人ID' })
  @IsNumber()
  @Type(() => Number)
  operatorId!:  number;

  @ApiProperty({ description: '操作人姓名' })
  @IsString()
  operatorName!:  string;

  @ApiProperty({ description: '操作类型', enum: AuditActionType })
  @IsEnum(AuditActionType)
  actionType!:  AuditActionType;

  @ApiProperty({ description: '操作描述' })
  @IsString()
  actionDesc!:  string;

  @ApiProperty({ description: '操作模块' })
  @IsString()
  modules!:  string;

  @ApiProperty({ description: 'IP地址' })
  @IsString()
  ipAddress!:  string;

  @ApiPropertyOptional({ description: 'User Agent' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: '请求URL' })
  @IsOptional()
  @IsString()
  requestUrl?: string;

  @ApiPropertyOptional({ description: '请求方法' })
  @IsOptional()
  @IsString()
  requestMethod?: string;

  @ApiPropertyOptional({ description: '请求参数（JSON）' })
  @IsOptional()
  @IsString()
  requestParams?: string;

  @ApiPropertyOptional({ description: '操作前数据（JSON）' })
  @IsOptional()
  @IsString()
  beforeData?: string;

  @ApiPropertyOptional({ description: '操作后数据（JSON）' })
  @IsOptional()
  @IsString()
  afterData?: string;

  @ApiPropertyOptional({ description: '响应数据（JSON）' })
  @IsOptional()
  @IsString()
  responseData?: string;
}

/**
 * 导出审计日志RequestDTO
 */
export class ExportTenantAuditLogRequestDto {
  @ApiPropertyOptional({ description: '租户ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: '操作人姓名' })
  @IsOptional()
  @IsString()
  operatorName?: string;

  @ApiPropertyOptional({ description: '操作类型', enum: AuditActionType })
  @IsOptional()
  @IsEnum(AuditActionType)
  actionType?: AuditActionType;

  @ApiPropertyOptional({ description: '操作模块' })
  @IsOptional()
  @IsString()
  modules?: string;

  @ApiPropertyOptional({ description: '开始时间', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  beginTime?: string;

  @ApiPropertyOptional({ description: '结束时间', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}
