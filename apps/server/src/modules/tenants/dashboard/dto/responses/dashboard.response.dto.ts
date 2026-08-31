import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * 租户统计卡片ResponseDto
 */
export class TenantStatsResponseDto {
  @ApiProperty({ description: '租户总数' })
  @Expose()
  totalTenants: number;

  @ApiProperty({ description: '活跃租户数' })
  @Expose()
  activeTenants: number;

  @ApiProperty({ description: '新增租户数（本月）' })
  @Expose()
  newTenants: number;

  @ApiProperty({ description: '用户总数' })
  @Expose()
  totalUsers: number;

  @ApiProperty({ description: '在线用户数' })
  @Expose()
  onlineUsers: number;

  @ApiProperty({ description: '今日登录用户数' })
  @Expose()
  todayLoginUsers: number;

  @ApiProperty({ description: '存储使用总量（MB）' })
  @Expose()
  totalStorageUsed: number;

  @ApiProperty({ description: 'API调用总量（今日）' })
  @Expose()
  totalApiCalls: number;
}

/**
 * 租户增长趋势数据点ResponseDto
 */
export class TenantTrendDataResponseDto {
  @ApiProperty({ description: '日期' })
  @Expose()
  date: string;

  @ApiProperty({ description: '新增租户数' })
  @Expose()
  newTenants: number;

  @ApiProperty({ description: '累计租户数' })
  @Expose()
  totalTenants: number;
}

/**
 * 套餐分布数据ResponseDto
 */
export class PackageDistributionResponseDto {
  @ApiProperty({ description: '套餐ID' })
  @Expose()
  packageId: number;

  @ApiProperty({ description: '套餐名称' })
  @Expose()
  packageName: string;

  @ApiProperty({ description: '租户数量' })
  @Expose()
  count: number;

  @ApiProperty({ description: '占比' })
  @Expose()
  percentage: number;
}

/**
 * 即将到期租户ResponseDto
 */
export class ExpiringTenantResponseDto {
  @ApiProperty({ description: '租户ID' })
  @Expose()
  tenantId: string;

  @ApiProperty({ description: '企业名称' })
  @Expose()
  companyName: string;

  @ApiProperty({ description: '联系人' })
  @Expose()
  contactUserName: string;

  @ApiProperty({ description: '联系电话' })
  @Expose()
  contactPhone: string;

  @ApiProperty({ description: '到期时间' })
  @Expose()
  expireTime: Date;

  @ApiProperty({ description: '剩余天数' })
  @Expose()
  daysRemaining: number;

  @ApiProperty({ description: '套餐名称' })
  @Expose()
  packageName: string;
}

/**
 * 配额使用TOP租户ResponseDto
 */
export class QuotaTopTenantResponseDto {
  @ApiProperty({ description: '租户ID' })
  @Expose()
  tenantId: string;

  @ApiProperty({ description: '企业名称' })
  @Expose()
  companyName: string;

  @ApiProperty({ description: '用户配额使用率' })
  @Expose()
  userQuotaUsage: number;

  @ApiProperty({ description: '存储配额使用率' })
  @Expose()
  storageQuotaUsage: number;

  @ApiProperty({ description: 'API配额使用率' })
  @Expose()
  apiQuotaUsage: number;

  @ApiProperty({ description: '综合使用率' })
  @Expose()
  overallUsage: number;
}

/**
 * 仪表盘完整数据ResponseDto
 */
export class DashboardDataResponseDto {
  @ApiProperty({ description: '统计卡片数据', type: TenantStatsResponseDto })
  @Expose()
  stats: TenantStatsResponseDto;

  @ApiProperty({ description: '租户增长趋势', type: [TenantTrendDataResponseDto] })
  @Expose()
  trend: TenantTrendDataResponseDto[];

  @ApiProperty({ description: '套餐分布', type: [PackageDistributionResponseDto] })
  @Expose()
  packageDistribution: PackageDistributionResponseDto[];

  @ApiProperty({ description: '即将到期租户', type: [ExpiringTenantResponseDto] })
  @Expose()
  expiringTenants: ExpiringTenantResponseDto[];

  @ApiProperty({ description: '配额使用TOP10', type: [QuotaTopTenantResponseDto] })
  @Expose()
  quotaTopTenants: QuotaTopTenantResponseDto[];
}

// 内部使用的Vo别名（向后兼容 - 使用重新导出）
export { TenantStatsResponseDto as TenantStatsVo };
export { TenantTrendDataResponseDto as TenantTrendDataVo };
export { PackageDistributionResponseDto as PackageDistributionVo };
export { ExpiringTenantResponseDto as ExpiringTenantVo };
export { QuotaTopTenantResponseDto as QuotaTopTenantVo };
export { DashboardDataResponseDto as DashboardDataVo };
