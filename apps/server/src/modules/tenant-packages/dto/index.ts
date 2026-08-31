// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 兼容旧导出（后续可删除）
export { CreateTenantPackageRequestDto as CreateTenantPackageDto } from './requests';
export { UpdateTenantPackageRequestDto as UpdateTenantPackageDto } from './requests';
export { ListTenantPackageRequestDto as ListTenantPackageDto } from './requests';
