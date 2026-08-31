// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 兼容旧导出（后续可删除）
export { CreateDictTypeRequestDto as CreateDictTypeDto } from './requests';
export { UpdateDictTypeRequestDto as UpdateDictTypeDto } from './requests';
export { ListDictTypeRequestDto as ListDictType } from './requests';
export { CreateDictDataRequestDto as CreateDictDataDto } from './requests';
export { UpdateDictDataRequestDto as UpdateDictDataDto } from './requests';
export { ListDictDataRequestDto as ListDictData } from './requests';
