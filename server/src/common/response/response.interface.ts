/**
 * 统一响应接口定义
 * 企业级项目的标准响应结构
 *
 * @deprecated This file is deprecated. Import from '@/common/types' instead.
 * 此文件已废弃，请从 '@/common/types' 导入类型
 */

// Re-export from centralized types
export type {
  ApiResponse as IResponse,
  PaginatedData as IPaginatedData,
  PaginatedResponse as IPaginatedResponse,
  SuccessResponse,
  ErrorResponse,
} from '../types/response';

export { ResponseCode, ResponseMessage, getResponseMessage } from '../types/response';
