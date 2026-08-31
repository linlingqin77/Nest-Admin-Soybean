// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 向后兼容别名
export { CreateNotifyTemplateRequestDto as CreateNotifyTemplateDto } from './requests';
export { UpdateNotifyTemplateRequestDto as UpdateNotifyTemplateDto } from './requests';
export { ListNotifyTemplateRequestDto as ListNotifyTemplateDto } from './requests';
export { NotifyTemplateResponseDto } from './responses';
