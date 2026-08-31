// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 向后兼容别名
export { CreateMailAccountRequestDto as CreateMailAccountDto } from './requests';
export { UpdateMailAccountRequestDto as UpdateMailAccountDto } from './requests';
export { ListMailAccountRequestDto as ListMailAccountDto } from './requests';
export { MailAccountResponseDto } from './responses';
