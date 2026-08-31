// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 兼容旧导出（后续可删除）
export { CreateConfigRequestDto as CreateConfigDto } from './requests';
export { UpdateConfigRequestDto as UpdateConfigDto } from './requests';
export { ListConfigRequestDto as ListConfigDto } from './requests';
