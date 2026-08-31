// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 兼容旧导出（后续可删除）
export { CreateNoticeRequestDto as CreateNoticeDto } from './requests';
export { UpdateNoticeRequestDto as UpdateNoticeDto } from './requests';
export { ListNoticeRequestDto as ListNoticeDto } from './requests';
