// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 兼容旧导出（后续可删除）
export { CreatePostRequestDto as CreatePostDto } from './requests';
export { UpdatePostRequestDto as UpdatePostDto } from './requests';
export { ListPostRequestDto as ListPostDto } from './requests';
