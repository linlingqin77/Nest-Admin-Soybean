// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 内部使用的类型（从原始VO迁移）
export { 
  QuotaStatus, 
  TenantQuotaVo, 
  TenantQuotaDetailVo, 
  QuotaChangeRecordVo, 
  QuotaCheckResultVo 
} from './responses';

// 向后兼容别名
export { ListTenantQuotaRequestDto as ListTenantQuotaDto } from './requests';
export { UpdateTenantQuotaRequestDto as UpdateTenantQuotaDto } from './requests';
export { CheckQuotaRequestDto as CheckQuotaDto } from './requests';
export { IncrementQuotaUsageDto } from './requests';
export { TenantQuotaResponseDto } from './responses';
