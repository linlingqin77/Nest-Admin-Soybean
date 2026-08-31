// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 内部使用的类型（从原始VO迁移）
export {
  TenantAuditLogVo,
  TenantAuditLogDetailVo,
  TenantAuditLogListVo,
  TenantAuditLogStatsVo,
} from './responses';

// 向后兼容别名
export { ListTenantAuditLogRequestDto as ListTenantAuditLogDto } from './requests';
export { CreateTenantAuditLogRequestDto as CreateTenantAuditLogDto } from './requests';
export { ExportTenantAuditLogRequestDto as ExportTenantAuditLogDto } from './requests';
export { AuditActionType } from './requests';
export { TenantAuditLogResponseDto, TenantAuditLogStatsResponseDto } from './responses';
