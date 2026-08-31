// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 保持向后兼容
export { CreateMenuRequestDto as CreateMenuDto } from './requests';
export { UpdateMenuRequestDto as UpdateMenuDto } from './requests';
export { ListMenuRequestDto as ListMenuDto } from './requests';
export { ListMenuRequestDto as ListDeptDto } from './requests';
