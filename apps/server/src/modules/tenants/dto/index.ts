// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 兼容旧导出（后续可删除）
export { CreateTenantRequestDto as CreateTenantDto } from './requests';
export { UpdateTenantRequestDto as UpdateTenantDto } from './requests';
export { ListTenantRequestDto as ListTenantDto } from './requests';
export { SyncTenantPackageRequestDto as SyncTenantPackageDto } from './requests';
export { TenantSwitchRequestDto as TenantSwitchDto } from './requests';
