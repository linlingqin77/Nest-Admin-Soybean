// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 向后兼容别名
export { CreateSmsChannelRequestDto as CreateSmsChannelDto } from './requests';
export { UpdateSmsChannelRequestDto as UpdateSmsChannelDto } from './requests';
export { ListSmsChannelRequestDto as ListSmsChannelDto } from './requests';
export { SmsChannelResponseDto } from './responses';
