// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 内部使用的类型别名（从原始VO迁移）
export {
  TenantStatsVo,
  TenantTrendDataVo,
  PackageDistributionVo,
  ExpiringTenantVo,
  QuotaTopTenantVo,
  DashboardDataVo,
} from './responses';

// 向后兼容别名
export { DashboardTimeRangeQueryRequestDto as DashboardTimeRangeQueryDto } from './requests';
export { ExpiringTenantsQueryRequestDto as ExpiringTenantsQueryDto } from './requests';
export { DashboardDataResponseDto } from './responses';
