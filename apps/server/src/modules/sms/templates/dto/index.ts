// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 向后兼容别名
export { CreateSmsTemplateRequestDto as CreateSmsTemplateDto } from './requests';
export { UpdateSmsTemplateRequestDto as UpdateSmsTemplateDto } from './requests';
export { ListSmsTemplateRequestDto as ListSmsTemplateDto } from './requests';
export { SmsTemplateResponseDto } from './responses';
