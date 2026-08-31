// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 向后兼容别名
export { CreateMailTemplateRequestDto as CreateMailTemplateDto } from './requests';
export { UpdateMailTemplateRequestDto as UpdateMailTemplateDto } from './requests';
export { ListMailTemplateRequestDto as ListMailTemplateDto } from './requests';
export { MailTemplateResponseDto } from './responses';
