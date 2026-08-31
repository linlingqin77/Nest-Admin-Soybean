/**
 * Role 模块 DTO 统一导出
 */

// 请求 DTO
export * from './requests';

// 响应 DTO
export * from './responses';

// 兼容旧导出（后续可删除）
export { CreateRoleRequestDto as CreateRoleDto } from './requests';
export { UpdateRoleRequestDto as UpdateRoleDto } from './requests';
export { ListRoleRequestDto as ListRoleDto } from './requests';
export { ChangeRoleStatusRequestDto as ChangeRoleStatusDto } from './requests';
export { AuthUserCancelRequestDto as AuthUserCancelDto } from './requests';
export { AuthUserCancelAllRequestDto as AuthUserCancelAllDto } from './requests';
export { AuthUserSelectAllRequestDto as AuthUserSelectAllDto } from './requests';
