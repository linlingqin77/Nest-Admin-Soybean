/**
 * @generated
 * 此文件由 openapi-ts 自动生成，请勿手动修改
 * 生成时间: 2026-08-31T03:27:16.387Z
 * 如需修改 API 配置，请编辑 api-config.ts
 */


import { apiRequest, buildUrl } from '../request-adapter';
import type { LoginRequestDto, LoginResponseDto, LogoutResponseDto, RegisterRequestDto, RegisterResultResponseDto, RegisterEnabledResponseDto, CaptchaResponseDto, GetInfoResponseDto, RouterResponseDto, LoginTenantResponseDto, CaptchaCodeResponseDto, AuthLoginRequestDto, LoginTokenResponseDto, AuthRegisterRequestDto, AuthRegisterResultResponseDto, AuthLogoutResponseDto, SocialLoginRequestDto, SocialCallbackResponseDto, PublicKeyResponseDto, ChunkMergeFileDto, CreateClientRequestDto, UpdateClientRequestDto, ClientListResponseDto, ClientResponseDto, ChangeClientStatusRequestDto, CreateConfigRequestDto, UpdateConfigRequestDto, ConfigListResponseDto, ConfigResponseDto, ConfigValueResponseDto, ListConfigRequestDto, CreateDeptRequestDto, CreateDeptResultResponseDto, UpdateDeptRequestDto, UpdateDeptResultResponseDto, DeptResponseDto, DeleteDeptResultResponseDto, CreateDictTypeRequestDto, CreateDictTypeResultResponseDto, UpdateDictTypeRequestDto, UpdateDictTypeResultResponseDto, RefreshCacheResultResponseDto, DeleteDictTypeResultResponseDto, DictTypeResponseDto, DictTypeListResponseDto, CreateDictDataRequestDto, CreateDictDataResultResponseDto, UpdateDictDataRequestDto, UpdateDictDataResultResponseDto, DeleteDictDataResultResponseDto, DictDataResponseDto, DictDataListResponseDto, ListDictTypeRequestDto, MenuResponseDto, CreateMenuRequestDto, CreateMenuResultResponseDto, UpdateMenuRequestDto, UpdateMenuResultResponseDto, MenuTreeResponseDto, RoleMenuTreeSelectResponseDto, DeleteMenuResultResponseDto, CreateNoticeRequestDto, CreateNoticeResultResponseDto, UpdateNoticeRequestDto, UpdateNoticeResultResponseDto, NoticeListResponseDto, NoticeResponseDto, DeleteNoticeResultResponseDto, CreatePostRequestDto, CreatePostResultResponseDto, UpdatePostRequestDto, UpdatePostResultResponseDto, PostListResponseDto, PostResponseDto, DeptTreeResponseDto, DeletePostResultResponseDto, ListPostRequestDto, CreateRoleRequestDto, CreateRoleResultResponseDto, UpdateRoleRequestDto, UpdateRoleResultResponseDto, RoleListResponseDto, RoleResponseDto, RoleDeptTreeResponseDto, DeleteRoleResultResponseDto, DataScopeResultResponseDto, ChangeRoleStatusRequestDto, ChangeRoleStatusResultResponseDto, AllocatedUserListResponseDto, AuthUserCancelRequestDto, AuthUserResultResponseDto, AuthUserCancelAllRequestDto, AuthUserSelectAllRequestDto, ListRoleRequestDto, CreateTenantRequestDto, CreateTenantResultResponseDto, UpdateTenantRequestDto, UpdateTenantResultResponseDto, TenantListResponseDto, SyncTenantDictResultResponseDto, SyncTenantPackageResultResponseDto, SyncTenantConfigResultResponseDto, TenantSelectListResponseDto, TenantSwitchStatusResponseDto, TenantSwitchResponseDto, TenantRestoreResponseDto, TenantResponseDto, DeleteTenantResultResponseDto, ListTenantRequestDto, TenantStatsResponseDto, TenantTrendDataResponseDto, PackageDistributionResponseDto, ExpiringTenantResponseDto, QuotaTopTenantResponseDto, DashboardDataResponseDto, TenantQuotaResponseDto, UpdateTenantQuotaRequestDto, CheckQuotaRequestDto, TenantAuditLogListVo, TenantAuditLogDetailVo, TenantAuditLogStatsVo, ExportTenantAuditLogRequestDto, CreateTenantPackageRequestDto, UpdateTenantPackageRequestDto, TenantPackageListResponseDto, TenantPackageSelectResponseDto, TenantPackageResponseDto, ListTenantPackageRequestDto, TableName, GenTableUpdate, GenerateCodeDto, CreateDataSourceDto, DataSourceResponseDto, UpdateDataSourceDto, TestConnectionDto, CreateTemplateGroupDto, TemplateGroupResponseDto, UpdateTemplateGroupDto, ExportTemplateGroupDto, ImportTemplateGroupDto, CreateTemplateDto, TemplateResponseDto, UpdateTemplateDto, ValidateTemplateDto, CurrentUserInfoResponseDto, UserResponseDto, UpdateProfileDto, UserAvatarResponseDto, UpdatePwdDto, CreateUserDto, UserDetailResponseDto, UpdateUserDto, BatchCreateUserDto, BatchResultDto, BatchDeleteUserDto, UserListResponseDto, DeptTreeNodeResponseDto, AuthRoleResponseDto, UserOptionSelectResponseDto, ChangeUserStatusDto, ResetPwdDto, ListUserDto, CreateFolderRequestDto, FolderResponseDto, UpdateFolderRequestDto, FolderTreeNodeResponseDto, FileListResponseDto, MoveFileRequestDto, RenameFileRequestDto, FileResponseDto, CreateShareRequestDto, CreateShareResultResponseDto, ShareInfoResponseDto, ShareListResponseDto, FileVersionListResponseDto, RestoreVersionResultResponseDto, AccessTokenResponseDto, StorageStatsResponseDto, CreateSmsChannelRequestDto, UpdateSmsChannelRequestDto, SmsChannelResponseDto, CreateSmsTemplateRequestDto, UpdateSmsTemplateRequestDto, SmsTemplateResponseDto, SendSmsDto, BatchSendSmsDto, SmsLogResponseDto, CreateMailAccountRequestDto, UpdateMailAccountRequestDto, MailAccountResponseDto, CreateMailTemplateRequestDto, UpdateMailTemplateRequestDto, MailTemplateResponseDto, SendMailDto, BatchSendMailDto, TestMailDto, MailLogResponseDto, CreateNotifyTemplateRequestDto, UpdateNotifyTemplateRequestDto, NotifyTemplateResponseDto, SendNotifyMessageRequestDto, SendNotifyAllRequestDto, NotifyMessageResponseDto, UnreadCountResponseDto, JobListResponseDto, JobResponseDto, CreateJobDto, CreateJobResultResponseDto, UpdateJobResultResponseDto, ChangeJobStatusResultResponseDto, DeleteJobResultResponseDto, RunJobResultResponseDto, ListJobDto, JobLogListResponseDto, ClearLogResultResponseDto, ListJobLogDto, ServerInfoResponseDto, CacheInfoResponseDto, CacheNamesResponseDto, CacheKeysResponseDto, CacheKeyResponseDto, ClearCacheResultResponseDto, LoginLogListResponseDto, UnlockUserResultResponseDto, DeleteLogResultResponseDto, ListLoginlogDto, OnlineUserListResponseDto, ForceLogoutResultResponseDto, OperLogListResponseDto, OperLogResponseDto, QueryOperLogDto, CreateOssConfigRequestDto, UpdateOssConfigRequestDto, OssConfigListResponseDto, OssConfigResponseDto, ChangeOssConfigStatusRequestDto, OssListResponseDto, OssResponseDto } from './types';

/**
 * 用户登录
 * @description 用户登录接口，需要用户名、密码和验证码
 */
export function fetchMainLogin(data: LoginRequestDto) {
  return apiRequest<LoginResponseDto>({
    method: 'POST',
    url: '/api/v1/login',
    data,
    operationId: 'MainController_login_v1',
  });
}

/**
 * 退出登录
 * @description 退出当前登录状态，清除登录令牌
 */
export function fetchMainLogout() {
  return apiRequest<LogoutResponseDto>({
    method: 'POST',
    url: '/api/v1/logout',
    operationId: 'MainController_logout_v1',
  });
}

/**
 * 用户注册
 * @description 新用户注册接口，需要用户名、密码和验证码
 */
export function fetchMainRegister(data: RegisterRequestDto) {
  return apiRequest<RegisterResultResponseDto>({
    method: 'POST',
    url: '/api/v1/register',
    data,
    operationId: 'MainController_register_v1',
  });
}

/**
 * 是否开启用户注册
 * @description 查询系统是否开启用户自主注册功能
 */
export function fetchMainRegisterUser() {
  return apiRequest<RegisterEnabledResponseDto>({
    method: 'GET',
    url: '/api/v1/registerUser',
    operationId: 'MainController_registerUser_v1',
  });
}

/**
 * 获取验证码图片
 * @description 获取登录/注册所需的图形验证码，返回 Base64 图片和 UUID
 */
export function fetchMainCaptchaImage() {
  return apiRequest<CaptchaResponseDto>({
    method: 'GET',
    url: '/api/v1/captchaImage',
    operationId: 'MainController_captchaImage_v1',
  });
}

/**
 * 获取当前用户信息
 * @description 获取当前登录用户的基本信息、角色和权限
 */
export function fetchMainGetInfo() {
  return apiRequest<GetInfoResponseDto>({
    method: 'GET',
    url: '/api/v1/getInfo',
    operationId: 'MainController_getInfo_v1',
  });
}

/**
 * 获取路由菜单
 * @description 获取当前用户的前端路由菜单数据
 */
export function fetchMainGetRouters() {
  return apiRequest<RouterResponseDto[]>({
    method: 'GET',
    url: '/api/v1/getRouters',
    operationId: 'MainController_getRouters_v1',
  });
}

/**
 * 获取租户列表 - GET /auth/tenant/list
对应前端: fetchTenantList()

限流配置：跳过限流，因为这是公开的高频接口
 * @description 获取系统中所有可用的租户列表，用于登录时选择租户
 */
export function fetchAuthGetTenantList() {
  return apiRequest<LoginTenantResponseDto>({
    method: 'GET',
    url: '/api/v1/auth/tenant/list',
    operationId: 'AuthController_getTenantList_v1',
  });
}

/**
 * 获取验证码 - GET /auth/code
对应前端: fetchCaptchaCode()
 * @description 获取登录/注册所需的图形验证码
 */
export function fetchAuthGetCaptchaCode() {
  return apiRequest<CaptchaCodeResponseDto>({
    method: 'GET',
    url: '/api/v1/auth/code',
    operationId: 'AuthController_getCaptchaCode_v1',
  });
}

/**
 * 用户登录 - POST /auth/login
对应前端: fetchLogin()

限流配置：每分钟最多 10 次登录尝试，防止暴力破解
 * @description 用户登录接口，支持租户、验证码验证
 */
export function fetchAuthLogin(data: AuthLoginRequestDto) {
  return apiRequest<LoginTokenResponseDto>({
    method: 'POST',
    url: '/api/v1/auth/login',
    data,
    operationId: 'AuthController_login_v1',
  });
}

/**
 * 用户注册 - POST /auth/register
对应前端: fetchRegister()

限流配置：每分钟最多 5 次注册尝试，防止恶意注册
 * @description 新用户注册接口
 */
export function fetchAuthRegister(data: AuthRegisterRequestDto) {
  return apiRequest<AuthRegisterResultResponseDto>({
    method: 'POST',
    url: '/api/v1/auth/register',
    data,
    operationId: 'AuthController_register_v1',
  });
}

/**
 * 退出登录 - POST /auth/logout
对应前端: fetchLogout()
需求 4.8: 登出后 Token 立即失效
 * @description 退出当前登录状态，Token 将被加入黑名单
 */
export function fetchAuthLogout() {
  return apiRequest<AuthLogoutResponseDto>({
    method: 'POST',
    url: '/api/v1/auth/logout',
    operationId: 'AuthController_logout_v1',
  });
}

/**
 * 社交登录回调 - POST /auth/social/callback
对应前端: fetchSocialLoginCallback()
 * @description 第三方社交平台登录回调处理
 */
export function fetchAuthSocialCallback(data: SocialLoginRequestDto) {
  return apiRequest<SocialCallbackResponseDto>({
    method: 'POST',
    url: '/api/v1/auth/social/callback',
    data,
    operationId: 'AuthController_socialCallback_v1',
  });
}

/**
 * 获取加密公钥 - GET /auth/publicKey
用于前端加密数据
 * @description 获取RSA公钥用于数据加密
 */
export function fetchAuthGetPublicKey() {
  return apiRequest<PublicKeyResponseDto>({
    method: 'GET',
    url: '/api/v1/auth/publicKey',
    operationId: 'AuthController_getPublicKey_v1',
  });
}

/**
 * 文件上传
 * @description 上传单个文件
 */
export function fetchUploadSingleFileUpload() {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/common/upload',
    operationId: 'UploadController_singleFileUpload_v1',
  });
}

/**
 * 获取切片上传任务Id
 * @description 初始化切片上传，获取任务ID
 */
export function fetchUploadGetChunkUploadId() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/common/upload/chunk/uploadId',
    operationId: 'UploadController_getChunkUploadId_v1',
  });
}

/**
 * 文件分片上传
 * @description 上传文件分片
 */
export function fetchUploadChunkFileUpload() {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/common/upload/chunk',
    operationId: 'UploadController_chunkFileUpload_v1',
  });
}

/**
 * 文件分片合并
 * @description 合并所有分片为完整文件
 */
export function fetchUploadChunkMergeFile(data: ChunkMergeFileDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/common/upload/chunk/merge',
    data,
    operationId: 'UploadController_chunkMergeFile_v1',
  });
}

/**
 * 获取切片上传任务结果
 * @description 查询切片上传任务的状态
 */
export function fetchUploadGetChunkUploadResult(params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/common/upload/chunk/result',
    params,
    operationId: 'UploadController_getChunkUploadResult_v1',
  });
}

/**
 * 获取cos授权
 * @description 获取腾讯云COS上传临时授权密钥
 */
export function fetchUploadGetAuthorization(params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/common/upload/cos/authorization',
    params,
    operationId: 'UploadController_getAuthorization_v1',
  });
}

/**
 * 客户端管理-创建
 * @description 创建客户端
 */
export function fetchClientCreate(data: CreateClientRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/client',
    data,
    operationId: 'ClientController_create_v1',
  });
}

/**
 * 客户端管理-更新
 * @description 修改客户端
 */
export function fetchClientUpdate(data: UpdateClientRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/client',
    data,
    operationId: 'ClientController_update_v1',
  });
}

/**
 * 客户端管理-列表
 * @description 分页查询客户端列表
 */
export function fetchClientFindAll(params?: Record<string, unknown>) {
  return apiRequest<ClientListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/client/list',
    params,
    operationId: 'ClientController_findAll_v1',
  });
}

/**
 * 客户端管理-详情
 * @description 根据ID获取客户端详情
 */
export function fetchClientFindOne(id: string | number) {
  return apiRequest<ClientResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/client/{id}', { id }),
    operationId: 'ClientController_findOne_v1',
  });
}

/**
 * 客户端管理-修改状态
 * @description 修改客户端状态
 */
export function fetchClientChangeStatus(data: ChangeClientStatusRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/client/changeStatus',
    data,
    operationId: 'ClientController_changeStatus_v1',
  });
}

/**
 * 客户端管理-删除
 * @description 批量删除客户端，多个ID用逗号分隔
 */
export function fetchClientRemove(ids: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/client/{ids}', { ids }),
    operationId: 'ClientController_remove_v1',
  });
}

/**
 * 参数设置-创建
 * @description 创建系统参数配置
 */
export function fetchConfigCreate(data: CreateConfigRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/config',
    data,
    operationId: 'ConfigController_create_v1',
  });
}

/**
 * 参数设置-更新
 * @description 修改系统参数配置
 */
export function fetchConfigUpdate(data: UpdateConfigRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/config',
    data,
    operationId: 'ConfigController_update_v1',
  });
}

/**
 * 参数设置-列表
 * @description 分页查询系统参数列表
 */
export function fetchConfigFindAll(params?: Record<string, unknown>) {
  return apiRequest<ConfigListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/config/list',
    params,
    operationId: 'ConfigController_findAll_v1',
  });
}

/**
 * 参数设置-详情
 * @description 根据ID获取参数详情
 */
export function fetchConfigFindOne(id: string | number) {
  return apiRequest<ConfigResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/config/{id}', { id }),
    operationId: 'ConfigController_findOne_v1',
  });
}

/**
 * 参数设置-删除
 * @description 批量删除参数配置，多个ID用逗号分隔
 */
export function fetchConfigRemove(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/config/{id}', { id }),
    operationId: 'ConfigController_remove_v1',
  });
}

/**
 * 参数设置-按Key查询（缓存）
 * @description 根据参数键获取参数值，优先使用缓存
 */
export function fetchConfigFindOneByconfigKey(id: string | number) {
  return apiRequest<ConfigValueResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/config/configKey/{id}', { id }),
    operationId: 'ConfigController_findOneByconfigKey_v1',
  });
}

/**
 * 参数设置-按Key更新
 * @description 根据参数键名修改参数值
 */
export function fetchConfigUpdateByKey(data: UpdateConfigRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/config/updateByKey',
    data,
    operationId: 'ConfigController_updateByKey_v1',
  });
}

/**
 * 参数设置-刷新缓存
 * @description 清除并重新加载参数配置缓存
 */
export function fetchConfigRefreshCache() {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/system/config/refreshCache',
    operationId: 'ConfigController_refreshCache_v1',
  });
}

/**
 * 参数设置-导出Excel
 * @description 导出参数管理数据为xlsx文件
 */
export function fetchConfigExport(data: ListConfigRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/config/export',
    data,
    operationId: 'ConfigController_export_v1',
  });
}

/**
 * 部门管理-创建
 * @description 创建新部门，需要指定父部门ID
 */
export function fetchDeptCreate(data: CreateDeptRequestDto) {
  return apiRequest<CreateDeptResultResponseDto>({
    method: 'POST',
    url: '/api/v1/system/dept',
    data,
    operationId: 'DeptController_create_v1',
  });
}

/**
 * 部门管理-更新
 * @description 更新部门信息
 */
export function fetchDeptUpdate(data: UpdateDeptRequestDto) {
  return apiRequest<UpdateDeptResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/dept',
    data,
    operationId: 'DeptController_update_v1',
  });
}

/**
 * 部门管理-列表
 * @description 获取部门列表，支持按名称和状态筛选
 */
export function fetchDeptFindAll(params?: Record<string, unknown>) {
  return apiRequest<DeptResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/dept/list',
    params,
    operationId: 'DeptController_findAll_v1',
  });
}

/**
 * 部门管理-选择框列表
 * @description 获取部门选择框列表
 */
export function fetchDeptOptionselect() {
  return apiRequest<DeptResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/dept/optionselect',
    operationId: 'DeptController_optionselect_v1',
  });
}

/**
 * 部门管理-详情
 * @description 根据部门ID获取部门详细信息
 */
export function fetchDeptFindOne(id: string | number) {
  return apiRequest<DeptResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/dept/{id}', { id }),
    operationId: 'DeptController_findOne_v1',
  });
}

/**
 * 部门管理-删除
 * @description 根据ID删除部门，如果存在子部门则无法删除
 */
export function fetchDeptRemove(id: string | number) {
  return apiRequest<DeleteDeptResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/dept/{id}', { id }),
    operationId: 'DeptController_remove_v1',
  });
}

/**
 * 部门管理-排除节点列表
 * @description 查询部门列表（排除指定节点及其子节点），用于编辑时选择父部门
 */
export function fetchDeptFindListExclude(id: string | number) {
  return apiRequest<DeptResponseDto[]>({
    method: 'GET',
    url: buildUrl('/api/v1/system/dept/list/exclude/{id}', { id }),
    operationId: 'DeptController_findListExclude_v1',
  });
}

/**
 * 字典类型-创建
 * @description 创建字典类型
 */
export function fetchDictCreateType(data: CreateDictTypeRequestDto) {
  return apiRequest<CreateDictTypeResultResponseDto>({
    method: 'POST',
    url: '/api/v1/system/dict/type',
    data,
    operationId: 'DictController_createType_v1',
  });
}

/**
 * 字典类型-修改
 * @description 修改字典类型信息
 */
export function fetchDictUpdateType(data: UpdateDictTypeRequestDto) {
  return apiRequest<UpdateDictTypeResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/dict/type',
    data,
    operationId: 'DictController_updateType_v1',
  });
}

/**
 * 字典数据-刷新缓存
 * @description 清除并重新加载字典数据缓存
 */
export function fetchDictRefreshCache() {
  return apiRequest<RefreshCacheResultResponseDto>({
    method: 'DELETE',
    url: '/api/v1/system/dict/type/refreshCache',
    operationId: 'DictController_refreshCache_v1',
  });
}

/**
 * 字典类型-删除
 * @description 批量删除字典类型，多个ID用逗号分隔
 */
export function fetchDictDeleteType(id: string | number) {
  return apiRequest<DeleteDictTypeResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/dict/type/{id}', { id }),
    operationId: 'DictController_deleteType_v1',
  });
}

/**
 * 字典类型-详情
 * @description 根据ID获取字典类型详情
 */
export function fetchDictFindOneType(id: string | number) {
  return apiRequest<DictTypeResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/dict/type/{id}', { id }),
    operationId: 'DictController_findOneType_v1',
  });
}

/**
 * 字典类型-列表
 * @description 分页查询字典类型列表
 */
export function fetchDictFindAllType(params?: Record<string, unknown>) {
  return apiRequest<DictTypeListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/dict/type/list',
    params,
    operationId: 'DictController_findAllType_v1',
  });
}

/**
 * 字典类型-下拉选项
 * @description 获取全部字典类型用于下拉选择
 */
export function fetchDictFindOptionselect() {
  return apiRequest<DictTypeResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/dict/type/optionselect',
    operationId: 'DictController_findOptionselect_v1',
  });
}

/**
 * 字典数据-创建
 * @description 在指定字典类型下创建字典数据
 */
export function fetchDictCreateDictData(data: CreateDictDataRequestDto) {
  return apiRequest<CreateDictDataResultResponseDto>({
    method: 'POST',
    url: '/api/v1/system/dict/data',
    data,
    operationId: 'DictController_createDictData_v1',
  });
}

/**
 * 字典数据-修改
 * @description 修改字典数据
 */
export function fetchDictUpdateDictData(data: UpdateDictDataRequestDto) {
  return apiRequest<UpdateDictDataResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/dict/data',
    data,
    operationId: 'DictController_updateDictData_v1',
  });
}

/**
 * 字典数据-删除
 * @description 批量删除字典数据，多个ID用逗号分隔
 */
export function fetchDictDeleteDictData(id: string | number) {
  return apiRequest<DeleteDictDataResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/dict/data/{id}', { id }),
    operationId: 'DictController_deleteDictData_v1',
  });
}

/**
 * 字典数据-详情
 * @description 根据字典编码获取字典数据详情
 */
export function fetchDictFindOneDictData(id: string | number) {
  return apiRequest<DictDataResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/dict/data/{id}', { id }),
    operationId: 'DictController_findOneDictData_v1',
  });
}

/**
 * 字典数据-列表
 * @description 查询指定字典类型下的数据列表
 */
export function fetchDictFindAllData(params?: Record<string, unknown>) {
  return apiRequest<DictDataListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/dict/data/list',
    params,
    operationId: 'DictController_findAllData_v1',
  });
}

/**
 * 字典数据-按类型查询（缓存）
 * @description 根据字典类型获取字典数据列表，优先使用缓存
 */
export function fetchDictFindOneDataType(id: string | number) {
  return apiRequest<DictDataResponseDto[]>({
    method: 'GET',
    url: buildUrl('/api/v1/system/dict/data/type/{id}', { id }),
    operationId: 'DictController_findOneDataType_v1',
  });
}

/**
 * 字典类型-导出Excel
 * @description 导出字典类型为xlsx文件
 */
export function fetchDictExport(data: ListDictTypeRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/dict/type/export',
    data,
    operationId: 'DictController_export_v1',
  });
}

/**
 * 字典数据-导出Excel
 * @description 导出字典数据为xlsx文件
 */
export function fetchDictExportData(data: ListDictTypeRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/dict/data/export',
    data,
    operationId: 'DictController_exportData_v1',
  });
}

/**
 * 获取所有错误码
 * @description 返回系统中所有的错误码及其含义，按错误码排序
 */
export function fetchDocsGetErrorCodes() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/docs/error-codes',
    operationId: 'DocsController_getErrorCodes_v1',
  });
}

/**
 * 按分类获取错误码
 * @description 返回按分类组织的错误码列表
 */
export function fetchDocsGetErrorCodesByCategory() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/docs/error-codes/by-category',
    operationId: 'DocsController_getErrorCodesByCategory_v1',
  });
}

/**
 * 获取 Markdown 格式错误码文档
 * @description 返回 Markdown 格式的完整错误码文档，可用于生成文档
 */
export function fetchDocsGetErrorCodesMarkdown() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/docs/error-codes/markdown',
    operationId: 'DocsController_getErrorCodesMarkdown_v1',
  });
}

/**
 * 获取 JSON 格式错误码文档
 * @description 返回 JSON 格式的完整错误码文档，包含分类和详细说明
 */
export function fetchDocsGetErrorCodesJson() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/docs/error-codes/json',
    operationId: 'DocsController_getErrorCodesJson_v1',
  });
}

/**
 * 菜单管理-获取路由
 * @description 获取当前用户的路由菜单
 */
export function fetchMenuGetRouters() {
  return apiRequest<MenuResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/menu/getRouters',
    operationId: 'MenuController_getRouters_v1',
  });
}

/**
 * 菜单管理-创建
 * @description 创建新菜单，支持目录、菜单、按钮三种类型
 */
export function fetchMenuCreate(data: CreateMenuRequestDto) {
  return apiRequest<CreateMenuResultResponseDto>({
    method: 'POST',
    url: '/api/v1/system/menu',
    data,
    operationId: 'MenuController_create_v1',
  });
}

/**
 * 菜单管理-修改
 * @description 修改菜单信息
 */
export function fetchMenuUpdate(data: UpdateMenuRequestDto) {
  return apiRequest<UpdateMenuResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/menu',
    data,
    operationId: 'MenuController_update_v1',
  });
}

/**
 * 菜单管理-列表
 * @description 获取菜单列表，支持按名称和状态筛选
 */
export function fetchMenuFindAll(params?: Record<string, unknown>) {
  return apiRequest<MenuResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/menu/list',
    params,
    operationId: 'MenuController_findAll_v1',
  });
}

/**
 * 菜单管理-树形选择
 * @description 获取菜单树形结构，用于下拉选择
 */
export function fetchMenuTreeSelect() {
  return apiRequest<MenuTreeResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/menu/treeselect',
    operationId: 'MenuController_treeSelect_v1',
  });
}

/**
 * 菜单管理-角色菜单树
 * @description 获取角色已分配的菜单树结构
 */
export function fetchMenuRoleMenuTreeselect(roleId: string | number) {
  return apiRequest<RoleMenuTreeSelectResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/menu/roleMenuTreeselect/{roleId}', { roleId }),
    operationId: 'MenuController_roleMenuTreeselect_v1',
  });
}

/**
 * 菜单管理-租户套餐菜单树
 * @description 获取租户套餐已分配的菜单树结构
 */
export function fetchMenuTenantPackageMenuTreeselect(packageId: string | number) {
  return apiRequest<RoleMenuTreeSelectResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/menu/tenantPackageMenuTreeselect/{packageId}', { packageId }),
    operationId: 'MenuController_tenantPackageMenuTreeselect_v1',
  });
}

/**
 * 菜单管理-详情
 * @description 根据菜单ID获取菜单详细信息
 */
export function fetchMenuFindOne(menuId: string | number) {
  return apiRequest<MenuResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/menu/{menuId}', { menuId }),
    operationId: 'MenuController_findOne_v1',
  });
}

/**
 * 菜单管理-删除
 * @description 删除菜单，会同时删除子菜单
 */
export function fetchMenuRemove(menuId: string | number) {
  return apiRequest<DeleteMenuResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/menu/{menuId}', { menuId }),
    operationId: 'MenuController_remove_v1',
  });
}

/**
 * 菜单管理-级联删除
 * @description 级联删除菜单，多个ID用逗号分隔
 */
export function fetchMenuCascadeRemove(menuIds: string | number) {
  return apiRequest<DeleteMenuResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/menu/cascade/{menuIds}', { menuIds }),
    operationId: 'MenuController_cascadeRemove_v1',
  });
}

/**
 * 通知公告-创建
 * @description 发布新的通知公告
 */
export function fetchNoticeCreate(data: CreateNoticeRequestDto) {
  return apiRequest<CreateNoticeResultResponseDto>({
    method: 'POST',
    url: '/api/v1/system/notice',
    data,
    operationId: 'NoticeController_create_v1',
  });
}

/**
 * 通知公告-更新
 * @description 修改通知公告内容
 */
export function fetchNoticeUpdate(data: UpdateNoticeRequestDto) {
  return apiRequest<UpdateNoticeResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/notice',
    data,
    operationId: 'NoticeController_update_v1',
  });
}

/**
 * 通知公告-列表
 * @description 分页查询通知公告列表
 */
export function fetchNoticeFindAll(params?: Record<string, unknown>) {
  return apiRequest<NoticeListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/notice/list',
    params,
    operationId: 'NoticeController_findAll_v1',
  });
}

/**
 * 通知公告-详情
 * @description 根据ID获取通知公告详情
 */
export function fetchNoticeFindOne(id: string | number) {
  return apiRequest<NoticeResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/notice/{id}', { id }),
    operationId: 'NoticeController_findOne_v1',
  });
}

/**
 * 通知公告-删除
 * @description 批量删除通知公告，多个ID用逗号分隔
 */
export function fetchNoticeRemove(id: string | number) {
  return apiRequest<DeleteNoticeResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/notice/{id}', { id }),
    operationId: 'NoticeController_remove_v1',
  });
}

/**
 * 岗位管理-创建
 * @description 创建新岗位
 */
export function fetchPostCreate(data: CreatePostRequestDto) {
  return apiRequest<CreatePostResultResponseDto>({
    method: 'POST',
    url: '/api/v1/system/post',
    data,
    operationId: 'PostController_create_v1',
  });
}

/**
 * 岗位管理-更新
 * @description 修改岗位信息
 */
export function fetchPostUpdate(data: UpdatePostRequestDto) {
  return apiRequest<UpdatePostResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/post',
    data,
    operationId: 'PostController_update_v1',
  });
}

/**
 * 岗位管理-列表
 * @description 分页查询岗位列表
 */
export function fetchPostFindAll(params?: Record<string, unknown>) {
  return apiRequest<PostListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/post/list',
    params,
    operationId: 'PostController_findAll_v1',
  });
}

/**
 * 岗位管理-选择框列表
 * @description 获取岗位选择框列表
 */
export function fetchPostOptionselect(params?: Record<string, unknown>) {
  return apiRequest<PostResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/post/optionselect',
    params,
    operationId: 'PostController_optionselect_v1',
  });
}

/**
 * 岗位管理-部门树
 * @description 获取部门树形结构
 */
export function fetchPostDeptTree() {
  return apiRequest<DeptTreeResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/post/deptTree',
    operationId: 'PostController_deptTree_v1',
  });
}

/**
 * 岗位管理-详情
 * @description 根据ID获取岗位详情
 */
export function fetchPostFindOne(id: string | number) {
  return apiRequest<PostResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/post/{id}', { id }),
    operationId: 'PostController_findOne_v1',
  });
}

/**
 * 岗位管理-删除
 * @description 批量删除岗位，多个ID用逗号分隔
 */
export function fetchPostRemove(ids: string | number) {
  return apiRequest<DeletePostResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/post/{ids}', { ids }),
    operationId: 'PostController_remove_v1',
  });
}

/**
 * 岗位管理-导出Excel
 * @description 导出岗位数据为xlsx文件
 */
export function fetchPostExport(data: ListPostRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/post/export',
    data,
    operationId: 'PostController_export_v1',
  });
}

/**
 * 角色管理-创建
 * @description 创建新角色并分配权限
 */
export function fetchRoleCreate(data: CreateRoleRequestDto) {
  return apiRequest<CreateRoleResultResponseDto>({
    method: 'POST',
    url: '/api/v1/system/role',
    data,
    operationId: 'RoleController_create_v1',
  });
}

/**
 * 角色管理-修改
 * @description 修改角色信息及权限
 */
export function fetchRoleUpdate(data: UpdateRoleRequestDto) {
  return apiRequest<UpdateRoleResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/role',
    data,
    operationId: 'RoleController_update_v1',
  });
}

/**
 * 角色管理-列表
 * @description 分页查询角色列表
 */
export function fetchRoleFindAll(params?: Record<string, unknown>) {
  return apiRequest<RoleListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/role/list',
    params,
    operationId: 'RoleController_findAll_v1',
  });
}

/**
 * 角色管理-选择框列表
 * @description 获取角色选择框列表
 */
export function fetchRoleOptionselect(params?: Record<string, unknown>) {
  return apiRequest<RoleResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/role/optionselect',
    params,
    operationId: 'RoleController_optionselect_v1',
  });
}

/**
 * 角色管理-部门树
 * @description 获取角色数据权限的部门树
 */
export function fetchRoleDeptTree(id: string | number) {
  return apiRequest<RoleDeptTreeResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/role/deptTree/{id}', { id }),
    operationId: 'RoleController_deptTree_v1',
  });
}

/**
 * 角色管理-详情
 * @description 根据角色ID获取角色详情
 */
export function fetchRoleFindOne(id: string | number) {
  return apiRequest<RoleResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/role/{id}', { id }),
    operationId: 'RoleController_findOne_v1',
  });
}

/**
 * 角色管理-删除
 * @description 批量删除角色，多个ID用逗号分隔
 */
export function fetchRoleRemove(id: string | number) {
  return apiRequest<DeleteRoleResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/role/{id}', { id }),
    operationId: 'RoleController_remove_v1',
  });
}

/**
 * 角色管理-数据权限修改
 * @description 修改角色的数据权限范围
 */
export function fetchRoleDataScope(data: UpdateRoleRequestDto) {
  return apiRequest<DataScopeResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/role/dataScope',
    data,
    operationId: 'RoleController_dataScope_v1',
  });
}

/**
 * 角色管理-修改状态
 * @description 启用或停用角色
 */
export function fetchRoleChangeStatus(data: ChangeRoleStatusRequestDto) {
  return apiRequest<ChangeRoleStatusResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/role/changeStatus',
    data,
    operationId: 'RoleController_changeStatus_v1',
  });
}

/**
 * 角色管理-已分配用户列表
 * @description 获取角色已分配的用户列表
 */
export function fetchRoleAuthUserAllocatedList(params?: Record<string, unknown>) {
  return apiRequest<AllocatedUserListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/role/authUser/allocatedList',
    params,
    operationId: 'RoleController_authUserAllocatedList_v1',
  });
}

/**
 * 角色管理-未分配用户列表
 * @description 获取角色未分配的用户列表
 */
export function fetchRoleAuthUserUnAllocatedList(params?: Record<string, unknown>) {
  return apiRequest<AllocatedUserListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/role/authUser/unallocatedList',
    params,
    operationId: 'RoleController_authUserUnAllocatedList_v1',
  });
}

/**
 * 角色管理-解绑用户
 * @description 取消用户与角色的绑定关系
 */
export function fetchRoleAuthUserCancel(data: AuthUserCancelRequestDto) {
  return apiRequest<AuthUserResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/role/authUser/cancel',
    data,
    operationId: 'RoleController_authUserCancel_v1',
  });
}

/**
 * 角色管理-批量解绑用户
 * @description 批量取消用户与角色的绑定关系
 */
export function fetchRoleAuthUserCancelAll(data: AuthUserCancelAllRequestDto) {
  return apiRequest<AuthUserResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/role/authUser/cancelAll',
    data,
    operationId: 'RoleController_authUserCancelAll_v1',
  });
}

/**
 * 角色管理-批量绑定用户
 * @description 批量将用户绑定到角色
 */
export function fetchRoleAuthUserSelectAll(data: AuthUserSelectAllRequestDto) {
  return apiRequest<AuthUserResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/role/authUser/selectAll',
    data,
    operationId: 'RoleController_authUserSelectAll_v1',
  });
}

/**
 * 角色管理-导出Excel
 * @description 导出角色管理数据为xlsx文件
 */
export function fetchRoleExport(data: ListRoleRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/role/export',
    data,
    operationId: 'RoleController_export_v1',
  });
}

/**
 * 租户管理-创建
 * @description 创建新租户并创建租户管理员账号
 */
export function fetchTenantCreate(data: CreateTenantRequestDto) {
  return apiRequest<CreateTenantResultResponseDto>({
    method: 'POST',
    url: '/api/v1/system/tenant',
    data,
    operationId: 'TenantController_create_v1',
  });
}

/**
 * 租户管理-更新
 * @description 修改租户信息
 */
export function fetchTenantUpdate(data: UpdateTenantRequestDto) {
  return apiRequest<UpdateTenantResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/tenant',
    data,
    operationId: 'TenantController_update_v1',
  });
}

/**
 * 租户管理-列表
 * @description 分页查询租户列表
 */
export function fetchTenantFindAll(params?: Record<string, unknown>) {
  return apiRequest<TenantListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/tenant/list',
    params,
    operationId: 'TenantController_findAll_v1',
  });
}

/**
 * 租户管理-同步租户字典
 * @description 将超级管理员的字典数据同步到所有租户
 */
export function fetchTenantSyncTenantDict() {
  return apiRequest<SyncTenantDictResultResponseDto>({
    method: 'GET',
    url: '/api/v1/system/tenant/syncTenantDict',
    operationId: 'TenantController_syncTenantDict_v1',
  });
}

/**
 * 租户管理-同步租户套餐
 * @description 同步租户套餐菜单权限
 */
export function fetchTenantSyncTenantPackage(params?: Record<string, unknown>) {
  return apiRequest<SyncTenantPackageResultResponseDto>({
    method: 'GET',
    url: '/api/v1/system/tenant/syncTenantPackage',
    params,
    operationId: 'TenantController_syncTenantPackage_v1',
  });
}

/**
 * 租户管理-同步租户配置
 * @description 将超级管理员的配置同步到所有租户
 */
export function fetchTenantSyncTenantConfig() {
  return apiRequest<SyncTenantConfigResultResponseDto>({
    method: 'GET',
    url: '/api/v1/system/tenant/syncTenantConfig',
    operationId: 'TenantController_syncTenantConfig_v1',
  });
}

/**
 * 租户管理-可切换租户列表
 * @description 获取可切换的租户列表（仅超级管理员可用）
 */
export function fetchTenantGetSelectList() {
  return apiRequest<TenantSelectListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/tenant/select-list',
    operationId: 'TenantController_getSelectList_v1',
  });
}

/**
 * 租户管理-获取切换状态
 * @description 获取当前租户切换状态
 */
export function fetchTenantGetSwitchStatus() {
  return apiRequest<TenantSwitchStatusResponseDto>({
    method: 'GET',
    url: '/api/v1/system/tenant/switch-status',
    operationId: 'TenantController_getSwitchStatus_v1',
  });
}

/**
 * 租户管理-切换租户
 * @description 切换到指定租户（仅超级管理员可用）
 */
export function fetchTenantSwitchTenant(tenantId: string | number) {
  return apiRequest<TenantSwitchResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/tenant/dynamic/{tenantId}', { tenantId }),
    operationId: 'TenantController_switchTenant_v1',
  });
}

/**
 * 租户管理-恢复原租户
 * @description 清除租户切换状态，恢复到原租户
 */
export function fetchTenantRestoreTenant() {
  return apiRequest<TenantRestoreResponseDto>({
    method: 'GET',
    url: '/api/v1/system/tenant/dynamic/clear',
    operationId: 'TenantController_restoreTenant_v1',
  });
}

/**
 * 租户管理-详情
 * @description 根据ID获取租户详情
 */
export function fetchTenantFindOne(id: string | number) {
  return apiRequest<TenantResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/tenant/{id}', { id }),
    operationId: 'TenantController_findOne_v1',
  });
}

/**
 * 租户管理-删除
 * @description 批量删除租户
 */
export function fetchTenantRemove(ids: string | number) {
  return apiRequest<DeleteTenantResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/tenant/{ids}', { ids }),
    operationId: 'TenantController_remove_v1',
  });
}

/**
 * 租户管理-导出
 * @description 导出租户数据为Excel文件
 */
export function fetchTenantExport(data: ListTenantRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/tenant/export',
    data,
    operationId: 'TenantController_export_v1',
  });
}

/**
 * 租户仪表盘-统计数据
 * @description 获取租户总数、活跃数、用户数等统计卡片数据
 */
export function fetchTenantDashboardGetStats() {
  return apiRequest<TenantStatsResponseDto>({
    method: 'GET',
    url: '/api/v1/system/tenant/dashboard/stats',
    operationId: 'TenantDashboardController_getStats_v1',
  });
}

/**
 * 租户仪表盘-增长趋势
 * @description 获取指定时间范围内的租户增长趋势数据
 */
export function fetchTenantDashboardGetTrend(params?: Record<string, unknown>) {
  return apiRequest<TenantTrendDataResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/tenant/dashboard/trend',
    params,
    operationId: 'TenantDashboardController_getTrend_v1',
  });
}

/**
 * 租户仪表盘-套餐分布
 * @description 获取租户套餐分布饼图数据
 */
export function fetchTenantDashboardGetPackageDistribution() {
  return apiRequest<PackageDistributionResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/tenant/dashboard/package-distribution',
    operationId: 'TenantDashboardController_getPackageDistribution_v1',
  });
}

/**
 * 租户仪表盘-即将到期租户
 * @description 获取指定天数内即将到期的租户列表
 */
export function fetchTenantDashboardGetExpiringTenants(params?: Record<string, unknown>) {
  return apiRequest<ExpiringTenantResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/tenant/dashboard/expiring-tenants',
    params,
    operationId: 'TenantDashboardController_getExpiringTenants_v1',
  });
}

/**
 * 租户仪表盘-配额使用TOP10
 * @description 获取配额使用率最高的10个租户
 */
export function fetchTenantDashboardGetQuotaTopTenants() {
  return apiRequest<QuotaTopTenantResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/tenant/dashboard/quota-top',
    operationId: 'TenantDashboardController_getQuotaTopTenants_v1',
  });
}

/**
 * 租户仪表盘-完整数据
 * @description 获取仪表盘所有数据（统计、趋势、分布、到期列表、TOP10）
 */
export function fetchTenantDashboardGetDashboardData(params?: Record<string, unknown>) {
  return apiRequest<DashboardDataResponseDto>({
    method: 'GET',
    url: '/api/v1/system/tenant/dashboard',
    params,
    operationId: 'TenantDashboardController_getDashboardData_v1',
  });
}

/**
 * 租户配额列表
 * @description 分页查询所有租户的配额使用情况
 */
export function fetchTenantQuotaFindAll(params?: Record<string, unknown>) {
  return apiRequest<TenantQuotaResponseDto>({
    method: 'GET',
    url: '/api/v1/system/tenant/quota/list',
    params,
    operationId: 'TenantQuotaController_findAll_v1',
  });
}

/**
 * 租户配额详情
 * @description 获取单个租户的配额详情，包含变更历史
 */
export function fetchTenantQuotaFindOne(tenantId: string | number) {
  return apiRequest<TenantQuotaResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/tenant/quota/{tenantId}', { tenantId }),
    operationId: 'TenantQuotaController_findOne_v1',
  });
}

/**
 * 更新租户配额
 * @description 修改租户的配额限制值
 */
export function fetchTenantQuotaUpdate(data: UpdateTenantQuotaRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/tenant/quota',
    data,
    operationId: 'TenantQuotaController_update_v1',
  });
}

/**
 * 检查配额
 * @description 检查指定租户的配额是否允许操作
 */
export function fetchTenantQuotaCheckQuota(data: CheckQuotaRequestDto) {
  return apiRequest<TenantQuotaResponseDto>({
    method: 'POST',
    url: '/api/v1/system/tenant/quota/check',
    data,
    operationId: 'TenantQuotaController_checkQuota_v1',
  });
}

/**
 * 审计日志列表
 * @description 分页查询所有租户的审计日志
 */
export function fetchTenantAuditFindAll(params?: Record<string, unknown>) {
  return apiRequest<TenantAuditLogListVo>({
    method: 'GET',
    url: '/api/v1/system/tenant/audit/list',
    params,
    operationId: 'TenantAuditController_findAll_v1',
  });
}

/**
 * 审计日志详情
 * @description 获取单条审计日志的详细信息，包含操作前后数据变化
 */
export function fetchTenantAuditFindOne(id: string | number) {
  return apiRequest<TenantAuditLogDetailVo>({
    method: 'GET',
    url: buildUrl('/api/v1/system/tenant/audit/{id}', { id }),
    operationId: 'TenantAuditController_findOne_v1',
  });
}

/**
 * 审计日志统计
 * @description 获取审计日志统计数据
 */
export function fetchTenantAuditGetStats(params?: Record<string, unknown>) {
  return apiRequest<TenantAuditLogStatsVo>({
    method: 'GET',
    url: '/api/v1/system/tenant/audit/stats/summary',
    params,
    operationId: 'TenantAuditController_getStats_v1',
  });
}

/**
 * 导出审计日志
 * @description 导出审计日志为Excel格式
 */
export function fetchTenantAuditExport(data: ExportTenantAuditLogRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/tenant/audit/export',
    data,
    operationId: 'TenantAuditController_export_v1',
  });
}

/**
 * 租户套餐管理-创建
 * @description 创建新租户套餐
 */
export function fetchTenantPackageCreate(data: CreateTenantPackageRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/tenant/package',
    data,
    operationId: 'TenantPackageController_create_v1',
  });
}

/**
 * 租户套餐管理-更新
 * @description 修改租户套餐信息
 */
export function fetchTenantPackageUpdate(data: UpdateTenantPackageRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/tenant/package',
    data,
    operationId: 'TenantPackageController_update_v1',
  });
}

/**
 * 租户套餐管理-列表
 * @description 分页查询租户套餐列表
 */
export function fetchTenantPackageFindAll(params?: Record<string, unknown>) {
  return apiRequest<TenantPackageListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/tenant/package/list',
    params,
    operationId: 'TenantPackageController_findAll_v1',
  });
}

/**
 * 租户套餐管理-选择框列表
 * @description 获取租户套餐选择框列表
 */
export function fetchTenantPackageSelectList() {
  return apiRequest<TenantPackageSelectResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/tenant/package/selectList',
    operationId: 'TenantPackageController_selectList_v1',
  });
}

/**
 * 租户套餐管理-详情
 * @description 根据ID获取租户套餐详情
 */
export function fetchTenantPackageFindOne(id: string | number) {
  return apiRequest<TenantPackageResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/tenant/package/{id}', { id }),
    operationId: 'TenantPackageController_findOne_v1',
  });
}

/**
 * 租户套餐管理-删除
 * @description 批量删除租户套餐
 */
export function fetchTenantPackageRemove(ids: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/tenant/package/{ids}', { ids }),
    operationId: 'TenantPackageController_remove_v1',
  });
}

/**
 * 租户套餐管理-导出
 * @description 导出租户套餐数据为Excel文件
 */
export function fetchTenantPackageExport(data: ListTenantPackageRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/tenant/package/export',
    data,
    operationId: 'TenantPackageController_export_v1',
  });
}

/**
 * 数据表列表
 * @description 分页查询已导入的数据表列表
 */
export function fetchToolFindAll(params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/list',
    params,
    operationId: 'ToolController_findAll_v1',
  });
}

/**
 * 查询数据库表列表
 * @description 查询数据库中未导入的表
 */
export function fetchToolGenDbList(params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/db/list',
    params,
    operationId: 'ToolController_genDbList_v1',
  });
}

/**
 * 查询数据源名称列表
 * @description 获取可用的数据源名称
 */
export function fetchToolGetDataNames() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/getDataNames',
    operationId: 'ToolController_getDataNames_v1',
  });
}

/**
 * 导入表
 * @description 将数据库表导入到代码生成列表
 */
export function fetchToolGenImportTable(data: TableName) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/tool/gen/importTable',
    data,
    operationId: 'ToolController_genImportTable_v1',
  });
}

/**
 * 同步表结构
 * @description 从数据库同步表字段结构
 */
export function fetchToolSynchDb(tableName: string | number) {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/synchDb/{tableName}', { tableName }),
    operationId: 'ToolController_synchDb_v1',
  });
}

/**
 * 查询表详细信息
 * @description 获取代码生成表详情，包含字段信息
 */
export function fetchToolGen(id: string | number) {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/{id}', { id }),
    operationId: 'ToolController_gen_v1',
  });
}

/**
 * 删除表数据
 * @description 从代码生成列表中删除表
 */
export function fetchToolRemove(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/tool/gen/{id}', { id }),
    operationId: 'ToolController_remove_v1',
  });
}

/**
 * 修改代码生成信息
 * @description 修改表的代码生成配置
 */
export function fetchToolGenUpdate(data: GenTableUpdate) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/tool/gen',
    data,
    operationId: 'ToolController_genUpdate_v1',
  });
}

/**
 * 批量生成代码（通过表名）
 * @description 根据表名生成代码并下载为zip压缩包，文件名格式：{projectName}_{timestamp}.zip
 */
export function fetchToolBatchGenCode(params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/batchGenCode/zip',
    params,
    operationId: 'ToolController_batchGenCode_v1',
  });
}

/**
 * 批量生成代码（通过表ID）
 * @description 根据表ID列表生成代码并下载为zip压缩包，文件名格式：{projectName}_{timestamp}.zip
 */
export function fetchToolBatchGenCodeByIds(data: GenerateCodeDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/tool/gen/batchGenCode',
    data,
    operationId: 'ToolController_batchGenCodeByIds_v1',
  });
}

/**
 * 预览生成代码
 * @description 在线预览生成的代码内容
 */
export function fetchToolPreview(id: string | number) {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/preview/{id}', { id }),
    operationId: 'ToolController_preview_v1',
  });
}

/**
 * 创建数据源
 * @description 创建新的数据库连接配置
 */
export function fetchDataSourceCreate(data: CreateDataSourceDto) {
  return apiRequest<DataSourceResponseDto>({
    method: 'POST',
    url: '/api/v1/tool/gen/datasource',
    data,
    operationId: 'DataSourceController_create_v1',
  });
}

/**
 * 更新数据源
 * @description 更新数据库连接配置
 */
export function fetchDataSourceUpdate(id: string | number, data: UpdateDataSourceDto) {
  return apiRequest<DataSourceResponseDto>({
    method: 'PUT',
    url: buildUrl('/api/v1/tool/gen/datasource/{id}', { id }),
    data,
    operationId: 'DataSourceController_update_v1',
  });
}

/**
 * 删除数据源
 * @description 删除数据库连接配置（软删除）
 */
export function fetchDataSourceDelete(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/tool/gen/datasource/{id}', { id }),
    operationId: 'DataSourceController_delete_v1',
  });
}

/**
 * 查询数据源详情
 * @description 根据ID查询数据源详情
 */
export function fetchDataSourceFindOne(id: string | number) {
  return apiRequest<DataSourceResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/datasource/{id}', { id }),
    operationId: 'DataSourceController_findOne_v1',
  });
}

/**
 * 查询数据源列表
 * @description 分页查询数据源列表
 */
export function fetchDataSourceList(params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/datasource/list',
    params,
    operationId: 'DataSourceController_list_v1',
  });
}

/**
 * 测试数据源连接
 * @description 测试数据库连接是否可用
 */
export function fetchDataSourceTestConnection(data: TestConnectionDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/tool/gen/datasource/test',
    data,
    operationId: 'DataSourceController_testConnection_v1',
  });
}

/**
 * 测试已保存的数据源连接
 * @description 测试已保存的数据库连接是否可用
 */
export function fetchDataSourceTestConnectionById(id: string | number) {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/datasource/{id}/test', { id }),
    operationId: 'DataSourceController_testConnectionById_v1',
  });
}

/**
 * 获取数据源的表列表
 * @description 获取指定数据源中的所有表
 */
export function fetchDataSourceGetTables(id: string | number) {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/datasource/{id}/tables', { id }),
    operationId: 'DataSourceController_getTables_v1',
  });
}

/**
 * 获取表的列信息
 * @description 获取指定表的所有列信息
 */
export function fetchDataSourceGetColumns(id: string | number, tableName: string | number) {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/datasource/{id}/tables/{tableName}/columns', { id, tableName }),
    operationId: 'DataSourceController_getColumns_v1',
  });
}

/**
 * 创建模板组
 * @description 创建新的模板组
 */
export function fetchTemplateCreateGroup(data: CreateTemplateGroupDto) {
  return apiRequest<TemplateGroupResponseDto>({
    method: 'POST',
    url: '/api/v1/tool/gen/template/group',
    data,
    operationId: 'TemplateController_createGroup_v1',
  });
}

/**
 * 更新模板组
 * @description 更新模板组信息
 */
export function fetchTemplateUpdateGroup(id: string | number, data: UpdateTemplateGroupDto) {
  return apiRequest<TemplateGroupResponseDto>({
    method: 'PUT',
    url: buildUrl('/api/v1/tool/gen/template/group/{id}', { id }),
    data,
    operationId: 'TemplateController_updateGroup_v1',
  });
}

/**
 * 删除模板组
 * @description 删除模板组及其所有模板（软删除）
 */
export function fetchTemplateDeleteGroup(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/tool/gen/template/group/{id}', { id }),
    operationId: 'TemplateController_deleteGroup_v1',
  });
}

/**
 * 查询模板组详情
 * @description 根据ID查询模板组详情，包含所有模板
 */
export function fetchTemplateFindOneGroup(id: string | number) {
  return apiRequest<TemplateGroupResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/template/group/{id}', { id }),
    operationId: 'TemplateController_findOneGroup_v1',
  });
}

/**
 * 查询模板组列表
 * @description 分页查询模板组列表，包含当前租户和系统级模板组
 */
export function fetchTemplateListGroups(params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/template/group/list',
    params,
    operationId: 'TemplateController_listGroups_v1',
  });
}

/**
 * 获取默认模板组
 * @description 获取当前租户或系统级的默认模板组
 */
export function fetchTemplateGetDefaultGroup() {
  return apiRequest<TemplateGroupResponseDto>({
    method: 'GET',
    url: '/api/v1/tool/gen/template/group/default',
    operationId: 'TemplateController_getDefaultGroup_v1',
  });
}

/**
 * 导出模板组
 * @description 将模板组导出为 JSON 文件
 */
export function fetchTemplateExportGroup(id: string | number) {
  return apiRequest<ExportTemplateGroupDto>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/template/group/{id}/export', { id }),
    operationId: 'TemplateController_exportGroup_v1',
  });
}

/**
 * 导入模板组
 * @description 从 JSON 数据导入模板组
 */
export function fetchTemplateImportGroup(data: ImportTemplateGroupDto) {
  return apiRequest<TemplateGroupResponseDto>({
    method: 'POST',
    url: '/api/v1/tool/gen/template/group/import',
    data,
    operationId: 'TemplateController_importGroup_v1',
  });
}

/**
 * 创建模板
 * @description 在指定模板组中创建新模板
 */
export function fetchTemplateCreateTemplate(data: CreateTemplateDto) {
  return apiRequest<TemplateResponseDto>({
    method: 'POST',
    url: '/api/v1/tool/gen/template',
    data,
    operationId: 'TemplateController_createTemplate_v1',
  });
}

/**
 * 更新模板
 * @description 更新模板信息
 */
export function fetchTemplateUpdateTemplate(id: string | number, data: UpdateTemplateDto) {
  return apiRequest<TemplateResponseDto>({
    method: 'PUT',
    url: buildUrl('/api/v1/tool/gen/template/{id}', { id }),
    data,
    operationId: 'TemplateController_updateTemplate_v1',
  });
}

/**
 * 删除模板
 * @description 删除模板（软删除）
 */
export function fetchTemplateDeleteTemplate(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/tool/gen/template/{id}', { id }),
    operationId: 'TemplateController_deleteTemplate_v1',
  });
}

/**
 * 查询模板详情
 * @description 根据ID查询模板详情
 */
export function fetchTemplateFindOneTemplate(id: string | number) {
  return apiRequest<TemplateResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/template/{id}', { id }),
    operationId: 'TemplateController_findOneTemplate_v1',
  });
}

/**
 * 查询模板列表
 * @description 分页查询模板列表
 */
export function fetchTemplateListTemplates(params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/template/list',
    params,
    operationId: 'TemplateController_listTemplates_v1',
  });
}

/**
 * 验证模板语法
 * @description 验证模板内容的语法是否正确，并返回使用的变量列表
 */
export function fetchTemplateValidateTemplate(data: ValidateTemplateDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/tool/gen/template/validate',
    data,
    operationId: 'TemplateController_validateTemplate_v1',
  });
}

/**
 * 查询历史记录列表
 * @description 分页查询代码生成历史记录列表
 */
export function fetchHistoryList(params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/tool/gen/history/list',
    params,
    operationId: 'HistoryController_list_v1',
  });
}

/**
 * 查询历史记录详情
 * @description 根据ID查询历史记录详情，包含生成的代码快照
 */
export function fetchHistoryFindOne(id: string | number) {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/history/{id}', { id }),
    operationId: 'HistoryController_findOne_v1',
  });
}

/**
 * 删除历史记录
 * @description 删除指定的历史记录
 */
export function fetchHistoryDelete(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/tool/gen/history/{id}', { id }),
    operationId: 'HistoryController_delete_v1',
  });
}

/**
 * 下载历史版本代码
 * @description 下载指定历史版本的生成代码（ZIP格式）
 */
export function fetchHistoryDownload(id: string | number) {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/tool/gen/history/{id}/download', { id }),
    operationId: 'HistoryController_download_v1',
  });
}

/**
 * 批量删除历史记录
 * @description 批量删除多条历史记录
 */
export function fetchHistoryBatchDelete() {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/tool/gen/history/batch',
    operationId: 'HistoryController_batchDelete_v1',
  });
}

/**
 * 清理过期历史记录
 * @description 清理指定天数之前的历史记录（默认30天）
 */
export function fetchHistoryCleanup(params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/tool/gen/history/cleanup',
    params,
    operationId: 'HistoryController_cleanup_v1',
  });
}

/**
 * 获取当前登录用户信息 - 供 Soybean 前端调用
GET /system/user/getInfo
 * @description 获取当前登录用户的详细信息、角色和权限
 */
export function fetchUserGetInfo() {
  return apiRequest<CurrentUserInfoResponseDto>({
    method: 'GET',
    url: '/api/v1/system/user/getInfo',
    operationId: 'UserController_getInfo_v1',
  });
}

/**
 * 个人中心-用户信息
 * @description 获取当前登录用户的个人信息
 */
export function fetchUserProfile() {
  return apiRequest<UserResponseDto>({
    method: 'GET',
    url: '/api/v1/system/user/profile',
    operationId: 'UserController_profile_v1',
  });
}

/**
 * 个人中心-修改用户信息
 * @description 修改当前用户的个人基本信息
 */
export function fetchUserUpdateProfile(data: UpdateProfileDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/user/profile',
    data,
    operationId: 'UserController_updateProfile_v1',
  });
}

/**
 * 个人中心-上传用户头像
 * @description 上传并更新当前用户头像
 */
export function fetchUserAvatar() {
  return apiRequest<UserAvatarResponseDto>({
    method: 'POST',
    url: '/api/v1/system/user/profile/avatar',
    operationId: 'UserController_avatar_v1',
  });
}

/**
 * 个人中心-修改密码
 * @description 修改当前用户的登录密码
 */
export function fetchUserUpdatePwd(data: UpdatePwdDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/user/profile/updatePwd',
    data,
    operationId: 'UserController_updatePwd_v1',
  });
}

/**
 * 用户-创建
 * @description 创建新用户，可分配角色和岗位
 */
export function fetchUserCreate(data: CreateUserDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/user',
    data,
    operationId: 'UserController_create_v1',
  });
}

/**
 * 用户-角色和岗位列表
 * @description 获取所有角色和岗位列表，用于新建/编辑用户时选择
 */
export function fetchUserFindPostAndRoleAll() {
  return apiRequest<UserDetailResponseDto>({
    method: 'GET',
    url: '/api/v1/system/user',
    operationId: 'UserController_findPostAndRoleAll_v1',
  });
}

/**
 * 用户-更新
 * @description 更新用户基本信息
 */
export function fetchUserUpdate(data: UpdateUserDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/user',
    data,
    operationId: 'UserController_update_v1',
  });
}

/**
 * 用户-批量创建
 * @description 批量创建用户，单次最多100个，返回每个用户的创建结果
 */
export function fetchUserBatchCreate(data: BatchCreateUserDto) {
  return apiRequest<BatchResultDto>({
    method: 'POST',
    url: '/api/v1/system/user/batch',
    data,
    operationId: 'UserController_batchCreate_v1',
  });
}

/**
 * 用户-批量删除
 * @description 批量删除用户，单次最多100个，返回每个用户的删除结果
 */
export function fetchUserBatchDelete(data: BatchDeleteUserDto) {
  return apiRequest<BatchResultDto>({
    method: 'DELETE',
    url: '/api/v1/system/user/batch',
    data,
    operationId: 'UserController_batchDelete_v1',
  });
}

/**
 * 用户-列表
 * @description 分页查询用户列表，支持多条件筛选
 */
export function fetchUserFindAll(params?: Record<string, unknown>) {
  return apiRequest<UserListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/user/list',
    params,
    operationId: 'UserController_findAll_v1',
  });
}

/**
 * 用户-部门树
 * @description 获取部门树形结构，用于用户筛选
 */
export function fetchUserDeptTree() {
  return apiRequest<DeptTreeNodeResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/user/deptTree',
    operationId: 'UserController_deptTree_v1',
  });
}

/**
 * 用户-分配角色详情
 * @description 获取用户已分配的角色信息
 */
export function fetchUserAuthRole(id: string | number) {
  return apiRequest<AuthRoleResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/user/authRole/{id}', { id }),
    operationId: 'UserController_authRole_v1',
  });
}

/**
 * 用户-更新角色分配
 * @description 更新用户的角色分配
 */
export function fetchUserUpdateAuthRole(params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/user/authRole',
    params,
    operationId: 'UserController_updateAuthRole_v1',
  });
}

/**
 * 用户-选择框列表
 * @description 获取用户选择框列表
 */
export function fetchUserOptionselect() {
  return apiRequest<UserOptionSelectResponseDto>({
    method: 'GET',
    url: '/api/v1/system/user/optionselect',
    operationId: 'UserController_optionselect_v1',
  });
}

/**
 * 用户-部门用户列表
 * @description 获取指定部门的用户列表
 */
export function fetchUserFindByDeptId(deptId: string | number) {
  return apiRequest<UserListResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/user/list/dept/{deptId}', { deptId }),
    operationId: 'UserController_findByDeptId_v1',
  });
}

/**
 * 用户-详情
 * @description 根据用户ID获取用户详细信息
 */
export function fetchUserFindOne(userId: string | number) {
  return apiRequest<UserDetailResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/user/{userId}', { userId }),
    operationId: 'UserController_findOne_v1',
  });
}

/**
 * 用户-修改状态
 * @description 启用或停用用户账号
 */
export function fetchUserChangeStatus(data: ChangeUserStatusDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/user/changeStatus',
    data,
    operationId: 'UserController_changeStatus_v1',
  });
}

/**
 * 用户-重置密码
 * @description 管理员重置用户密码
 */
export function fetchUserResetPwd(data: ResetPwdDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/user/resetPwd',
    data,
    operationId: 'UserController_resetPwd_v1',
  });
}

/**
 * 用户-删除
 * @description 批量删除用户，多个ID用逗号分隔
 */
export function fetchUserRemove(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/user/{id}', { id }),
    operationId: 'UserController_remove_v1',
  });
}

/**
 * 用户-导出Excel
 * @description 导出用户信息数据为xlsx文件
 */
export function fetchUserExport(data: ListUserDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/user/export',
    data,
    operationId: 'UserController_export_v1',
  });
}

/**
 * 创建文件夹
 */
export function fetchFileManagerCreateFolder(data: CreateFolderRequestDto) {
  return apiRequest<FolderResponseDto>({
    method: 'POST',
    url: '/api/v1/system/file-manager/folder',
    data,
    operationId: 'FileManagerController_createFolder_v1',
  });
}

/**
 * 更新文件夹
 */
export function fetchFileManagerUpdateFolder(data: UpdateFolderRequestDto) {
  return apiRequest<FolderResponseDto>({
    method: 'PUT',
    url: '/api/v1/system/file-manager/folder',
    data,
    operationId: 'FileManagerController_updateFolder_v1',
  });
}

/**
 * 删除文件夹
 */
export function fetchFileManagerDeleteFolder(folderId: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/file-manager/folder/{folderId}', { folderId }),
    operationId: 'FileManagerController_deleteFolder_v1',
  });
}

/**
 * 获取文件夹列表
 */
export function fetchFileManagerListFolders(params?: Record<string, unknown>) {
  return apiRequest<FolderResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/file-manager/folder/list',
    params,
    operationId: 'FileManagerController_listFolders_v1',
  });
}

/**
 * 获取文件夹树
 */
export function fetchFileManagerGetFolderTree() {
  return apiRequest<FolderTreeNodeResponseDto[]>({
    method: 'GET',
    url: '/api/v1/system/file-manager/folder/tree',
    operationId: 'FileManagerController_getFolderTree_v1',
  });
}

/**
 * 获取文件列表
 */
export function fetchFileManagerListFiles(params?: Record<string, unknown>) {
  return apiRequest<FileListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/file-manager/file/list',
    params,
    operationId: 'FileManagerController_listFiles_v1',
  });
}

/**
 * 移动文件
 */
export function fetchFileManagerMoveFiles(data: MoveFileRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/file-manager/file/move',
    data,
    operationId: 'FileManagerController_moveFiles_v1',
  });
}

/**
 * 重命名文件
 */
export function fetchFileManagerRenameFile(data: RenameFileRequestDto) {
  return apiRequest<FileResponseDto>({
    method: 'POST',
    url: '/api/v1/system/file-manager/file/rename',
    data,
    operationId: 'FileManagerController_renameFile_v1',
  });
}

/**
 * 删除文件
 */
export function fetchFileManagerDeleteFiles() {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/system/file-manager/file',
    operationId: 'FileManagerController_deleteFiles_v1',
  });
}

/**
 * 获取文件详情
 */
export function fetchFileManagerGetFileDetail(uploadId: string | number) {
  return apiRequest<FileResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/file-manager/file/{uploadId}', { uploadId }),
    operationId: 'FileManagerController_getFileDetail_v1',
  });
}

/**
 * 创建分享链接
 */
export function fetchFileManagerCreateShare(data: CreateShareRequestDto) {
  return apiRequest<CreateShareResultResponseDto>({
    method: 'POST',
    url: '/api/v1/system/file-manager/share',
    data,
    operationId: 'FileManagerController_createShare_v1',
  });
}

/**
 * 获取分享信息（无需登录）
 */
export function fetchFileManagerGetShare(shareId: string | number, params?: Record<string, unknown>) {
  return apiRequest<ShareInfoResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/file-manager/share/{shareId}', { shareId }),
    params,
    operationId: 'FileManagerController_getShare_v1',
  });
}

/**
 * 取消分享
 */
export function fetchFileManagerCancelShare(shareId: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/file-manager/share/{shareId}', { shareId }),
    operationId: 'FileManagerController_cancelShare_v1',
  });
}

/**
 * 下载分享文件（无需登录）
 */
export function fetchFileManagerDownloadShare(shareId: string | number) {
  return apiRequest<unknown>({
    method: 'POST',
    url: buildUrl('/api/v1/system/file-manager/share/{shareId}/download', { shareId }),
    operationId: 'FileManagerController_downloadShare_v1',
  });
}

/**
 * 我的分享列表
 */
export function fetchFileManagerMyShares() {
  return apiRequest<ShareListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/file-manager/share/my/list',
    operationId: 'FileManagerController_myShares_v1',
  });
}

/**
 * 获取回收站文件列表
 */
export function fetchFileManagerGetRecycleList(params?: Record<string, unknown>) {
  return apiRequest<FileListResponseDto>({
    method: 'GET',
    url: '/api/v1/system/file-manager/recycle/list',
    params,
    operationId: 'FileManagerController_getRecycleList_v1',
  });
}

/**
 * 恢复回收站文件
 */
export function fetchFileManagerRestoreFiles() {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/file-manager/recycle/restore',
    operationId: 'FileManagerController_restoreFiles_v1',
  });
}

/**
 * 彻底删除回收站文件
 */
export function fetchFileManagerClearRecycle() {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: '/api/v1/system/file-manager/recycle/clear',
    operationId: 'FileManagerController_clearRecycle_v1',
  });
}

/**
 * 获取文件版本历史
 */
export function fetchFileManagerGetFileVersions(uploadId: string | number) {
  return apiRequest<FileVersionListResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/file-manager/file/{uploadId}/versions', { uploadId }),
    operationId: 'FileManagerController_getFileVersions_v1',
  });
}

/**
 * 恢复到指定版本
 */
export function fetchFileManagerRestoreVersion() {
  return apiRequest<RestoreVersionResultResponseDto>({
    method: 'POST',
    url: '/api/v1/system/file-manager/file/restore-version',
    operationId: 'FileManagerController_restoreVersion_v1',
  });
}

/**
 * 获取文件访问令牌
 */
export function fetchFileManagerGetAccessToken(uploadId: string | number) {
  return apiRequest<AccessTokenResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/file-manager/file/{uploadId}/access-token', { uploadId }),
    operationId: 'FileManagerController_getAccessToken_v1',
  });
}

/**
 * 下载文件（需要令牌）
 */
export function fetchFileManagerDownloadFile(uploadId: string | number, params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/file-manager/file/{uploadId}/download', { uploadId }),
    params,
    operationId: 'FileManagerController_downloadFile_v1',
  });
}

/**
 * 批量下载文件（打包为zip）
 */
export function fetchFileManagerBatchDownload() {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/file-manager/file/batch-download',
    operationId: 'FileManagerController_batchDownload_v1',
  });
}

/**
 * 获取存储使用统计
 */
export function fetchFileManagerGetStorageStats() {
  return apiRequest<StorageStatsResponseDto>({
    method: 'GET',
    url: '/api/v1/system/file-manager/storage/stats',
    operationId: 'FileManagerController_getStorageStats_v1',
  });
}

/**
 * 短信渠道-创建
 * @description 创建新的短信渠道
 */
export function fetchSmsChannelCreate(data: CreateSmsChannelRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/sms/channel',
    data,
    operationId: 'SmsChannelController_create_v1',
  });
}

/**
 * 短信渠道-更新
 * @description 修改短信渠道信息
 */
export function fetchSmsChannelUpdate(data: UpdateSmsChannelRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/sms/channel',
    data,
    operationId: 'SmsChannelController_update_v1',
  });
}

/**
 * 短信渠道-列表
 * @description 分页查询短信渠道列表
 */
export function fetchSmsChannelFindAll(params?: Record<string, unknown>) {
  return apiRequest<SmsChannelResponseDto>({
    method: 'GET',
    url: '/api/v1/system/sms/channel/list',
    params,
    operationId: 'SmsChannelController_findAll_v1',
  });
}

/**
 * 短信渠道-启用列表
 * @description 获取所有启用的短信渠道（用于下拉选择）
 */
export function fetchSmsChannelGetEnabledChannels() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/sms/channel/enabled',
    operationId: 'SmsChannelController_getEnabledChannels_v1',
  });
}

/**
 * 短信渠道-详情
 * @description 根据ID获取短信渠道详情
 */
export function fetchSmsChannelFindOne(id: string | number) {
  return apiRequest<SmsChannelResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/sms/channel/{id}', { id }),
    operationId: 'SmsChannelController_findOne_v1',
  });
}

/**
 * 短信渠道-删除
 * @description 批量删除短信渠道，多个ID用逗号分隔
 */
export function fetchSmsChannelRemove(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/sms/channel/{id}', { id }),
    operationId: 'SmsChannelController_remove_v1',
  });
}

/**
 * 短信模板-创建
 * @description 创建新的短信模板
 */
export function fetchSmsTemplateCreate(data: CreateSmsTemplateRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/sms/template',
    data,
    operationId: 'SmsTemplateController_create_v1',
  });
}

/**
 * 短信模板-更新
 * @description 修改短信模板信息
 */
export function fetchSmsTemplateUpdate(data: UpdateSmsTemplateRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/sms/template',
    data,
    operationId: 'SmsTemplateController_update_v1',
  });
}

/**
 * 短信模板-列表
 * @description 分页查询短信模板列表
 */
export function fetchSmsTemplateFindAll(params?: Record<string, unknown>) {
  return apiRequest<SmsTemplateResponseDto>({
    method: 'GET',
    url: '/api/v1/system/sms/template/list',
    params,
    operationId: 'SmsTemplateController_findAll_v1',
  });
}

/**
 * 短信模板-详情
 * @description 根据ID获取短信模板详情
 */
export function fetchSmsTemplateFindOne(id: string | number) {
  return apiRequest<SmsTemplateResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/sms/template/{id}', { id }),
    operationId: 'SmsTemplateController_findOne_v1',
  });
}

/**
 * 短信模板-删除
 * @description 批量删除短信模板，多个ID用逗号分隔
 */
export function fetchSmsTemplateRemove(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/sms/template/{id}', { id }),
    operationId: 'SmsTemplateController_remove_v1',
  });
}

/**
 * 短信发送-单发
 * @description 发送单条短信
 */
export function fetchSmsSendSend(data: SendSmsDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/sms/send',
    data,
    operationId: 'SmsSendController_send_v1',
  });
}

/**
 * 短信发送-批量
 * @description 批量发送短信
 */
export function fetchSmsSendBatchSend(data: BatchSendSmsDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/sms/send/batch',
    data,
    operationId: 'SmsSendController_batchSend_v1',
  });
}

/**
 * 短信发送-重发
 * @description 重发失败的短信
 */
export function fetchSmsSendResend(logId: string | number) {
  return apiRequest<unknown>({
    method: 'POST',
    url: buildUrl('/api/v1/system/sms/send/resend/{logId}', { logId }),
    operationId: 'SmsSendController_resend_v1',
  });
}

/**
 * 短信日志-列表
 * @description 分页查询短信日志列表
 */
export function fetchSmsLogFindAll(params?: Record<string, unknown>) {
  return apiRequest<SmsLogResponseDto>({
    method: 'GET',
    url: '/api/v1/system/sms/log/list',
    params,
    operationId: 'SmsLogController_findAll_v1',
  });
}

/**
 * 短信日志-详情
 * @description 根据ID获取短信日志详情
 */
export function fetchSmsLogFindOne(id: string | number) {
  return apiRequest<SmsLogResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/sms/log/{id}', { id }),
    operationId: 'SmsLogController_findOne_v1',
  });
}

/**
 * 短信日志-按手机号查询
 * @description 根据手机号查询短信日志
 */
export function fetchSmsLogFindByMobile(mobile: string | number) {
  return apiRequest<unknown>({
    method: 'GET',
    url: buildUrl('/api/v1/system/sms/log/mobile/{mobile}', { mobile }),
    operationId: 'SmsLogController_findByMobile_v1',
  });
}

/**
 * 邮箱账号-创建
 * @description 创建新的邮箱账号
 */
export function fetchMailAccountCreate(data: CreateMailAccountRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/mail/account',
    data,
    operationId: 'MailAccountController_create_v1',
  });
}

/**
 * 邮箱账号-更新
 * @description 修改邮箱账号信息
 */
export function fetchMailAccountUpdate(data: UpdateMailAccountRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/mail/account',
    data,
    operationId: 'MailAccountController_update_v1',
  });
}

/**
 * 邮箱账号-列表
 * @description 分页查询邮箱账号列表
 */
export function fetchMailAccountFindAll(params?: Record<string, unknown>) {
  return apiRequest<MailAccountResponseDto>({
    method: 'GET',
    url: '/api/v1/system/mail/account/list',
    params,
    operationId: 'MailAccountController_findAll_v1',
  });
}

/**
 * 邮箱账号-启用列表
 * @description 获取所有启用的邮箱账号（用于下拉选择）
 */
export function fetchMailAccountGetEnabledAccounts() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/mail/account/enabled',
    operationId: 'MailAccountController_getEnabledAccounts_v1',
  });
}

/**
 * 邮箱账号-详情
 * @description 根据ID获取邮箱账号详情
 */
export function fetchMailAccountFindOne(id: string | number) {
  return apiRequest<MailAccountResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/mail/account/{id}', { id }),
    operationId: 'MailAccountController_findOne_v1',
  });
}

/**
 * 邮箱账号-删除
 * @description 批量删除邮箱账号，多个ID用逗号分隔
 */
export function fetchMailAccountRemove(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/mail/account/{id}', { id }),
    operationId: 'MailAccountController_remove_v1',
  });
}

/**
 * 邮件模板-创建
 * @description 创建新的邮件模板
 */
export function fetchMailTemplateCreate(data: CreateMailTemplateRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/mail/template',
    data,
    operationId: 'MailTemplateController_create_v1',
  });
}

/**
 * 邮件模板-更新
 * @description 修改邮件模板信息
 */
export function fetchMailTemplateUpdate(data: UpdateMailTemplateRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/mail/template',
    data,
    operationId: 'MailTemplateController_update_v1',
  });
}

/**
 * 邮件模板-列表
 * @description 分页查询邮件模板列表
 */
export function fetchMailTemplateFindAll(params?: Record<string, unknown>) {
  return apiRequest<MailTemplateResponseDto>({
    method: 'GET',
    url: '/api/v1/system/mail/template/list',
    params,
    operationId: 'MailTemplateController_findAll_v1',
  });
}

/**
 * 邮件模板-详情
 * @description 根据ID获取邮件模板详情
 */
export function fetchMailTemplateFindOne(id: string | number) {
  return apiRequest<MailTemplateResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/mail/template/{id}', { id }),
    operationId: 'MailTemplateController_findOne_v1',
  });
}

/**
 * 邮件模板-删除
 * @description 批量删除邮件模板，多个ID用逗号分隔
 */
export function fetchMailTemplateRemove(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/mail/template/{id}', { id }),
    operationId: 'MailTemplateController_remove_v1',
  });
}

/**
 * 邮件发送-单发
 * @description 使用模板发送单封邮件
 */
export function fetchMailSendSend(data: SendMailDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/mail/send',
    data,
    operationId: 'MailSendController_send_v1',
  });
}

/**
 * 邮件发送-批量
 * @description 使用模板批量发送邮件
 */
export function fetchMailSendBatchSend(data: BatchSendMailDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/mail/send/batch',
    data,
    operationId: 'MailSendController_batchSend_v1',
  });
}

/**
 * 邮件发送-重发
 * @description 重新发送失败的邮件
 */
export function fetchMailSendResend(logId: string | number) {
  return apiRequest<unknown>({
    method: 'POST',
    url: buildUrl('/api/v1/system/mail/send/resend/{logId}', { logId }),
    operationId: 'MailSendController_resend_v1',
  });
}

/**
 * 邮件发送-测试
 * @description 测试邮箱账号是否可用
 */
export function fetchMailSendTestSend(data: TestMailDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/mail/send/test',
    data,
    operationId: 'MailSendController_testSend_v1',
  });
}

/**
 * 邮件日志-列表
 * @description 分页查询邮件日志列表
 */
export function fetchMailLogFindAll(params?: Record<string, unknown>) {
  return apiRequest<MailLogResponseDto>({
    method: 'GET',
    url: '/api/v1/system/mail/log/list',
    params,
    operationId: 'MailLogController_findAll_v1',
  });
}

/**
 * 邮件日志-统计
 * @description 获取邮件发送状态统计
 */
export function fetchMailLogGetStats() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/system/mail/log/stats',
    operationId: 'MailLogController_getStats_v1',
  });
}

/**
 * 邮件日志-详情
 * @description 根据ID获取邮件日志详情
 */
export function fetchMailLogFindOne(id: string | number) {
  return apiRequest<MailLogResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/mail/log/{id}', { id }),
    operationId: 'MailLogController_findOne_v1',
  });
}

/**
 * 站内信模板-创建
 * @description 创建新的站内信模板
 */
export function fetchNotifyTemplateCreate(data: CreateNotifyTemplateRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/notify/template',
    data,
    operationId: 'NotifyTemplateController_create_v1',
  });
}

/**
 * 站内信模板-更新
 * @description 修改站内信模板信息
 */
export function fetchNotifyTemplateUpdate(data: UpdateNotifyTemplateRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/notify/template',
    data,
    operationId: 'NotifyTemplateController_update_v1',
  });
}

/**
 * 站内信模板-列表
 * @description 分页查询站内信模板列表
 */
export function fetchNotifyTemplateFindAll(params?: Record<string, unknown>) {
  return apiRequest<NotifyTemplateResponseDto>({
    method: 'GET',
    url: '/api/v1/system/notify/template/list',
    params,
    operationId: 'NotifyTemplateController_findAll_v1',
  });
}

/**
 * 站内信模板-下拉选择
 * @description 获取所有启用的站内信模板（用于下拉选择）
 */
export function fetchNotifyTemplateGetSelectList() {
  return apiRequest<NotifyTemplateResponseDto>({
    method: 'GET',
    url: '/api/v1/system/notify/template/select',
    operationId: 'NotifyTemplateController_getSelectList_v1',
  });
}

/**
 * 站内信模板-详情
 * @description 根据ID获取站内信模板详情
 */
export function fetchNotifyTemplateFindOne(id: string | number) {
  return apiRequest<NotifyTemplateResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/notify/template/{id}', { id }),
    operationId: 'NotifyTemplateController_findOne_v1',
  });
}

/**
 * 站内信模板-删除
 * @description 批量删除站内信模板，多个ID用逗号分隔
 */
export function fetchNotifyTemplateRemove(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/notify/template/{id}', { id }),
    operationId: 'NotifyTemplateController_remove_v1',
  });
}

/**
 * 站内信-发送
 * @description 发送站内信给指定用户（单发/群发）
 */
export function fetchNotifyMessageSend(data: SendNotifyMessageRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/notify/message/send',
    data,
    operationId: 'NotifyMessageController_send_v1',
  });
}

/**
 * 站内信-群发所有用户
 * @description 发送站内信给所有用户
 */
export function fetchNotifyMessageSendAll(data: SendNotifyAllRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/system/notify/message/send-all',
    data,
    operationId: 'NotifyMessageController_sendAll_v1',
  });
}

/**
 * 站内信-列表（管理员）
 * @description 分页查询所有站内信消息列表
 */
export function fetchNotifyMessageFindAll(params?: Record<string, unknown>) {
  return apiRequest<NotifyMessageResponseDto>({
    method: 'GET',
    url: '/api/v1/system/notify/message/list',
    params,
    operationId: 'NotifyMessageController_findAll_v1',
  });
}

/**
 * 站内信-我的消息列表
 * @description 分页查询当前用户的站内信列表
 */
export function fetchNotifyMessageFindMyMessages(params?: Record<string, unknown>) {
  return apiRequest<NotifyMessageResponseDto>({
    method: 'GET',
    url: '/api/v1/system/notify/message/my-list',
    params,
    operationId: 'NotifyMessageController_findMyMessages_v1',
  });
}

/**
 * 站内信-未读数量
 * @description 获取当前用户的未读站内信数量
 */
export function fetchNotifyMessageGetUnreadCount() {
  return apiRequest<UnreadCountResponseDto>({
    method: 'GET',
    url: '/api/v1/system/notify/message/unread-count',
    operationId: 'NotifyMessageController_getUnreadCount_v1',
  });
}

/**
 * 站内信-最近消息
 * @description 获取当前用户最近的站内信列表（用于通知铃铛下拉）
 */
export function fetchNotifyMessageGetRecentMessages(params?: Record<string, unknown>) {
  return apiRequest<NotifyMessageResponseDto>({
    method: 'GET',
    url: '/api/v1/system/notify/message/recent',
    params,
    operationId: 'NotifyMessageController_getRecentMessages_v1',
  });
}

/**
 * 站内信-详情
 * @description 根据ID获取站内信详情
 */
export function fetchNotifyMessageFindOne(id: string | number) {
  return apiRequest<NotifyMessageResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/system/notify/message/{id}', { id }),
    operationId: 'NotifyMessageController_findOne_v1',
  });
}

/**
 * 站内信-删除
 * @description 删除单条站内信（软删除）
 */
export function fetchNotifyMessageRemove(id: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/notify/message/{id}', { id }),
    operationId: 'NotifyMessageController_remove_v1',
  });
}

/**
 * 站内信-标记已读
 * @description 标记单条站内信为已读
 */
export function fetchNotifyMessageMarkAsRead(id: string | number) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: buildUrl('/api/v1/system/notify/message/read/{id}', { id }),
    operationId: 'NotifyMessageController_markAsRead_v1',
  });
}

/**
 * 站内信-批量标记已读
 * @description 批量标记站内信为已读，多个ID用逗号分隔
 */
export function fetchNotifyMessageMarkAsReadBatch(ids: string | number) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: buildUrl('/api/v1/system/notify/message/read-batch/{ids}', { ids }),
    operationId: 'NotifyMessageController_markAsReadBatch_v1',
  });
}

/**
 * 站内信-全部标记已读
 * @description 标记当前用户所有站内信为已读
 */
export function fetchNotifyMessageMarkAllAsRead() {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/system/notify/message/read-all',
    operationId: 'NotifyMessageController_markAllAsRead_v1',
  });
}

/**
 * 站内信-批量删除
 * @description 批量删除站内信（软删除），多个ID用逗号分隔
 */
export function fetchNotifyMessageRemoveBatch(ids: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/system/notify/message/batch/{ids}', { ids }),
    operationId: 'NotifyMessageController_removeBatch_v1',
  });
}

/**
 * 获取定时任务列表
 * @description 分页查询定时任务列表
 */
export function fetchJobList(params?: Record<string, unknown>) {
  return apiRequest<JobListResponseDto>({
    method: 'GET',
    url: '/api/v1/monitor/job/list',
    params,
    operationId: 'JobController_list_v1',
  });
}

/**
 * 获取定时任务详情
 * @description 根据任务ID获取定时任务详细信息
 */
export function fetchJobGetInfo(jobId: string | number) {
  return apiRequest<JobResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/monitor/job/{jobId}', { jobId }),
    operationId: 'JobController_getInfo_v1',
  });
}

/**
 * 创建定时任务
 * @description 新增定时任务
 */
export function fetchJobAdd(data: CreateJobDto) {
  return apiRequest<CreateJobResultResponseDto>({
    method: 'POST',
    url: '/api/v1/monitor/job',
    data,
    operationId: 'JobController_add_v1',
  });
}

/**
 * 修改定时任务
 * @description 更新定时任务信息
 */
export function fetchJobUpdate() {
  return apiRequest<UpdateJobResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/monitor/job',
    operationId: 'JobController_update_v1',
  });
}

/**
 * 修改任务状态
 * @description 启用或停用定时任务
 */
export function fetchJobChangeStatus() {
  return apiRequest<ChangeJobStatusResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/monitor/job/changeStatus',
    operationId: 'JobController_changeStatus_v1',
  });
}

/**
 * 删除定时任务
 * @description 批量删除定时任务，多个ID用逗号分隔
 */
export function fetchJobRemove(jobIds: string | number) {
  return apiRequest<DeleteJobResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/monitor/job/{jobIds}', { jobIds }),
    operationId: 'JobController_remove_v1',
  });
}

/**
 * 立即执行一次
 * @description 手动触发定时任务执行
 */
export function fetchJobRun() {
  return apiRequest<RunJobResultResponseDto>({
    method: 'PUT',
    url: '/api/v1/monitor/job/run',
    operationId: 'JobController_run_v1',
  });
}

/**
 * 导出定时任务Excel
 * @description 导出定时任务数据为xlsx文件
 */
export function fetchJobExport(data: ListJobDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/monitor/job/export',
    data,
    operationId: 'JobController_export_v1',
  });
}

/**
 * 获取定时任务日志列表
 * @description 分页查询定时任务执行日志
 */
export function fetchJobLogList(params?: Record<string, unknown>) {
  return apiRequest<JobLogListResponseDto>({
    method: 'GET',
    url: '/api/v1/monitor/jobLog/list',
    params,
    operationId: 'JobLogController_list_v1',
  });
}

/**
 * 清空定时任务日志
 * @description 清除所有定时任务执行日志
 */
export function fetchJobLogClean() {
  return apiRequest<ClearLogResultResponseDto>({
    method: 'DELETE',
    url: '/api/v1/monitor/jobLog/clean',
    operationId: 'JobLogController_clean_v1',
  });
}

/**
 * 导出调度日志Excel
 * @description 导出定时任务执行日志为xlsx文件
 */
export function fetchJobLogExport(data: ListJobLogDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/monitor/jobLog/export',
    data,
    operationId: 'JobLogController_export_v1',
  });
}

/**
 * 服务器信息
 * @description 获取服务器CPU、内存、系统等监控信息
 */
export function fetchServerGetInfo() {
  return apiRequest<ServerInfoResponseDto>({
    method: 'GET',
    url: '/api/v1/monitor/server',
    operationId: 'ServerController_getInfo_v1',
  });
}

/**
 * 缓存监控信息
 * @description 获取Redis缓存监控信息
 */
export function fetchCacheGetInfo() {
  return apiRequest<CacheInfoResponseDto>({
    method: 'GET',
    url: '/api/v1/monitor/cache',
    operationId: 'CacheController_getInfo_v1',
  });
}

/**
 * 缓存名称列表
 * @description 获取所有缓存分类名称
 */
export function fetchCacheGetNames() {
  return apiRequest<CacheNamesResponseDto>({
    method: 'GET',
    url: '/api/v1/monitor/cache/getNames',
    operationId: 'CacheController_getNames_v1',
  });
}

/**
 * 缓存键名列表
 * @description 根据缓存名称获取所有键名
 */
export function fetchCacheGetKeys(id: string | number) {
  return apiRequest<CacheKeysResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/monitor/cache/getKeys/{id}', { id }),
    operationId: 'CacheController_getKeys_v1',
  });
}

/**
 * 缓存内容
 * @description 获取指定缓存的内容
 */
export function fetchCacheGetValue(cacheName: string | number, cacheKey: string | number) {
  return apiRequest<CacheKeyResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/monitor/cache/getValue/{cacheName}/{cacheKey}', { cacheName, cacheKey }),
    operationId: 'CacheController_getValue_v1',
  });
}

/**
 * 清理缓存名称
 * @description 清除指定分类下的所有缓存
 */
export function fetchCacheClearCacheName(cacheName: string | number) {
  return apiRequest<ClearCacheResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/monitor/cache/clearCacheName/{cacheName}', { cacheName }),
    operationId: 'CacheController_clearCacheName_v1',
  });
}

/**
 * 清理缓存键名
 * @description 清除指定的缓存键
 */
export function fetchCacheClearCacheKey(cacheKey: string | number) {
  return apiRequest<ClearCacheResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/monitor/cache/clearCacheKey/{cacheKey}', { cacheKey }),
    operationId: 'CacheController_clearCacheKey_v1',
  });
}

/**
 * 清理全部缓存
 * @description 清除所有缓存数据
 */
export function fetchCacheClearCacheAll() {
  return apiRequest<ClearCacheResultResponseDto>({
    method: 'DELETE',
    url: '/api/v1/monitor/cache/clearCacheAll',
    operationId: 'CacheController_clearCacheAll_v1',
  });
}

/**
 * 登录日志-列表
 * @description 分页查询登录日志列表
 */
export function fetchLoginlogFindAll(params?: Record<string, unknown>) {
  return apiRequest<LoginLogListResponseDto>({
    method: 'GET',
    url: '/api/v1/monitor/logininfor/list',
    params,
    operationId: 'LoginlogController_findAll_v1',
  });
}

/**
 * 登录日志-清除全部日志
 * @description 清空所有登录日志记录
 */
export function fetchLoginlogRemoveAll() {
  return apiRequest<ClearLogResultResponseDto>({
    method: 'DELETE',
    url: '/api/v1/monitor/logininfor/clean',
    operationId: 'LoginlogController_removeAll_v1',
  });
}

/**
 * 登录日志-解锁用户
 * @description 解锁被锁定的用户账号
 */
export function fetchLoginlogUnlock(username: string | number) {
  return apiRequest<UnlockUserResultResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/monitor/logininfor/unlock/{username}', { username }),
    operationId: 'LoginlogController_unlock_v1',
  });
}

/**
 * 登录日志-删除日志
 * @description 批量删除登录日志，多个ID用逗号分隔
 */
export function fetchLoginlogRemove(id: string | number) {
  return apiRequest<DeleteLogResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/monitor/logininfor/{id}', { id }),
    operationId: 'LoginlogController_remove_v1',
  });
}

/**
 * 登录日志-导出Excel
 * @description 导出登录日志数据为xlsx文件
 */
export function fetchLoginlogExport(data: ListLoginlogDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/monitor/logininfor/export',
    data,
    operationId: 'LoginlogController_export_v1',
  });
}

/**
 * 在线用户-列表
 * @description 查询当前在线用户列表
 */
export function fetchOnlineFindAll(params?: Record<string, unknown>) {
  return apiRequest<OnlineUserListResponseDto>({
    method: 'GET',
    url: '/api/v1/monitor/online/list',
    params,
    operationId: 'OnlineController_findAll_v1',
  });
}

/**
 * 在线用户-强退
 * @description 强制用户下线
 */
export function fetchOnlineDelete(token: string | number) {
  return apiRequest<ForceLogoutResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/monitor/online/{token}', { token }),
    operationId: 'OnlineController_delete_v1',
  });
}

/**
 * 操作日志-清除全部日志
 * @description 清空所有操作日志记录
 */
export function fetchOperlogRemoveAll() {
  return apiRequest<ClearLogResultResponseDto>({
    method: 'DELETE',
    url: '/api/v1/monitor/operlog/clean',
    operationId: 'OperlogController_removeAll_v1',
  });
}

/**
 * 操作日志-列表
 * @description 分页查询操作日志列表
 */
export function fetchOperlogFindAll(params?: Record<string, unknown>) {
  return apiRequest<OperLogListResponseDto>({
    method: 'GET',
    url: '/api/v1/monitor/operlog/list',
    params,
    operationId: 'OperlogController_findAll_v1',
  });
}

/**
 * 操作日志-详情
 * @description 根据日志ID获取操作日志详情
 */
export function fetchOperlogFindOne(operId: string | number) {
  return apiRequest<OperLogResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/monitor/operlog/{operId}', { operId }),
    operationId: 'OperlogController_findOne_v1',
  });
}

/**
 * 操作日志-删除
 * @description 删除指定操作日志记录
 */
export function fetchOperlogRemove(operId: string | number) {
  return apiRequest<DeleteLogResultResponseDto>({
    method: 'DELETE',
    url: buildUrl('/api/v1/monitor/operlog/{operId}', { operId }),
    operationId: 'OperlogController_remove_v1',
  });
}

/**
 * 操作日志-导出Excel
 * @description 导出操作日志数据为xlsx文件
 */
export function fetchOperlogExportData(data: QueryOperLogDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/monitor/operlog/export',
    data,
    operationId: 'OperlogController_exportData_v1',
  });
}

/**
 * 综合健康检查
 */
export function fetchHealthCheck() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/health',
    operationId: 'HealthController_check_v1',
  });
}

/**
 * 存活探针 (Kubernetes Liveness Probe)
 */
export function fetchHealthCheckLive() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/health/live',
    operationId: 'HealthController_checkLive_v1',
  });
}

/**
 * 存活探针 (Kubernetes Liveness Probe) - 别名
 */
export function fetchHealthCheckLiveness() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/health/liveness',
    operationId: 'HealthController_checkLiveness_v1',
  });
}

/**
 * 就绪探针 (Kubernetes Readiness Probe)
 */
export function fetchHealthCheckReady() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/health/ready',
    operationId: 'HealthController_checkReady_v1',
  });
}

/**
 * 就绪探针 (Kubernetes Readiness Probe) - 别名
 */
export function fetchHealthCheckReadiness() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/health/readiness',
    operationId: 'HealthController_checkReadiness_v1',
  });
}

/**
 * 应用信息
 */
export function fetchHealthGetInfo() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/health/info',
    operationId: 'HealthController_getInfo_v1',
  });
}

/**
 * 获取应用信息
 */
export function fetchInfoGetInfo() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/info',
    operationId: 'InfoController_getInfo_v1',
  });
}

/**
 */
export function fetchPrometheusIndex() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/metrics',
    operationId: 'PrometheusController_index_v1',
  });
}

/**
 * SSE连接
 */
export function fetchSseSse(params?: Record<string, unknown>) {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/resource/sse',
    params,
    operationId: 'SseController_sse_v1',
  });
}

/**
 * 关闭SSE连接
 */
export function fetchSseCloseSse() {
  return apiRequest<unknown>({
    method: 'GET',
    url: '/api/v1/resource/sse/close',
    operationId: 'SseController_closeSse_v1',
  });
}

/**
 * 发送消息给指定用户
 */
export function fetchSseSendMessage() {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/resource/sse/send',
    operationId: 'SseController_sendMessage_v1',
  });
}

/**
 * 广播消息给所有用户
 */
export function fetchSseBroadcast() {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/resource/sse/broadcast',
    operationId: 'SseController_broadcast_v1',
  });
}

/**
 * 获取在线连接数
 */
export function fetchSseGetCount() {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/resource/sse/count',
    operationId: 'SseController_getCount_v1',
  });
}

/**
 * OSS配置管理-创建
 * @description 创建OSS配置
 */
export function fetchOssConfigCreate(data: CreateOssConfigRequestDto) {
  return apiRequest<unknown>({
    method: 'POST',
    url: '/api/v1/resource/oss/config',
    data,
    operationId: 'OssConfigController_create_v1',
  });
}

/**
 * OSS配置管理-更新
 * @description 修改OSS配置
 */
export function fetchOssConfigUpdate(data: UpdateOssConfigRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/resource/oss/config',
    data,
    operationId: 'OssConfigController_update_v1',
  });
}

/**
 * OSS配置管理-列表
 * @description 分页查询OSS配置列表
 */
export function fetchOssConfigFindAll(params?: Record<string, unknown>) {
  return apiRequest<OssConfigListResponseDto>({
    method: 'GET',
    url: '/api/v1/resource/oss/config/list',
    params,
    operationId: 'OssConfigController_findAll_v1',
  });
}

/**
 * OSS配置管理-详情
 * @description 根据ID获取OSS配置详情
 */
export function fetchOssConfigFindOne(id: string | number) {
  return apiRequest<OssConfigResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/resource/oss/config/{id}', { id }),
    operationId: 'OssConfigController_findOne_v1',
  });
}

/**
 * OSS配置管理-修改状态
 * @description 修改OSS配置状态
 */
export function fetchOssConfigChangeStatus(data: ChangeOssConfigStatusRequestDto) {
  return apiRequest<unknown>({
    method: 'PUT',
    url: '/api/v1/resource/oss/config/changeStatus',
    data,
    operationId: 'OssConfigController_changeStatus_v1',
  });
}

/**
 * OSS配置管理-删除
 * @description 批量删除OSS配置，多个ID用逗号分隔
 */
export function fetchOssConfigRemove(ids: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/resource/oss/config/{ids}', { ids }),
    operationId: 'OssConfigController_remove_v1',
  });
}

/**
 * OSS文件管理-列表
 * @description 分页查询OSS文件列表
 */
export function fetchOssFindAll(params?: Record<string, unknown>) {
  return apiRequest<OssListResponseDto>({
    method: 'GET',
    url: '/api/v1/resource/oss/list',
    params,
    operationId: 'OssController_findAll_v1',
  });
}

/**
 * OSS文件管理-根据ID列表查询
 * @description 根据ID列表获取OSS文件
 */
export function fetchOssFindByIds(ids: string | number) {
  return apiRequest<OssListResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/resource/oss/listByIds/{ids}', { ids }),
    operationId: 'OssController_findByIds_v1',
  });
}

/**
 * OSS文件管理-详情
 * @description 根据ID获取OSS文件详情
 */
export function fetchOssFindOne(id: string | number) {
  return apiRequest<OssResponseDto>({
    method: 'GET',
    url: buildUrl('/api/v1/resource/oss/{id}', { id }),
    operationId: 'OssController_findOne_v1',
  });
}

/**
 * OSS文件管理-上传
 * @description 上传文件到OSS
 */
export function fetchOssUpload() {
  return apiRequest<OssResponseDto>({
    method: 'POST',
    url: '/api/v1/resource/oss/upload',
    operationId: 'OssController_upload_v1',
  });
}

/**
 * OSS文件管理-删除
 * @description 批量删除OSS文件，多个ID用逗号分隔
 */
export function fetchOssRemove(ids: string | number) {
  return apiRequest<unknown>({
    method: 'DELETE',
    url: buildUrl('/api/v1/resource/oss/{ids}', { ids }),
    operationId: 'OssController_remove_v1',
  });
}
