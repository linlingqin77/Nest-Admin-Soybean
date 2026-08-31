import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';

/**
 * 配额状态枚举
 */
export enum QuotaStatus {
  NORMAL = 'normal',
  WARNING = 'warning',
  DANGER = 'danger',
}

/**
 * 配额变更记录DTO
 */
export class QuotaChangeRecordVo {
  @ApiProperty({ description: '记录ID' })
  id: number;

  @ApiProperty({ description: '配额类型', enum: ['user', 'storage', 'api'] })
  quotaType: string;

  @ApiProperty({ description: '原值' })
  oldValue: number;

  @ApiProperty({ description: '新值' })
  newValue: number;

  @ApiProperty({ description: '修改人' })
  changeBy: string;

  @ApiProperty({ description: '修改时间' })
  changeTime: Date;
}

/**
 * 配额检查结果DTO
 */
export class QuotaCheckResultVo {
  @ApiProperty({ description: '是否允许' })
  allowed: boolean;

  @ApiProperty({ description: '配额类型' })
  quotaType: string;

  @ApiProperty({ description: '当前使用量' })
  used: number;

  @ApiProperty({ description: '配额限制' })
  limit: number;

  @ApiProperty({ description: '使用率' })
  usageRate: number;

  @ApiProperty({ description: '提示信息' })
  message: string;
}

/**
 * 租户配额DTO
 */
export class TenantQuotaVo {
  @ApiProperty({ description: '配额记录ID' })
  id: number;

  @ApiProperty({ description: '租户ID' })
  tenantId: string;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '用户数量配额，-1表示不限' })
  userQuota: number;

  @ApiProperty({ description: '已使用用户数' })
  userUsed: number;

  @ApiProperty({ description: '用户配额使用率' })
  userUsageRate: number;

  @ApiProperty({ description: '存储配额（MB），-1表示不限' })
  storageQuota: number;

  @ApiProperty({ description: '已使用存储（MB）' })
  storageUsed: number;

  @ApiProperty({ description: '存储配额使用率' })
  storageUsageRate: number;

  @ApiProperty({ description: 'API调用配额（月），-1表示不限' })
  apiQuota: number;

  @ApiProperty({ description: '本月已调用次数' })
  apiUsed: number;

  @ApiProperty({ description: 'API配额使用率' })
  apiUsageRate: number;

  @ApiProperty({ description: '配额状态', enum: QuotaStatus })
  status: QuotaStatus;

  @ApiProperty({ description: '创建时间' })
  createTime: Date;

  @ApiProperty({ description: '更新时间' })
  updateTime: Date;
}

/**
 * 租户配额详情DTO
 */
export class TenantQuotaDetailVo extends TenantQuotaVo {
  @ApiProperty({ description: '配额变更历史', type: [QuotaChangeRecordVo] })
  quotaHistory: QuotaChangeRecordVo[];
}

/**
 * 租户配额响应 DTO
 */
export class TenantQuotaResponseDto extends BaseResponseDto {
  @ApiProperty({ description: '配额记录ID' })
  @Expose()
  id: number;

  @ApiProperty({ description: '租户ID' })
  @Expose()
  override tenantId: number;

  @ApiProperty({ description: '企业名称' })
  @Expose()
  companyName: string;

  @ApiProperty({ description: '用户数量配额，-1表示不限' })
  @Expose()
  userQuota: number;

  @ApiProperty({ description: '已使用用户数' })
  @Expose()
  userUsed: number;

  @ApiProperty({ description: '用户配额使用率' })
  @Expose()
  userUsageRate: number;

  @ApiProperty({ description: '存储配额（MB），-1表示不限' })
  @Expose()
  storageQuota: number;

  @ApiProperty({ description: '已使用存储（MB）' })
  @Expose()
  storageUsed: number;

  @ApiProperty({ description: '存储配额使用率' })
  @Expose()
  storageUsageRate: number;

  @ApiProperty({ description: 'API调用配额（月），-1表示不限' })
  @Expose()
  apiQuota: number;

  @ApiProperty({ description: '本月已调用次数' })
  @Expose()
  apiUsed: number;

  @ApiProperty({ description: 'API配额使用率' })
  @Expose()
  apiUsageRate: number;

  @ApiProperty({ description: '配额状态', enum: ['normal', 'warning', 'danger'] })
  @Expose()
  status: string;
}
