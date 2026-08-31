// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 向后兼容别名
export { ListNotifyMessageRequestDto as ListNotifyMessageDto } from './requests';
export { ListMyNotifyMessageRequestDto as ListMyNotifyMessageDto } from './requests';
export { SendNotifyMessageRequestDto as SendNotifyMessageDto } from './requests';
export { SendNotifyAllRequestDto as SendNotifyAllDto } from './requests';
export { NotifyMessageResponseDto, UnreadCountResponseDto } from './responses';
