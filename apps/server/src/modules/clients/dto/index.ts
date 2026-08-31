// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 兼容旧导出
export { CreateClientRequestDto as CreateClientDto } from './requests';
export { UpdateClientRequestDto as UpdateClientDto } from './requests';
export { ChangeClientStatusRequestDto as ChangeClientStatusDto } from './requests';
export { ListClientRequestDto as ListClientDto } from './requests';
