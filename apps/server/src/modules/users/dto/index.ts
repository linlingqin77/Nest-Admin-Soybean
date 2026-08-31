/**
 * User 模块 DTO 统一导出
 */

// 请求 DTO
export { CreateUserRequestDto } from './create-user.request.dto';
export { UpdateUserRequestDto } from './update-user.request.dto';
export { ListUserRequestDto, AllocatedListRequestDto } from './list-user.request.dto';
export { ChangeUserStatusRequestDto } from './change-user-status.request.dto';
export { ResetPwdRequestDto } from './reset-pwd.request.dto';
export { UpdateProfileRequestDto, UpdatePwdRequestDto } from './profile.request.dto';
export {
  BatchCreateUserRequestDto,
  BatchCreateUserItemRequestDto,
  BatchDeleteUserRequestDto,
  BatchResultResponseDto,
  BatchResultItemResponseDto,
} from './batch-user.request.dto';
export type { UserType } from './user';

// 响应 DTO
export * from './responses';
