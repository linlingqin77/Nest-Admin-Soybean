/**
 * 共享类型扩展
 *
 * 从 @nest-admin/types 导入共享类型，并为前端扩展额外的类型
 */

// 重新导出共享类型，方便其他文件导入
export type {
  // 枚举
  StatusEnum,
  DelFlagEnum,
  SexEnum,
  MenuTypeEnum,
  DataScopeEnum,
  NoticeTypeEnum,
  DeviceTypeEnum,
  GrantTypeEnum,
  SortRuleEnum,
  // 通用类型
  IPaginationParams,
  IPaginationResponse,
  IBaseEntity,
  ITenantEntity,
  IdType,
  // 认证模块
  ILoginForm,
  IPwdLoginForm,
  ILoginToken,
  ICaptchaCode,
  ILoginTenant,
  IUserInfo,
  // 系统模块
  IUser,
  IUserSearchParams,
  IUserCreateParams,
  IUserUpdateParams,
  IRole,
  IRoleSearchParams,
  IRoleCreateParams,
  IMenu,
  IMenuSearchParams,
  IDept,
  IDeptSearchParams,
  IPost,
  IPostSearchParams,
  IDictType,
  IDictData,
  ITenant,
  INotice,
  IConfig,
  IClient,
  // 监控模块
  IOperLog,
  ILoginInfor,
  ICacheInfo,
  IOnlineUser,
  IJob,
  IJobLog,
  // 工具模块
  IGenTable,
  IGenTableColumn
} from '@nest-admin/types';
