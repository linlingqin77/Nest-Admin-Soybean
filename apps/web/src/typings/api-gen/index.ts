/**
 * @generated
 * 此文件由 openapi-ts 自动生成，请勿手动修改
 * 生成时间: 2026-08-31T03:27:16.387Z
 * 如需修改 API 配置，请编辑 api-config.ts
 */

// OpenAPI Schema 类型定义

export interface Result {
  /** 响应码 */
  code: number;
  /** 响应消息 */
  msg: string;
  /** 响应数据 */
  data: Record<string, unknown>;
  /** 请求ID，用于追踪 */
  requestId?: string;
  /** 时间戳 */
  timestamp?: string;
}

export interface LoginResponseDto {
  /** JWT访问令牌 */
  token: string;
}

export interface LoginRequestDto {
  /** 验证码（4位数字） */
  code?: string;
  /** 用户名 */
  userName: string;
  /** 密码 */
  password: string;
  /** 验证码唯一标识（获取验证码时返回） */
  uuid?: string;
}

export interface LogoutResponseDto {
  /** 退出是否成功 */
  success: boolean;
}

export interface RegisterResultResponseDto {
  /** 注册是否成功 */
  success: boolean;
  /** 提示消息 */
  message?: string;
}

export interface RegisterRequestDto {
  /** 验证码（4位数字） */
  code?: string;
  /** 用户名 */
  userName: string;
  /** 密码 */
  password: string;
  /** 验证码唯一标识（获取验证码时返回） */
  uuid?: string;
}

export interface RegisterEnabledResponseDto {
  /** 是否开启用户注册 */
  enabled: boolean;
}

export interface CaptchaResponseDto {
  /** 是否开启验证码 */
  captchaEnabled: boolean;
  /** 验证码唯一标识 */
  uuid: string;
  /** 验证码图片Base64 */
  img: string;
}

/** 性别枚举
- MAN (0): 男
- WOMAN (1): 女
- UNKNOWN (2): 未知 */
export type SexEnum = '0' | '1' | '2';

/** 数据状态枚举
- NORMAL (0): 正常/启用
- STOP (1): 停用/禁用 */
export type StatusEnum = '0' | '1';

export interface DeptInfoResponseDto {
  /** 部门ID */
  deptId: number;
  /** 部门名称 */
  deptName: string;
}

export interface RoleInfoResponseDto {
  /** 角色ID */
  roleId: number;
  /** 角色名称 */
  roleName: string;
  /** 角色权限字符串 */
  roleKey: string;
}

export interface UserProfileResponseDto {
  /** 用户ID */
  userId: number;
  /** 部门ID */
  deptId: number;
  /** 用户账号 */
  userName: string;
  /** 用户昵称 */
  nickName: string;
  /** 用户类型 */
  userType: string;
  /** 用户邮箱 */
  email: string;
  /** 手机号码 */
  phonenumber: string;
  /** 用户性别（0男 1女 2未知） */
  sex: SexEnum;
  /** 头像地址 */
  avatar: string;
  /** 帐号状态（0正常 1停用） */
  status: StatusEnum;
  /** 最后登录IP */
  loginIp: string;
  /** 最后登录时间 */
  loginDate: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
  /** 部门信息 */
  dept?: DeptInfoResponseDto;
  /** 角色列表 */
  roles?: RoleInfoResponseDto[];
}

export interface GetInfoResponseDto {
  /** 用户信息 */
  user: UserProfileResponseDto;
  /** 角色权限字符串集合 */
  roles: string[];
  /** 菜单权限集合 */
  permissions: string[];
}

export interface RouterMetaResponseDto {
  /** 设置该路由在侧边栏和面包屑中展示的名字 */
  title: string;
  /** 设置该路由的图标 */
  icon: string;
  /** 设置为true，则不会被 <keep-alive>缓存 */
  noCache: boolean;
  /** 内链地址（http(s)://开头） */
  link?: string;
}

export interface RouterResponseDto {
  /** 路由名字 */
  name: string;
  /** 路由地址 */
  path: string;
  /** 是否隐藏路由，当设置 true 的时候该路由不会再侧边栏出现 */
  hidden: boolean;
  /** 重定向地址，当设置 noRedirect 的时候该路由在面包屑导航中不可被点击 */
  redirect?: string;
  /** 组件地址 */
  component: string;
  /** 路由参数 */
  query?: string;
  /** 当你一个路由下面的 children 声明的路由大于1个时，自动会变成嵌套的模式 */
  alwaysShow?: boolean;
  /** 其他元素 */
  meta: RouterMetaResponseDto;
  /** 子路由 */
  children?: RouterResponseDto[];
}

export interface TenantInfoResponseDto {
  /** 租户ID */
  tenantId: string;
  /** 企业名称 */
  companyName: string;
  /** 域名 */
  domain?: string;
}

export interface LoginTenantResponseDto {
  /** 是否开启租户 */
  tenantEnabled: boolean;
  /** 租户列表 */
  voList: TenantInfoResponseDto[];
}

export interface CaptchaCodeResponseDto {
  /** 是否开启验证码 */
  captchaEnabled: boolean;
  /** 验证码唯一标识 */
  uuid?: string;
  /** 验证码图片(Base64) */
  img?: string;
}

export interface LoginTokenResponseDto {
  /** 授权令牌 */
  access_token: string;
  /** 刷新令牌 */
  refresh_token?: string;
  /** 令牌有效期(秒) */
  expire_in: number;
  /** 刷新令牌有效期(秒) */
  refresh_expire_in?: number;
  /** 客户端ID */
  client_id?: string;
  /** 令牌权限 */
  scope?: string;
  /** 用户openid */
  openid?: string;
}

export interface AuthLoginRequestDto {
  /** 租户ID */
  tenantId?: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 验证码 */
  code?: string;
  /** 验证码唯一标识 */
  uuid?: string;
  /** 客户端ID */
  clientId?: string;
  /** 授权类型 */
  grantType?: string;
  /** 记住我 */
  rememberMe?: boolean;
}

export interface AuthRegisterResultResponseDto {
  /** 注册是否成功 */
  success: boolean;
  /** 提示消息 */
  message?: string;
}

export interface AuthRegisterRequestDto {
  /** 租户ID */
  tenantId?: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 确认密码 */
  confirmPassword: string;
  /** 验证码 */
  code: string;
  /** 验证码唯一标识 */
  uuid: string;
  /** 用户类型 */
  userType?: string;
}

export interface AuthLogoutResponseDto {
  /** 退出是否成功 */
  success: boolean;
}

export interface SocialCallbackResponseDto {
  /** 登录是否成功 */
  success: boolean;
  /** 错误消息 */
  message?: string;
}

export interface SocialLoginRequestDto {
  /** 租户ID */
  tenantId?: string;
  /** 社交平台来源 */
  source: string;
  /** 社交平台授权码 */
  socialCode: string;
  /** 社交平台状态码 */
  socialState?: string;
  /** 客户端ID */
  clientId?: string;
  /** 授权类型 */
  grantType?: string;
}

export interface PublicKeyResponseDto {
  /** RSA公钥 */
  publicKey: string;
}

export interface ChunkMergeFileDto {
  /** 上传标识ID */
  uploadId: string;
  /** 文件名称 */
  fileName: string;
  /** 文件夹ID */
  folderId?: number;
}

/** 设备类型枚举
- PC (pc): PC端
- APP (app): 移动端
- MINI (mini): 小程序
- SOCIAL (social): 社交登录 */
export type DeviceTypeEnum = 'pc' | 'app' | 'mini' | 'social';

export interface CreateClientRequestDto {
  /** 客户端key */
  clientKey: string;
  /** 客户端秘钥 */
  clientSecret: string;
  /** 授权类型列表 */
  grantTypeList?: string[];
  /** 设备类型 */
  deviceType?: DeviceTypeEnum;
  /** token活跃超时时间（秒） */
  activeTimeout?: number;
  /** token固定超时时间（秒） */
  timeout?: number;
  /** 状态 */
  status?: StatusEnum;
}

export interface ClientResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 客户端ID */
  id: number;
  /** 客户端唯一标识 */
  clientId: string;
  /** 客户端key */
  clientKey: string;
  /** 客户端秘钥 */
  clientSecret: string;
  /** 授权类型列表（逗号分隔） */
  grantTypeList: string;
  /** 授权类型数组 */
  grantTypeArray: string[];
  /** 设备类型 */
  deviceType: DeviceTypeEnum;
  /** token活跃超时时间（秒） */
  activeTimeout: number;
  /** token固定超时时间（秒） */
  timeout: number;
  /** 状态 */
  status: StatusEnum;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface ClientListResponseDto {
  /** 客户端列表 */
  rows: ClientResponseDto[];
  /** 总数量 */
  total: number;
}

export interface DateRangeDto {
  /** 开始时间 */
  beginTime?: string;
  /** 结束时间 */
  endTime?: string;
}

export interface UpdateClientRequestDto {
  /** 客户端ID */
  id: number;
  /** 客户端key */
  clientKey?: string;
  /** 客户端秘钥 */
  clientSecret?: string;
  /** 授权类型列表 */
  grantTypeList?: string[];
  /** 设备类型 */
  deviceType?: DeviceTypeEnum;
  /** token活跃超时时间（秒） */
  activeTimeout?: number;
  /** token固定超时时间（秒） */
  timeout?: number;
  /** 状态 */
  status?: StatusEnum;
}

export interface ChangeClientStatusRequestDto {
  /** 客户端ID */
  id: number;
  /** 状态 */
  status: StatusEnum;
}

/** 系统参数类型枚举
- YES (Y): 是（系统内置）
- NO (N): 否 */
export type ConfigTypeEnum = 'Y' | 'N';

export interface CreateConfigRequestDto {
  /** 参数名称 */
  configName: string;
  /** 参数键值 */
  configValue: string;
  /** 参数键名 */
  configKey: string;
  configType: ConfigTypeEnum;
  /** 备注 */
  remark: string;
  status?: StatusEnum;
}

export interface ConfigResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 参数配置ID */
  configId: number;
  /** 参数名称 */
  configName: string;
  /** 参数键名 */
  configKey: string;
  /** 参数键值 */
  configValue: string;
  /** 系统内置 */
  configType: ConfigTypeEnum;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface ConfigListResponseDto {
  /** 配置列表 */
  rows: ConfigResponseDto[];
  /** 总数量 */
  total: number;
}

export interface ConfigValueResponseDto {
  /** 配置值 */
  configValue: string;
}

export interface UpdateConfigRequestDto {
  /** 参数名称 */
  configName: string;
  /** 参数键值 */
  configValue: string;
  /** 参数键名 */
  configKey: string;
  configType: ConfigTypeEnum;
  /** 备注 */
  remark: string;
  status?: StatusEnum;
  /** 参数ID */
  configId: number;
}

export interface ListConfigRequestDto {
  /** 页码（从1开始） */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 排序字段 */
  orderByColumn?: string;
  /** 排序方向 */
  isAsc?: 'asc' | 'desc';
  /** 时间范围 */
  params?: DateRangeDto;
  /** 参数名称 */
  configName?: string;
  /** 参数键名 */
  configKey?: string;
  configType?: ConfigTypeEnum;
}

export interface CreateDeptResultResponseDto {
  /** 创建的部门ID */
  deptId: number;
}

export interface CreateDeptRequestDto {
  /** 父部门ID */
  parentId: number;
  /** 部门名称 */
  deptName: string;
  /** 显示顺序 */
  orderNum: number;
  /** 负责人 */
  leader?: string;
  /** 联系电话 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  status?: StatusEnum;
}

export interface DeptResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 部门ID */
  deptId: number;
  /** 父部门ID */
  parentId?: number;
  /** 祖级列表 */
  ancestors?: string;
  /** 部门名称 */
  deptName: string;
  /** 显示顺序 */
  orderNum?: number;
  /** 负责人 */
  leader?: string;
  /** 联系电话 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  /** 部门状态（0正常 1停用） */
  status?: string;
  /** 子部门列表 */
  children?: DeptResponseDto[];
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface UpdateDeptResultResponseDto {
  /** 更新是否成功 */
  success: boolean;
}

export interface UpdateDeptRequestDto {
  /** 父部门ID */
  parentId: number;
  /** 部门名称 */
  deptName: string;
  /** 显示顺序 */
  orderNum: number;
  /** 负责人 */
  leader?: string;
  /** 联系电话 */
  phone?: string;
  /** 邮箱 */
  email?: string;
  status?: StatusEnum;
  /** 部门ID */
  deptId?: number;
}

export interface DeleteDeptResultResponseDto {
  /** 删除的记录数 */
  affected: number;
}

export interface CreateDictTypeResultResponseDto {
  /** 创建的字典类型ID */
  dictId: number;
}

export interface CreateDictTypeRequestDto {
  /** 字典名称 */
  dictName: string;
  /** 字典类型 */
  dictType: string;
  /** 备注 */
  remark: string;
  status?: StatusEnum;
}

export interface RefreshCacheResultResponseDto {
  /** 刷新是否成功 */
  success: boolean;
}

export interface DeleteDictTypeResultResponseDto {
  /** 删除的记录数 */
  affected: number;
}

export interface UpdateDictTypeResultResponseDto {
  /** 更新是否成功 */
  success: boolean;
}

export interface UpdateDictTypeRequestDto {
  /** 字典名称 */
  dictName: string;
  /** 字典类型 */
  dictType: string;
  /** 备注 */
  remark: string;
  status?: StatusEnum;
  /** 字典ID */
  dictId: number;
}

export interface DictTypeResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 字典类型ID */
  dictId: number;
  /** 字典名称 */
  dictName: string;
  /** 字典类型 */
  dictType: string;
  /** 状态（0正常 1停用） */
  status?: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface DictTypeListResponseDto {
  /** 字典类型列表 */
  rows: DictTypeResponseDto[];
  /** 总数量 */
  total: number;
}

export interface CreateDictDataResultResponseDto {
  /** 创建的字典数据ID */
  dictCode: number;
}

export interface CreateDictDataRequestDto {
  /** 字典类型 */
  dictType: string;
  /** 字典标签 */
  dictLabel: string;
  /** 字典键值 */
  dictValue: string;
  /** 样式属性 */
  listClass: string;
  /** CSS样式 */
  cssClass?: string;
  /** 字典排序 */
  dictSort?: number;
  /** 备注 */
  remark?: string;
  status?: StatusEnum;
}

export interface DeleteDictDataResultResponseDto {
  /** 删除的记录数 */
  affected: number;
}

export interface UpdateDictDataResultResponseDto {
  /** 更新是否成功 */
  success: boolean;
}

export interface UpdateDictDataRequestDto {
  /** 字典类型 */
  dictType: string;
  /** 字典标签 */
  dictLabel: string;
  /** 字典键值 */
  dictValue: string;
  /** 样式属性 */
  listClass: string;
  /** CSS样式 */
  cssClass?: string;
  /** 字典排序 */
  dictSort?: number;
  /** 备注 */
  remark?: string;
  status?: StatusEnum;
  /** 字典编码 */
  dictCode: number;
}

export interface DictDataResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 字典数据ID */
  dictCode: number;
  /** 字典排序 */
  dictSort?: number;
  /** 字典标签 */
  dictLabel: string;
  /** 字典键值 */
  dictValue: string;
  /** 字典类型 */
  dictType: string;
  /** 样式属性 */
  cssClass?: string;
  /** 表格回显样式 */
  listClass?: string;
  /** 是否默认（Y是 N否） */
  isDefault?: string;
  /** 状态（0正常 1停用） */
  status?: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface DictDataListResponseDto {
  /** 字典数据列表 */
  rows: DictDataResponseDto[];
  /** 总数量 */
  total: number;
}

export interface ListDictTypeRequestDto {
  /** 页码（从1开始） */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 排序字段 */
  orderByColumn?: string;
  /** 排序方向 */
  isAsc?: 'asc' | 'desc';
  /** 时间范围 */
  params?: DateRangeDto;
  /** 字典名称 */
  dictName?: string;
  /** 字典类型 */
  dictType?: string;
  status?: StatusEnum;
}

/** 菜单类型枚举
- M: 目录
- C: 菜单
- F: 按钮 */
export type MenuTypeEnum = 'M' | 'C' | 'F';

export interface MenuResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 菜单ID */
  menuId: number;
  /** 菜单名称 */
  menuName: string;
  /** 父菜单ID */
  parentId: number;
  /** 显示顺序 */
  orderNum: number;
  /** 路由地址 */
  path: string;
  /** 组件路径 */
  component: string;
  /** 路由参数 */
  query: string;
  /** 是否为外链（0是 1否） */
  isFrame: StatusEnum;
  /** 是否缓存（0缓存 1不缓存） */
  isCache: StatusEnum;
  /** 菜单类型 */
  menuType: MenuTypeEnum;
  /** 显示状态（0显示 1隐藏） */
  visible: StatusEnum;
  /** 菜单状态 */
  status: StatusEnum;
  /** 权限标识 */
  perms: string;
  /** 菜单图标 */
  icon: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface CreateMenuResultResponseDto {
  /** 创建的菜单ID */
  menuId: number;
}

export interface CreateMenuRequestDto {
  /** 菜单名称 */
  menuName: string;
  /** 显示顺序 */
  orderNum?: number;
  /** 父菜单ID */
  parentId: number;
  /** 路由地址 */
  path?: string;
  /** 路由参数 */
  query?: string;
  /** 组件路径 */
  component?: string;
  /** 菜单图标 */
  icon?: string;
  menuType?: MenuTypeEnum;
  /** 是否缓存（0缓存 1不缓存） */
  isCache?: string;
  /** 是否为外链（0是 1否） */
  isFrame: string;
  /** 菜单状态（0正常 1停用） */
  status?: string;
  /** 显示状态（0显示 1隐藏） */
  visible?: string;
  /** 权限标识 */
  perms?: string;
  /** 路由参数 */
  queryParam?: string;
  /** 备注 */
  remark?: string;
}

export interface MenuTreeResponseDto {
  /** 菜单ID */
  id: number;
  /** 菜单名称 */
  label: string;
  /** 子菜单列表 */
  children?: MenuTreeResponseDto[];
}

export interface RoleMenuTreeSelectResponseDto {
  /** 已选中的菜单ID列表 */
  checkedKeys: number[];
  /** 菜单树数据 */
  menus: MenuTreeResponseDto[];
}

export interface UpdateMenuResultResponseDto {
  /** 更新是否成功 */
  success: boolean;
}

export interface UpdateMenuRequestDto {
  /** 菜单名称 */
  menuName: string;
  /** 显示顺序 */
  orderNum?: number;
  /** 父菜单ID */
  parentId: number;
  /** 路由地址 */
  path?: string;
  /** 路由参数 */
  query?: string;
  /** 组件路径 */
  component?: string;
  /** 菜单图标 */
  icon?: string;
  menuType?: MenuTypeEnum;
  /** 是否缓存（0缓存 1不缓存） */
  isCache?: string;
  /** 是否为外链（0是 1否） */
  isFrame: string;
  /** 菜单状态（0正常 1停用） */
  status?: string;
  /** 显示状态（0显示 1隐藏） */
  visible?: string;
  /** 权限标识 */
  perms?: string;
  /** 路由参数 */
  queryParam?: string;
  /** 备注 */
  remark?: string;
  /** 菜单ID */
  menuId: number;
}

export interface DeleteMenuResultResponseDto {
  /** 删除的记录数 */
  affected: number;
}

export interface CreateNoticeResultResponseDto {
  /** 创建的公告ID */
  noticeId: number;
}

/** 通知公告类型枚举
- NOTICE (1): 通知
- ANNOUNCEMENT (2): 公告 */
export type NoticeTypeEnum = '1' | '2';

export interface CreateNoticeRequestDto {
  /** 公告标题 */
  noticeTitle: string;
  noticeType: NoticeTypeEnum;
  /** 备注 */
  remark: string;
  status?: StatusEnum;
  /** 公告内容 */
  noticeContent?: string;
}

export interface NoticeResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 公告ID */
  noticeId: number;
  /** 公告标题 */
  noticeTitle: string;
  /** 公告类型 */
  noticeType?: NoticeTypeEnum;
  /** 公告内容 */
  noticeContent?: string;
  /** 公告状态 */
  status?: StatusEnum;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface NoticeListResponseDto {
  /** 公告列表 */
  rows: NoticeResponseDto[];
  /** 总数量 */
  total: number;
}

export interface UpdateNoticeResultResponseDto {
  /** 更新是否成功 */
  success: boolean;
}

export interface UpdateNoticeRequestDto {
  /** 公告标题 */
  noticeTitle: string;
  noticeType: NoticeTypeEnum;
  /** 备注 */
  remark: string;
  status?: StatusEnum;
  /** 公告内容 */
  noticeContent?: string;
  /** 公告ID */
  noticeId: number;
}

export interface DeleteNoticeResultResponseDto {
  /** 删除的记录数 */
  affected: number;
}

export interface CreatePostResultResponseDto {
  /** 创建的岗位ID */
  postId: number;
}

export interface CreatePostRequestDto {
  /** 部门ID */
  deptId?: number;
  /** 岗位名称 */
  postName: string;
  /** 岗位编码 */
  postCode: string;
  /** 类别编码 */
  postCategory?: string;
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
  /** 岗位排序 */
  postSort?: number;
}

export interface PostResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 岗位ID */
  postId: number;
  /** 岗位编码 */
  postCode: string;
  /** 岗位名称 */
  postName: string;
  /** 类别编码 */
  postCategory: string;
  /** 显示顺序 */
  postSort: number;
  /** 状态（0正常 1停用） */
  status: string;
  /** 部门ID */
  deptId: number;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface PostListResponseDto {
  /** 岗位列表 */
  rows: PostResponseDto[];
  /** 总数量 */
  total: number;
}

export interface DeptTreeResponseDto {
  /** 部门ID */
  id: number;
  /** 部门名称 */
  label: string;
  /** 子部门 */
  children?: DeptTreeResponseDto[];
}

export interface UpdatePostResultResponseDto {
  /** 更新是否成功 */
  success: boolean;
}

export interface UpdatePostRequestDto {
  /** 部门ID */
  deptId?: number;
  /** 岗位名称 */
  postName: string;
  /** 岗位编码 */
  postCode: string;
  /** 类别编码 */
  postCategory?: string;
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
  /** 岗位排序 */
  postSort?: number;
  /** 岗位ID */
  postId: number;
}

export interface DeletePostResultResponseDto {
  /** 删除的记录数 */
  affected: number;
}

export interface ListPostRequestDto {
  /** 页码（从1开始） */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 排序字段 */
  orderByColumn?: string;
  /** 排序方向 */
  isAsc?: 'asc' | 'desc';
  /** 时间范围 */
  params?: DateRangeDto;
  /** 岗位名称 */
  postName?: string;
  /** 岗位编码 */
  postCode?: string;
  status?: StatusEnum;
  /** 所属部门ID */
  belongDeptId?: string;
}

export interface CreateRoleResultResponseDto {
  /** 创建的角色ID */
  roleId: number;
}

export interface CreateRoleRequestDto {
  /** 角色名称 */
  roleName: string;
  /** 角色权限字符串 */
  roleKey: string;
  /** 菜单ID列表 */
  menuIds?: number[];
  /** 部门ID列表 */
  deptIds?: number[];
  /** 角色排序 */
  roleSort: number;
  /** 角色状态（0正常 1停用） */
  status?: StatusEnum;
  /** 数据范围（1全部 2自定义 3本部门 4本部门及以下 5仅本人） */
  dataScope?: string;
  /** 备注 */
  remark?: string;
  /** 菜单树选择项是否关联显示 */
  menuCheckStrictly?: boolean;
  /** 部门树选择项是否关联显示 */
  deptCheckStrictly?: boolean;
}

/** 数据权限范围枚举
- DATA_SCOPE_ALL (1): 全部数据权限
- DATA_SCOPE_CUSTOM (2): 自定数据权限
- DATA_SCOPE_DEPT (3): 本部门数据权限
- DATA_SCOPE_DEPT_AND_CHILD (4): 本部门及以下数据权限
- DATA_SCOPE_SELF (5): 仅本人数据权限 */
export type DataScopeEnum = '1' | '2' | '3' | '4' | '5';

export interface RoleResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 角色ID */
  roleId: number;
  /** 角色名称 */
  roleName: string;
  /** 角色权限字符串 */
  roleKey: string;
  /** 显示顺序 */
  roleSort: number;
  /** 数据范围 */
  dataScope: DataScopeEnum;
  /** 菜单树选择项是否关联显示 */
  menuCheckStrictly: boolean;
  /** 部门树选择项是否关联显示 */
  deptCheckStrictly: boolean;
  /** 角色状态 */
  status: StatusEnum;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface RoleListResponseDto {
  /** 角色列表 */
  rows: RoleResponseDto[];
  /** 总数量 */
  total: number;
}

export interface DeptTreeNodeResponseDto {
  /** 部门ID */
  id: number;
  /** 部门名称 */
  label: string;
  /** 子节点列表 */
  children?: DeptTreeNodeResponseDto[];
}

export interface RoleDeptTreeResponseDto {
  /** 已选中的部门ID列表 */
  checkedKeys: number[];
  /** 部门树数据 */
  depts: DeptTreeNodeResponseDto[];
}

export interface UpdateRoleResultResponseDto {
  /** 更新是否成功 */
  success: boolean;
}

export interface UpdateRoleRequestDto {
  /** 角色名称 */
  roleName: string;
  /** 角色权限字符串 */
  roleKey: string;
  /** 菜单ID列表 */
  menuIds?: number[];
  /** 部门ID列表 */
  deptIds?: number[];
  /** 角色排序 */
  roleSort: number;
  /** 角色状态（0正常 1停用） */
  status?: StatusEnum;
  /** 数据范围（1全部 2自定义 3本部门 4本部门及以下 5仅本人） */
  dataScope?: string;
  /** 备注 */
  remark?: string;
  /** 菜单树选择项是否关联显示 */
  menuCheckStrictly?: boolean;
  /** 部门树选择项是否关联显示 */
  deptCheckStrictly?: boolean;
  /** 角色ID */
  roleId: number;
}

export interface DataScopeResultResponseDto {
  /** 修改是否成功 */
  success: boolean;
}

export interface ChangeRoleStatusResultResponseDto {
  /** 修改是否成功 */
  success: boolean;
}

export interface ChangeRoleStatusRequestDto {
  /** 角色ID */
  roleId: number;
  /** 角色状态（0正常 1停用） */
  status: StatusEnum;
}

export interface DeleteRoleResultResponseDto {
  /** 删除的记录数 */
  affected: number;
}

export interface AllocatedUserListResponseDto {
  /** 用户列表 */
  rows: string[];
  /** 总数量 */
  total: number;
}

export interface AuthUserResultResponseDto {
  /** 操作是否成功 */
  success: boolean;
}

export interface AuthUserCancelRequestDto {
  /** 角色ID */
  roleId: number;
  /** 用户ID */
  userId: number;
}

export interface AuthUserCancelAllRequestDto {
  /** 角色ID */
  roleId: number;
  /** 用户ID列表 */
  userIds: string;
}

export interface AuthUserSelectAllRequestDto {
  /** 角色ID */
  roleId: number;
  /** 用户ID列表 */
  userIds: string;
}

export interface ListRoleRequestDto {
  /** 页码（从1开始） */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 排序字段 */
  orderByColumn?: string;
  /** 排序方向 */
  isAsc?: 'asc' | 'desc';
  /** 时间范围 */
  params?: DateRangeDto;
  /** 角色名称 */
  roleName?: string;
  /** 角色权限字符串 */
  roleKey?: string;
  /** 角色状态（0正常 1停用） */
  status?: StatusEnum;
  /** 角色ID */
  roleId?: string;
}

export interface CreateTenantResultResponseDto {
  /** 创建的租户ID */
  id: number;
  /** 租户编号 */
  tenantId: string;
}

export interface CreateTenantRequestDto {
  /** 租户ID（不传则自动生成） */
  tenantId?: string;
  /** 联系人 */
  contactUserName?: string;
  /** 联系电话 */
  contactPhone?: string;
  /** 企业名称 */
  companyName: string;
  /** 统一社会信用代码 */
  licenseNumber?: string;
  /** 地址 */
  address?: string;
  /** 企业简介 */
  intro?: string;
  /** 域名 */
  domain?: string;
  /** 租户套餐ID */
  packageId?: number;
  /** 过期时间 */
  expireTime?: string;
  /** 账号数量(-1不限制) */
  accountCount?: number;
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
  /** 管理员账号 */
  username: string;
  /** 管理员密码 */
  password: string;
}

export interface TenantResponseDto {
  /** 租户ID */
  id: number;
  /** 租户编号 */
  tenantId: string;
  /** 联系人 */
  contactUserName?: string;
  /** 联系电话 */
  contactPhone?: string;
  /** 企业名称 */
  companyName: string;
  /** 统一社会信用代码 */
  licenseNumber?: string;
  /** 地址 */
  address?: string;
  /** 企业简介 */
  intro?: string;
  /** 域名 */
  domain?: string;
  /** 租户套餐ID */
  packageId?: number;
  /** 租户套餐名称 */
  packageName?: string;
  /** 过期时间 */
  expireTime?: string;
  /** 账号数量 */
  accountCount: number;
  /** 状态(0正常 1停用) */
  status: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
  /** 备注 */
  remark?: string;
  delFlag?: string;
  createBy?: string;
  updateBy?: string;
}

export interface TenantListResponseDto {
  /** 租户列表 */
  rows: TenantResponseDto[];
  /** 总数 */
  total: number;
}

export interface SyncTenantDictResultResponseDto {
  /** 同步是否成功 */
  success: boolean;
}

export interface SyncTenantPackageResultResponseDto {
  /** 同步是否成功 */
  success: boolean;
}

export interface SyncTenantConfigResultResponseDto {
  /** 同步是否成功 */
  success: boolean;
}

export interface TenantSelectItemResponseDto {
  /** 租户ID */
  tenantId: string;
  /** 企业名称 */
  companyName: string;
  /** 状态 */
  status: string;
}

export interface TenantSelectListResponseDto {
  /** 可切换租户列表 */
  list: TenantSelectItemResponseDto[];
}

export interface TenantSwitchStatusResponseDto {
  /** 是否已切换租户 */
  isSwitched: boolean;
  /** 当前租户ID */
  currentTenantId?: string;
  /** 原租户ID */
  originalTenantId?: string;
}

export interface TenantSwitchResponseDto {
  /** 是否成功 */
  success: boolean;
  /** 目标租户ID */
  tenantId: string;
  /** 企业名称 */
  companyName: string;
  /** 原租户ID */
  originalTenantId?: string;
}

export interface TenantRestoreResponseDto {
  /** 是否成功 */
  success: boolean;
  /** 原租户ID */
  originalTenantId: string;
  /** 原企业名称 */
  originalCompanyName: string;
}

export interface UpdateTenantResultResponseDto {
  /** 更新是否成功 */
  success: boolean;
}

export interface UpdateTenantRequestDto {
  /** 联系人 */
  contactUserName?: string;
  /** 联系电话 */
  contactPhone?: string;
  /** 企业名称 */
  companyName?: string;
  /** 统一社会信用代码 */
  licenseNumber?: string;
  /** 地址 */
  address?: string;
  /** 企业简介 */
  intro?: string;
  /** 域名 */
  domain?: string;
  /** 租户套餐ID */
  packageId?: number;
  /** 过期时间 */
  expireTime?: string;
  /** 账号数量(-1不限制) */
  accountCount?: number;
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
  /** 租户ID */
  id: number;
  /** 租户编号 */
  tenantId: string;
}

export interface DeleteTenantResultResponseDto {
  /** 删除的记录数 */
  affected: number;
}

export interface ListTenantRequestDto {
  /** 页码（从1开始） */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 排序字段 */
  orderByColumn?: string;
  /** 排序方向 */
  isAsc?: 'asc' | 'desc';
  /** 时间范围 */
  params?: DateRangeDto;
  /** 租户ID */
  tenantId?: string;
  /** 联系人 */
  contactUserName?: string;
  /** 联系电话 */
  contactPhone?: string;
  /** 企业名称 */
  companyName?: string;
  /** 状态(0正常 1停用) */
  status?: string;
  /** 开始时间 */
  beginTime?: string;
  /** 结束时间 */
  endTime?: string;
}

export interface TenantStatsResponseDto {
  /** 租户总数 */
  totalTenants: number;
  /** 活跃租户数 */
  activeTenants: number;
  /** 新增租户数（本月） */
  newTenants: number;
  /** 用户总数 */
  totalUsers: number;
  /** 在线用户数 */
  onlineUsers: number;
  /** 今日登录用户数 */
  todayLoginUsers: number;
  /** 存储使用总量（MB） */
  totalStorageUsed: number;
  /** API调用总量（今日） */
  totalApiCalls: number;
}

export interface TenantTrendDataResponseDto {
  /** 日期 */
  date: string;
  /** 新增租户数 */
  newTenants: number;
  /** 累计租户数 */
  totalTenants: number;
}

export interface PackageDistributionResponseDto {
  /** 套餐ID */
  packageId: number;
  /** 套餐名称 */
  packageName: string;
  /** 租户数量 */
  count: number;
  /** 占比 */
  percentage: number;
}

export interface ExpiringTenantResponseDto {
  /** 租户ID */
  tenantId: string;
  /** 企业名称 */
  companyName: string;
  /** 联系人 */
  contactUserName: string;
  /** 联系电话 */
  contactPhone: string;
  /** 到期时间 */
  expireTime: string;
  /** 剩余天数 */
  daysRemaining: number;
  /** 套餐名称 */
  packageName: string;
}

export interface QuotaTopTenantResponseDto {
  /** 租户ID */
  tenantId: string;
  /** 企业名称 */
  companyName: string;
  /** 用户配额使用率 */
  userQuotaUsage: number;
  /** 存储配额使用率 */
  storageQuotaUsage: number;
  /** API配额使用率 */
  apiQuotaUsage: number;
  /** 综合使用率 */
  overallUsage: number;
}

export interface DashboardDataResponseDto {
  /** 统计卡片数据 */
  stats: TenantStatsResponseDto;
  /** 租户增长趋势 */
  trend: TenantTrendDataResponseDto[];
  /** 套餐分布 */
  packageDistribution: PackageDistributionResponseDto[];
  /** 即将到期租户 */
  expiringTenants: ExpiringTenantResponseDto[];
  /** 配额使用TOP10 */
  quotaTopTenants: QuotaTopTenantResponseDto[];
}

export interface TenantQuotaResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 配额记录ID */
  id: number;
  /** 租户ID */
  tenantId: number;
  /** 企业名称 */
  companyName: string;
  /** 用户数量配额，-1表示不限 */
  userQuota: number;
  /** 已使用用户数 */
  userUsed: number;
  /** 用户配额使用率 */
  userUsageRate: number;
  /** 存储配额（MB），-1表示不限 */
  storageQuota: number;
  /** 已使用存储（MB） */
  storageUsed: number;
  /** 存储配额使用率 */
  storageUsageRate: number;
  /** API调用配额（月），-1表示不限 */
  apiQuota: number;
  /** 本月已调用次数 */
  apiUsed: number;
  /** API配额使用率 */
  apiUsageRate: number;
  /** 配额状态 */
  status: 'normal' | 'warning' | 'danger';
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface UpdateTenantQuotaRequestDto {
  /** 租户ID */
  tenantId: string;
  /** 用户数量配额，-1表示不限 */
  userQuota?: number;
  /** 存储配额（MB），-1表示不限 */
  storageQuota?: number;
  /** API调用配额（月），-1表示不限 */
  apiQuota?: number;
}

export interface CheckQuotaRequestDto {
  /** 租户ID */
  tenantId: string;
  /** 配额类型 */
  quotaType: 'user' | 'storage' | 'api';
  /** 请求增量（默认1） */
  increment?: number;
}

export interface TenantAuditLogVo {
  /** 日志ID */
  id: number;
  /** 租户ID */
  tenantId: string;
  /** 企业名称 */
  companyName: string;
  /** 操作人ID */
  operatorId: number;
  /** 操作人名称 */
  operatorName: string;
  /** 操作类型 */
  actionType: string;
  /** 操作描述 */
  actionDesc: string;
  /** 模块 */
  module: string;
  /** IP地址 */
  ipAddress: string;
  /** 用户代理 */
  userAgent?: string;
  /** 请求URL */
  requestUrl?: string;
  /** 请求方法 */
  requestMethod?: string;
  /** 操作时间 */
  operateTime: string;
}

export interface TenantAuditLogListVo {
  /** 日志记录 */
  rows: TenantAuditLogVo[];
  /** 总数 */
  total: number;
}

export interface TenantAuditLogDetailVo {
  /** 日志ID */
  id: number;
  /** 租户ID */
  tenantId: string;
  /** 企业名称 */
  companyName: string;
  /** 操作人ID */
  operatorId: number;
  /** 操作人名称 */
  operatorName: string;
  /** 操作类型 */
  actionType: string;
  /** 操作描述 */
  actionDesc: string;
  /** 模块 */
  module: string;
  /** IP地址 */
  ipAddress: string;
  /** 用户代理 */
  userAgent?: string;
  /** 请求URL */
  requestUrl?: string;
  /** 请求方法 */
  requestMethod?: string;
  /** 操作时间 */
  operateTime: string;
  /** 请求参数 */
  requestParams?: string;
  /** 操作前数据 */
  beforeData?: string;
  /** 操作后数据 */
  afterData?: string;
  /** 响应数据 */
  responseData?: string;
  /** 操作结果 */
  result?: string;
  /** 错误信息 */
  errorMessage?: string;
}

export interface TenantAuditLogStatsVo {
  /** 今日操作数 */
  todayCount: number;
  /** 本周操作数 */
  weekCount: number;
  /** 本月操作数 */
  monthCount: number;
  byActionType: Record<string, unknown>[];
  byModule: Record<string, unknown>[];
}

export interface ExportTenantAuditLogRequestDto {
  /** 租户ID */
  tenantId?: string;
  /** 操作人姓名 */
  operatorName?: string;
  /** 操作类型 */
  actionType?:
    | 'login'
    | 'logout'
    | 'create'
    | 'update'
    | 'delete'
    | 'permission_change'
    | 'config_change'
    | 'export'
    | 'other';
  /** 操作模块 */
  module?: string;
  /** 开始时间 */
  beginTime?: string;
  /** 结束时间 */
  endTime?: string;
}

export interface CreateTenantPackageRequestDto {
  /** 套餐名称 */
  packageName: string;
  /** 关联的菜单ID列表 */
  menuIds?: number[];
  /** 菜单树选择项是否关联显示 */
  menuCheckStrictly?: boolean;
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
}

export interface TenantPackageResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 套餐ID */
  packageId: number;
  /** 套餐名称 */
  packageName: string;
  /** 关联的菜单ID */
  menuIds?: string;
  /** 菜单树选择项是否关联显示 */
  menuCheckStrictly: boolean;
  /** 状态(0正常 1停用) */
  status: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface TenantPackageListResponseDto {
  /** 套餐列表 */
  rows: TenantPackageResponseDto[];
  /** 总数 */
  total: number;
}

export interface TenantPackageSelectResponseDto {
  /** 套餐ID */
  packageId: number;
  /** 套餐名称 */
  packageName: string;
}

export interface UpdateTenantPackageRequestDto {
  /** 套餐名称 */
  packageName?: string;
  /** 关联的菜单ID列表 */
  menuIds?: number[];
  /** 菜单树选择项是否关联显示 */
  menuCheckStrictly?: boolean;
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
  /** 套餐ID */
  packageId: number;
}

export interface ListTenantPackageRequestDto {
  /** 页码（从1开始） */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 排序字段 */
  orderByColumn?: string;
  /** 排序方向 */
  isAsc?: 'asc' | 'desc';
  /** 时间范围 */
  params?: DateRangeDto;
  /** 套餐名称 */
  packageName?: string;
  /** 状态(0正常 1停用) */
  status?: string;
}

export interface TableName {
  /** 表名称列表 */
  tableNames: string;
}

export interface GenTableUpdate {
  /** 表ID */
  tableId: number;
}

export interface GenerateCodeDto {
  /** 表ID列表 */
  tableIds: number[];
  /** 模板组ID */
  templateGroupId?: number;
  /** 项目名称（用于ZIP文件命名） */
  projectName?: string;
}

export interface CreateDataSourceDto {
  /** 数据源名称 */
  name: string;
  /** 数据库类型 */
  type: 'postgresql' | 'mysql' | 'sqlite';
  /** 主机地址 */
  host: string;
  /** 端口号 */
  port: number;
  /** 数据库名称 */
  database: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** 备注 */
  remark?: string;
}

export interface DataSourceResponseDto {
  /** 数据源ID */
  id: number;
  /** 租户ID */
  tenantId: string;
  /** 数据源名称 */
  name: string;
  /** 数据库类型 */
  type: 'postgresql' | 'mysql' | 'sqlite';
  /** 主机地址 */
  host: string;
  /** 端口号 */
  port: number;
  /** 数据库名称 */
  database: string;
  /** 用户名 */
  username: string;
  /** 状态（0正常 1停用） */
  status: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime?: string;
}

export interface UpdateDataSourceDto {
  /** 数据源名称 */
  name?: string;
  /** 数据库类型 */
  type?: 'postgresql' | 'mysql' | 'sqlite';
  /** 主机地址 */
  host?: string;
  /** 端口号 */
  port?: number;
  /** 数据库名称 */
  database?: string;
  /** 用户名 */
  username?: string;
  /** 密码（留空则不更新） */
  password?: string;
  /** 状态（0正常 1停用） */
  status?: string;
  /** 备注 */
  remark?: string;
}

export interface TestConnectionDto {
  /** 数据库类型 */
  type: 'postgresql' | 'mysql' | 'sqlite';
  /** 主机地址 */
  host: string;
  /** 端口号 */
  port: number;
  /** 数据库名称 */
  database: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
}

export interface DbTableDto {
  /** 表名 */
  tableName: string;
  /** 表注释 */
  tableComment: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
}

export interface DbColumnDto {
  /** 列名 */
  columnName: string;
  /** 列注释 */
  columnComment: string;
  /** 列类型 */
  columnType: string;
  /** 是否主键 */
  isPrimaryKey: boolean;
  /** 是否自增 */
  isAutoIncrement: boolean;
  /** 是否可空 */
  isNullable: boolean;
  /** 默认值 */
  defaultValue?: string;
  /** 字符最大长度 */
  maxLength?: number;
}

export interface CreateTemplateGroupDto {
  /** 模板组名称 */
  name: string;
  /** 模板组描述 */
  description?: string;
  /** 是否为默认模板组 */
  isDefault?: boolean;
}

export interface TemplateResponseDto {
  /** 模板ID */
  id: number;
  /** 模板组ID */
  groupId: number;
  /** 模板名称 */
  name: string;
  /** 输出文件名模板 */
  fileName: string;
  /** 输出路径模板 */
  filePath: string;
  /** 模板内容 */
  content: string;
  /** 模板语言 */
  language: 'typescript' | 'vue' | 'sql';
  /** 排序号 */
  sort: number;
  /** 状态（0正常 1停用） */
  status: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime?: string;
}

export interface TemplateGroupResponseDto {
  /** 模板组ID */
  id: number;
  /** 租户ID（null表示系统级） */
  tenantId?: string;
  /** 模板组名称 */
  name: string;
  /** 模板组描述 */
  description?: string;
  /** 是否为默认模板组 */
  isDefault: boolean;
  /** 状态（0正常 1停用） */
  status: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime?: string;
  /** 模板列表 */
  templates?: TemplateResponseDto[];
}

export interface UpdateTemplateGroupDto {
  /** 模板组名称 */
  name?: string;
  /** 模板组描述 */
  description?: string;
  /** 是否为默认模板组 */
  isDefault?: boolean;
  /** 状态（0正常 1停用） */
  status?: string;
}

export interface ImportTemplateItemDto {
  /** 模板名称 */
  name: string;
  /** 输出文件名模板 */
  fileName: string;
  /** 输出路径模板 */
  filePath: string;
  /** 模板内容 */
  content: string;
  /** 模板语言 */
  language: 'typescript' | 'vue' | 'sql';
  /** 排序号 */
  sort?: number;
}

export interface ExportTemplateGroupDto {
  /** 模板组名称 */
  name: string;
  /** 模板组描述 */
  description?: string;
  /** 导出时间 */
  exportTime: string;
  /** 版本号 */
  version: string;
  /** 模板列表 */
  templates: ImportTemplateItemDto[];
}

export interface ImportTemplateGroupDto {
  /** 模板组名称 */
  name: string;
  /** 模板组描述 */
  description?: string;
  /** 模板列表 */
  templates: ImportTemplateItemDto[];
}

export interface CreateTemplateDto {
  /** 模板组ID */
  groupId: number;
  /** 模板名称 */
  name: string;
  /** 输出文件名模板 */
  fileName: string;
  /** 输出路径模板 */
  filePath: string;
  /** 模板内容 */
  content: string;
  /** 模板语言 */
  language: 'typescript' | 'vue' | 'sql';
  /** 排序号 */
  sort?: number;
}

export interface UpdateTemplateDto {
  /** 模板名称 */
  name?: string;
  /** 输出文件名模板 */
  fileName?: string;
  /** 输出路径模板 */
  filePath?: string;
  /** 模板内容 */
  content?: string;
  /** 模板语言 */
  language?: 'typescript' | 'vue' | 'sql';
  /** 排序号 */
  sort?: number;
  /** 状态（0正常 1停用） */
  status?: string;
}

export interface ValidateTemplateDto {
  /** 模板内容 */
  content: string;
}

export interface UserResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 用户ID */
  userId: number;
  /** 部门ID */
  deptId?: number;
  /** 用户账号 */
  userName: string;
  /** 用户昵称 */
  nickName: string;
  /** 用户类型（00系统用户） */
  userType?: string;
  /** 用户邮箱 */
  email?: string;
  /** 手机号码 */
  phonenumber?: string;
  /** 用户性别 */
  sex?: SexEnum;
  /** 头像地址 */
  avatar?: string;
  /** 帐号状态 */
  status?: StatusEnum;
  /** 最后登录IP */
  loginIp?: string;
  /** 最后登录时间 */
  loginDate?: string;
  /** 部门名称 */
  deptName?: string;
  dept?: Record<string, unknown>;
  /** 角色列表 */
  roles?: RoleResponseDto[];
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface CurrentUserInfoResponseDto {
  /** 用户信息 */
  user: UserResponseDto;
  /** 角色列表 */
  roles: string[];
  /** 权限列表 */
  permissions: string[];
}

export interface UpdateProfileDto {
  /** 用户昵称 */
  nickName: string;
  /** 邮箱地址 */
  email: string;
  /** 手机号码 */
  phonenumber: string;
  sex: SexEnum;
  /** 头像地址 */
  avatar?: string;
}

export interface UserAvatarResponseDto {
  /** 头像URL */
  imgUrl: string;
}

export interface UpdatePwdDto {
  /** 旧密码 */
  oldPassword: string;
  /** 新密码 */
  newPassword: string;
}

export interface CreateUserDto {
  /** 部门ID */
  deptId?: number;
  /** 邮箱地址 */
  email?: string;
  /** 用户昵称 */
  nickName: string;
  /** 用户账号 */
  userName: string;
  /** 用户密码（需包含大小写字母、数字和特殊字符） */
  password: string;
  /** 手机号码 */
  phonenumber?: string;
  /** 岗位ID列表 */
  postIds?: number[];
  /** 角色ID列表 */
  roleIds?: number[];
  /** 用户状态（0正常 1停用） */
  status?: StatusEnum;
  /** 用户性别（0男 1女 2未知） */
  sex?: SexEnum;
  /** 备注 */
  remark?: string;
  /** 显示排序 */
  postSort?: number;
}

export interface BatchResultItem {
  /** 索引或ID */
  index: number;
  /** 是否成功 */
  success: boolean;
  /** 错误消息 */
  error?: string;
  /** 创建的用户ID */
  userId?: number;
}

export interface BatchResultDto {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failedCount: number;
  /** 总数量 */
  totalCount: number;
  /** 详细结果 */
  results: BatchResultItem[];
}

export interface BatchCreateUserItemDto {
  /** 部门ID */
  deptId?: number;
  /** 邮箱地址 */
  email?: string;
  /** 用户昵称 */
  nickName: string;
  /** 用户账号 */
  userName: string;
  /** 用户密码 */
  password: string;
  /** 手机号码 */
  phonenumber?: string;
  /** 岗位ID列表 */
  postIds?: number[];
  /** 角色ID列表 */
  roleIds?: number[];
  status?: StatusEnum;
  sex?: SexEnum;
  /** 备注 */
  remark?: string;
}

export interface BatchCreateUserDto {
  /** 用户列表 */
  users: BatchCreateUserItemDto[];
}

export interface BatchDeleteUserDto {
  /** 用户ID列表 */
  userIds: number[];
}

export interface UserListResponseDto {
  /** 用户列表 */
  rows: UserResponseDto[];
  /** 总数量 */
  total: number;
}

export interface UserDetailResponseDto {
  /** 用户信息 */
  data?: UserResponseDto;
  /** 岗位选项列表 */
  posts: PostResponseDto[];
  /** 角色选项列表 */
  roles: RoleResponseDto[];
  /** 用户已分配的岗位ID列表 */
  postIds?: number[];
  /** 用户已分配的角色ID列表 */
  roleIds?: number[];
}

export interface AuthRoleResponseDto {
  /** 用户信息 */
  user: UserResponseDto;
  /** 角色列表 */
  roles: RoleResponseDto[];
}

export interface UserOptionResponseDto {
  /** 用户ID */
  userId: number;
  /** 用户名 */
  userName: string;
  /** 昵称 */
  nickName: string;
}

export interface UserOptionSelectResponseDto {
  /** 用户选项列表 */
  list: UserOptionResponseDto[];
}

export interface ChangeUserStatusDto {
  /** 用户ID */
  userId: number;
  status: StatusEnum;
}

export interface UpdateUserDto {
  /** 部门ID */
  deptId?: number;
  /** 邮箱地址 */
  email?: string;
  /** 用户昵称 */
  nickName?: string;
  /** 用户账号 */
  userName?: string;
  /** 用户密码（需包含大小写字母、数字和特殊字符） */
  password?: string;
  /** 手机号码 */
  phonenumber?: string;
  /** 岗位ID列表 */
  postIds?: number[];
  /** 角色ID列表 */
  roleIds?: number[];
  /** 用户状态（0正常 1停用） */
  status?: StatusEnum;
  /** 用户性别（0男 1女 2未知） */
  sex?: SexEnum;
  /** 备注 */
  remark?: string;
  /** 显示排序 */
  postSort?: number;
  /** 用户ID */
  userId: number;
}

export interface ResetPwdDto {
  /** 用户ID */
  userId: number;
  /** 新密码 */
  password: string;
}

export interface ListUserDto {
  /** 页码（从1开始） */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 排序字段 */
  orderByColumn?: string;
  /** 排序方向 */
  isAsc?: 'asc' | 'desc';
  /** 时间范围 */
  params?: DateRangeDto;
  /** 部门ID */
  deptId?: string;
  /** 用户昵称 */
  nickName?: string;
  /** 邮箱地址 */
  email?: string;
  /** 用户账号 */
  userName?: string;
  /** 手机号码 */
  phonenumber?: string;
  /** 用户状态（0正常 1停用） */
  status?: StatusEnum;
}

export interface FolderResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 文件夹ID */
  folderId: number;
  /** 父文件夹ID */
  parentId: number;
  /** 文件夹名称 */
  folderName: string;
  /** 文件夹路径 */
  folderPath: string;
  /** 排序 */
  orderNum: number;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface CreateFolderRequestDto {
  /** 父文件夹ID */
  parentId?: number;
  /** 文件夹名称 */
  folderName: string;
  /** 排序 */
  orderNum?: number;
  /** 备注 */
  remark?: string;
}

export interface UpdateFolderRequestDto {
  /** 文件夹ID */
  folderId: number;
  /** 文件夹名称 */
  folderName?: string;
  /** 排序 */
  orderNum?: number;
  /** 备注 */
  remark?: string;
}

export interface FolderTreeNodeResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 文件夹ID */
  folderId: number;
  /** 父文件夹ID */
  parentId: number;
  /** 文件夹名称 */
  folderName: string;
  /** 文件夹路径 */
  folderPath: string;
  /** 排序 */
  orderNum: number;
  /** 子文件夹 */
  children?: FolderTreeNodeResponseDto[];
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface FileResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 上传ID */
  uploadId: string;
  /** 原始文件名 */
  fileName: string;
  /** 存储文件名 */
  newFileName: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件MIME类型 */
  mimeType: string;
  /** 文件扩展名 */
  ext: string;
  /** 所属文件夹ID */
  folderId: number;
  /** 文件访问URL */
  url: string;
  /** 缩略图URL */
  thumbnail?: string;
  /** 存储类型 */
  storageType: string;
  /** 文件MD5 */
  fileMd5: string;
  /** 版本号 */
  version: number;
  /** 是否最新版本 */
  isLatest: boolean;
  /** 下载次数 */
  downloadCount: number;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface FileListResponseDto {
  /** 文件列表 */
  rows: FileResponseDto[];
  /** 总数量 */
  total: number;
}

export interface MoveFileRequestDto {
  /** 文件ID列表 */
  uploadIds: string[];
  /** 目标文件夹ID */
  targetFolderId: number;
}

export interface RenameFileRequestDto {
  /** 文件ID */
  uploadId: string;
  /** 新文件名 */
  newFileName: string;
}

export interface CreateShareResultResponseDto {
  /** 分享ID */
  shareId: string;
  /** 分享链接 */
  shareUrl: string;
  /** 分享码 */
  shareCode?: string;
  /** 过期时间 */
  expireTime?: string;
}

export interface CreateShareRequestDto {
  /** 文件ID */
  uploadId: string;
  /** 分享码（6位，不填则无需密码） */
  shareCode?: string;
  /** 过期时间（小时，-1 永久有效） */
  expireHours?: number;
  /** 最大下载次数（-1 不限） */
  maxDownload?: number;
}

export interface ShareResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 分享ID */
  shareId: string;
  /** 上传ID */
  uploadId: string;
  /** 分享码 */
  shareCode?: string;
  /** 过期时间 */
  expireTime?: string;
  /** 最大下载次数 */
  maxDownload: number;
  /** 下载次数 */
  downloadCount: number;
  /** 状态 */
  status: string;
  /** 关联的文件信息 */
  upload?: FileResponseDto;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface ShareInfoResponseDto {
  /** 分享信息 */
  shareInfo: ShareResponseDto;
  /** 文件信息 */
  fileInfo: FileResponseDto;
}

export interface ShareListResponseDto {
  /** 分享列表 */
  rows: ShareResponseDto[];
  /** 总数量 */
  total: number;
}

export interface FileVersionResponseDto {
  /** 上传ID */
  uploadId: string;
  /** 文件名 */
  fileName: string;
  /** 文件大小 */
  size: number;
  /** 版本号 */
  version: number;
  /** 是否最新版本 */
  isLatest: boolean;
  /** 文件扩展名 */
  ext: string;
  /** 文件URL */
  url: string;
  /** 创建者 */
  createBy: string;
}

export interface FileVersionListResponseDto {
  /** 当前版本号 */
  currentVersion: number;
  /** 版本列表 */
  versions: FileVersionResponseDto[];
}

export interface RestoreVersionResultResponseDto {
  /** 新版本号 */
  newVersion: number;
  /** 新上传ID */
  uploadId: string;
}

export interface AccessTokenResponseDto {
  /** 访问令牌 */
  token: string;
  /** 过期时间（秒） */
  expiresIn: number;
}

export interface StorageStatsResponseDto {
  /** 已使用存储空间（MB） */
  used: number;
  /** 总存储空间（MB） */
  quota: number;
  /** 使用百分比 */
  percentage: number;
  /** 剩余空间（MB） */
  remaining: number;
  /** 公司名称 */
  companyName: string;
}

export interface CreateSmsChannelRequestDto {
  /** 渠道编码 */
  code: 'aliyun' | 'tencent' | 'huawei';
  /** 渠道名称 */
  name: string;
  /** 短信签名 */
  signature: string;
  /** API Key */
  apiKey: string;
  /** API Secret */
  apiSecret: string;
  /** 回调地址 */
  callbackUrl?: string;
  /** 状态（0-禁用 1-启用） */
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
}

export interface SmsChannelResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 渠道ID */
  id: number;
  /** 渠道编码 */
  code: string;
  /** 渠道名称 */
  name: string;
  /** 签名 */
  signature: string;
  /** API Key */
  apiKey?: string;
  /** 回调URL */
  callbackUrl?: string;
  /** 状态 */
  status: string;
  apiSecret?: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface UpdateSmsChannelRequestDto {
  /** 渠道编码 */
  code?: 'aliyun' | 'tencent' | 'huawei';
  /** 渠道名称 */
  name?: string;
  /** 短信签名 */
  signature?: string;
  /** API Key */
  apiKey?: string;
  /** API Secret */
  apiSecret?: string;
  /** 回调地址 */
  callbackUrl?: string;
  /** 状态（0-禁用 1-启用） */
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
  /** 渠道ID */
  id: number;
}

export interface CreateSmsTemplateRequestDto {
  /** 渠道ID */
  channelId: number;
  /** 模板编码 */
  code: string;
  /** 模板名称 */
  name: string;
  /** 模板内容 */
  content: string;
  /** 参数列表（JSON数组） */
  params?: string;
  /** 第三方模板ID */
  apiTemplateId: string;
  /** 模板类型（1-验证码 2-通知 3-营销） */
  type: number;
  /** 状态（0-禁用 1-启用） */
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
}

export interface SmsTemplateResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 模板ID */
  id: number;
  /** 模板编码 */
  code: string;
  /** 模板名称 */
  name: string;
  /** 渠道ID */
  channelId: number;
  /** 渠道编码 */
  channelCode?: string;
  /** 渠道名称 */
  channelName?: string;
  /** 模板类型 */
  type: number;
  /** 模板内容 */
  content: string;
  /** 参数列表 */
  params?: string;
  /** API模板ID */
  apiTemplateId?: string;
  /** 状态 */
  status: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface UpdateSmsTemplateRequestDto {
  /** 渠道ID */
  channelId?: number;
  /** 模板编码 */
  code?: string;
  /** 模板名称 */
  name?: string;
  /** 模板内容 */
  content?: string;
  /** 参数列表（JSON数组） */
  params?: string;
  /** 第三方模板ID */
  apiTemplateId?: string;
  /** 模板类型（1-验证码 2-通知 3-营销） */
  type?: number;
  /** 状态（0-禁用 1-启用） */
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
  /** 模板ID */
  id: number;
}

export interface SendSmsDto {
  /** 手机号 */
  mobile: string;
  /** 模板编码 */
  templateCode: string;
  /** 模板参数 */
  params?: Record<string, unknown>;
}

export interface BatchSendSmsDto {
  /** 手机号列表 */
  mobiles: string[];
  /** 模板编码 */
  templateCode: string;
  /** 模板参数 */
  params?: Record<string, unknown>;
}

export interface SmsLogResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 日志ID */
  id: number;
  /** 渠道ID */
  channelId: number;
  /** 渠道编码 */
  channelCode: string;
  /** 模板ID */
  templateId: number;
  /** 模板编码 */
  templateCode: string;
  /** 手机号码 */
  mobile: string;
  /** 短信内容 */
  content: string;
  /** 模板参数 */
  params?: string;
  /** 发送状态 */
  sendStatus: number;
  /** API发送编码 */
  apiSendCode?: string;
  /** API接收编码 */
  apiReceiveCode?: string;
  /** 错误信息 */
  errorMsg?: string;
  /** 发送时间 */
  sendTime: string;
  /** 接收时间 */
  receiveTime?: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface CreateMailAccountRequestDto {
  /** 邮箱地址 */
  mail: string;
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
  /** SMTP主机 */
  host: string;
  /** SMTP端口 */
  port: number;
  /** 是否启用SSL */
  sslEnable?: boolean;
  /** 状态（0-禁用 1-启用） */
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
}

export interface MailAccountResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 账号ID */
  id: number;
  /** 邮箱地址 */
  mail: string;
  /** 用户名 */
  username: string;
  /** SMTP主机 */
  host: string;
  /** SMTP端口 */
  port: number;
  /** 是否启用SSL */
  sslEnable: boolean;
  /** 状态 */
  status: string;
  /** 密码 - 不返回给前端 */
  password?: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
}

export interface UpdateMailAccountRequestDto {
  /** 邮箱地址 */
  mail?: string;
  /** 用户名 */
  username?: string;
  /** 密码 */
  password?: string;
  /** SMTP主机 */
  host?: string;
  /** SMTP端口 */
  port?: number;
  /** 是否启用SSL */
  sslEnable?: boolean;
  /** 状态（0-禁用 1-启用） */
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
  /** 账号ID */
  id: number;
}

export interface CreateMailTemplateRequestDto {
  /** 模板名称 */
  name: string;
  /** 模板编码 */
  code: string;
  /** 发送账号ID */
  accountId: number;
  /** 发送人昵称 */
  nickname: string;
  /** 邮件标题 */
  title: string;
  /** 邮件内容（HTML） */
  content: string;
  /** 参数列表（JSON数组） */
  params?: string;
  /** 状态（0-禁用 1-启用） */
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
}

export interface MailTemplateResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 模板ID */
  id: number;
  /** 模板名称 */
  name: string;
  /** 模板编码 */
  code: string;
  /** 发送账号ID */
  accountId: number;
  /** 发送账号邮箱 */
  accountMail?: string;
  /** 发送人昵称 */
  nickname: string;
  /** 邮件标题 */
  title: string;
  /** 邮件内容（HTML） */
  content: string;
  /** 参数列表 */
  params?: string;
  /** 状态 */
  status: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface UpdateMailTemplateRequestDto {
  /** 模板名称 */
  name?: string;
  /** 模板编码 */
  code?: string;
  /** 发送账号ID */
  accountId?: number;
  /** 发送人昵称 */
  nickname?: string;
  /** 邮件标题 */
  title?: string;
  /** 邮件内容（HTML） */
  content?: string;
  /** 参数列表（JSON数组） */
  params?: string;
  /** 状态（0-禁用 1-启用） */
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
  /** 模板ID */
  id: number;
}

export interface SendMailDto {
  /** 收件人邮箱 */
  toMail: string;
  /** 模板编码 */
  templateCode: string;
  /** 模板参数 */
  params?: Record<string, unknown>;
}

export interface BatchSendMailDto {
  /** 收件人邮箱列表 */
  toMails: string[];
  /** 模板编码 */
  templateCode: string;
  /** 模板参数 */
  params?: Record<string, unknown>;
}

export interface TestMailDto {
  /** 收件人邮箱 */
  toMail: string;
  /** 邮箱账号ID */
  accountId: number;
  /** 邮件标题 */
  title?: string;
  /** 邮件内容 */
  content?: string;
}

export interface MailLogResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 日志ID */
  id: string;
  /** 用户ID */
  userId: number;
  /** 用户类型 */
  userType: number;
  /** 收件邮箱 */
  toMail: string;
  /** 账号ID */
  accountId: number;
  /** 发件邮箱 */
  fromMail: string;
  /** 模板ID */
  templateId: number;
  /** 模板编码 */
  templateCode: string;
  /** 模板参数 */
  templateParams?: string;
  /** 邮件标题 */
  templateTitle: string;
  /** 邮件内容 */
  templateContent: string;
  /** 发送状态 */
  sendStatus: number;
  /** 发送时间 */
  sendTime?: string;
  /** 发送消息ID */
  sendMessageId?: string;
  /** 发送异常 */
  sendException?: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface CreateNotifyTemplateRequestDto {
  /** 模板名称 */
  name: string;
  /** 模板编码 */
  code: string;
  /** 发送人名称 */
  nickname: string;
  /** 模板内容 */
  content: string;
  /** 参数列表（JSON数组） */
  params?: string;
  /** 类型（1-系统通知 2-业务通知） */
  type?: number;
  /** 状态（0-禁用 1-启用） */
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
}

export interface NotifyTemplateResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 模板ID */
  id: number;
  /** 模板名称 */
  name: string;
  /** 模板编码 */
  code: string;
  /** 发送人名称 */
  nickname: string;
  /** 模板内容 */
  content: string;
  /** 模板类型 */
  type: number;
  /** 参数列表 */
  params?: string;
  /** 状态 */
  status: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface UpdateNotifyTemplateRequestDto {
  /** 模板名称 */
  name?: string;
  /** 模板编码 */
  code?: string;
  /** 发送人名称 */
  nickname?: string;
  /** 模板内容 */
  content?: string;
  /** 参数列表（JSON数组） */
  params?: string;
  /** 类型（1-系统通知 2-业务通知） */
  type?: number;
  /** 状态（0-禁用 1-启用） */
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
  /** 模板ID */
  id: number;
}

export interface SendNotifyMessageRequestDto {
  /** 接收用户ID列表 */
  userIds: number[];
  /** 模板编码 */
  templateCode: string;
  /** 模板参数 */
  params?: Record<string, unknown>;
}

export interface SendNotifyAllRequestDto {
  /** 模板编码 */
  templateCode: string;
  /** 模板参数 */
  params?: Record<string, unknown>;
}

export interface NotifyMessageResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 消息ID */
  id: string;
  /** 用户ID */
  userId: number;
  /** 用户类型 */
  userType: number;
  /** 模板ID */
  templateId: number;
  /** 模板编码 */
  templateCode: string;
  /** 模板发送人名称 */
  templateNickname: string;
  /** 模板内容 */
  templateContent: string;
  /** 模板参数 */
  templateParams?: string;
  /** 是否已读 */
  readStatus: boolean;
  /** 阅读时间 */
  readTime?: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface UnreadCountResponseDto {
  /** 未读计数 */
  count: number;
}

export interface JobResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 任务ID */
  jobId: number;
  /** 任务名称 */
  jobName: string;
  /** 任务组名 */
  jobGroup: string;
  /** 调用目标字符串 */
  invokeTarget: string;
  /** cron执行表达式 */
  cronExpression: string;
  /** 计划执行错误策略 */
  misfirePolicy: string;
  /** 是否并发执行 */
  concurrent: string;
  /** 状态 */
  status: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface JobListResponseDto {
  /** 任务列表 */
  rows: JobResponseDto[];
  /** 总数量 */
  total: number;
}

export interface CreateJobResultResponseDto {
  /** 创建的任务ID */
  jobId: number;
}

export interface CreateJobDto {
  /** 任务名称 */
  jobName: string;
  /** 任务组名 */
  jobGroup: string;
  /** 调用目标字符串 */
  invokeTarget: string;
  /** cron执行表达式 */
  cronExpression: string;
  /** 计划执行错误策略（1立即执行 2执行一次 3放弃执行） */
  misfirePolicy?: string;
  /** 是否并发执行（0允许 1禁止） */
  concurrent?: string;
  /** 状态（0正常 1暂停） */
  status: string;
  /** 备注信息 */
  remark?: string;
}

export interface ChangeJobStatusResultResponseDto {
  /** 修改是否成功 */
  success: boolean;
}

export interface UpdateJobResultResponseDto {
  /** 更新是否成功 */
  success: boolean;
}

export interface DeleteJobResultResponseDto {
  /** 删除的记录数 */
  affected: number;
}

export interface RunJobResultResponseDto {
  /** 执行是否成功 */
  success: boolean;
}

export interface ListJobDto {
  /** 页码（从1开始） */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 排序字段 */
  orderByColumn?: string;
  /** 排序方向 */
  isAsc?: 'asc' | 'desc';
  /** 时间范围 */
  params?: DateRangeDto;
  /** 任务名称 */
  jobName?: string;
  /** 任务组名 */
  jobGroup?: string;
  /** 状态（0正常 1暂停） */
  status?: string;
}

export interface JobLogResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 日志ID */
  jobLogId: number;
  /** 任务名称 */
  jobName: string;
  /** 任务组名 */
  jobGroup: string;
  /** 调用目标字符串 */
  invokeTarget: string;
  /** 日志信息 */
  jobMessage: string;
  /** 执行状态 */
  status: string;
  /** 异常信息 */
  exceptionInfo: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface JobLogListResponseDto {
  /** 任务日志列表 */
  rows: JobLogResponseDto[];
  /** 总数量 */
  total: number;
}

export interface ClearLogResultResponseDto {
  /** 清除是否成功 */
  success: boolean;
}

export interface ListJobLogDto {
  /** 页码（从1开始） */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 排序字段 */
  orderByColumn?: string;
  /** 排序方向 */
  isAsc?: 'asc' | 'desc';
  /** 时间范围 */
  params?: DateRangeDto;
  /** 任务名称 */
  jobName?: string;
  /** 任务组名 */
  jobGroup?: string;
  /** 状态（0正常 1暂停） */
  status?: string;
}

export interface CpuInfoDto {
  /** CPU核心数 */
  cpuNum: number;
  /** 总计 */
  total: number;
  /** 系统使用率 */
  sys: string;
  /** 用户使用率 */
  used: string;
  /** 等待率 */
  wait: number;
  /** 空闲率 */
  free: string;
}

export interface MemInfoDto {
  /** 总内存(GB) */
  total: string;
  /** 已用内存(GB) */
  used: string;
  /** 空闲内存(GB) */
  free: string;
  /** 使用率(%) */
  usage: string;
}

export interface SysInfoDto {
  /** 计算机名称 */
  computerName: string;
  /** 计算机IP */
  computerIp: string;
  /** 用户目录 */
  userDir: string;
  /** 操作系统名称 */
  osName: string;
  /** 操作系统架构 */
  osArch: string;
}

export interface DiskInfoDto {
  /** 挂载点 */
  dirName: string;
  /** 文件系统类型 */
  typeName: string;
  /** 总大小 */
  total: string;
  /** 已用大小 */
  used: string;
  /** 空闲大小 */
  free: string;
  /** 使用率(%) */
  usage: string;
}

export interface ServerInfoResponseDto {
  /** CPU信息 */
  cpu: CpuInfoDto;
  /** 内存信息 */
  mem: MemInfoDto;
  /** 系统信息 */
  sys: SysInfoDto;
  /** 磁盘信息 */
  sysFiles: DiskInfoDto[];
}

export interface CommandStatDto {
  /** 命令名称 */
  name: string;
  /** 调用次数 */
  value: number;
}

export interface CacheInfoResponseDto {
  /** Redis信息 */
  info: Record<string, unknown>;
  /** 数据库大小 */
  dbSize: number;
  /** 命令统计 */
  commandStats: CommandStatDto[];
}

export interface CacheKeyResponseDto {
  /** 缓存名称 */
  cacheName: string;
  /** 缓存键名 */
  cacheKey: string;
  /** 缓存内容 */
  cacheValue: string;
  /** 备注 */
  remark: string;
}

export interface CacheNamesResponseDto {
  /** 缓存名称列表 */
  names: CacheKeyResponseDto[];
}

export interface CacheKeysResponseDto {
  /** 缓存键名列表 */
  keys: string[];
}

export interface ClearCacheResultResponseDto {
  /** 清理是否成功 */
  success: boolean;
}

export interface LoginLogResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 访问ID */
  infoId: number;
  /** 用户账号 */
  userName: string;
  /** 登录IP地址 */
  ipaddr: string;
  /** 登录地点 */
  loginLocation: string;
  /** 浏览器类型 */
  browser: string;
  /** 操作系统 */
  os: string;
  /** 登录状态（0成功 1失败） */
  status: string;
  /** 提示消息 */
  msg: string;
  /** 登录时间 */
  loginTime: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface LoginLogListResponseDto {
  /** 登录日志列表 */
  rows: LoginLogResponseDto[];
  /** 总数量 */
  total: number;
}

export interface UnlockUserResultResponseDto {
  /** 解锁是否成功 */
  success: boolean;
}

export interface DeleteLogResultResponseDto {
  /** 删除的记录数 */
  affected: number;
}

export interface ListLoginlogDto {
  /** 页码（从1开始） */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 排序字段 */
  orderByColumn?: string;
  /** 排序方向 */
  isAsc?: 'asc' | 'desc';
  /** 时间范围 */
  params?: DateRangeDto;
  /** 登录IP地址 */
  ipaddr?: string;
  /** 用户名 */
  userName?: string;
  status?: StatusEnum;
}

export interface OnlineUserResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 会话编号 */
  tokenId: string;
  /** 用户名称 */
  userName: string;
  /** 部门名称 */
  deptName: string;
  /** 登录IP地址 */
  ipaddr: string;
  /** 登录地点 */
  loginLocation: string;
  /** 浏览器类型 */
  browser: string;
  /** 操作系统 */
  os: string;
  /** 登录时间 */
  loginTime: string;
  /** 设备类型 */
  deviceType: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface OnlineUserListResponseDto {
  /** 在线用户列表 */
  rows: OnlineUserResponseDto[];
  /** 总数量 */
  total: number;
}

export interface ForceLogoutResultResponseDto {
  /** 强退是否成功 */
  success: boolean;
}

export interface OperLogResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 日志主键 */
  operId: number;
  /** 模块标题 */
  title: string;
  /** 业务类型（0其它 1新增 2修改 3删除） */
  businessType: number;
  /** 方法名称 */
  method: string;
  /** 请求方式 */
  requestMethod: string;
  /** 操作类别（0其它 1后台用户 2手机端用户） */
  operatorType: number;
  /** 操作人员 */
  operName: string;
  /** 部门名称 */
  deptName: string;
  /** 请求URL */
  operUrl: string;
  /** 主机地址 */
  operIp: string;
  /** 操作地点 */
  operLocation: string;
  /** 请求参数 */
  operParam: string;
  /** 返回参数 */
  jsonResult: string;
  /** 操作状态（0正常 1异常） */
  status: number;
  /** 错误消息 */
  errorMsg: string;
  /** 操作时间 */
  operTime: string;
  /** 消耗时间（毫秒） */
  costTime: number;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface OperLogListResponseDto {
  /** 操作日志列表 */
  rows: OperLogResponseDto[];
  /** 总数量 */
  total: number;
}

export interface QueryOperLogDto {
  /** 日志主键 */
  operId?: number;
  /** 模块标题 */
  title?: string;
  /** 业务类型 */
  businessType?: number;
  /** 请求方式 */
  requestMethod?: string;
  /** 操作类别 */
  operatorType?: number;
  /** 操作人员 */
  operName?: string;
  /** 部门名称 */
  deptName?: string;
  /** 请求URL */
  operUrl?: string;
  /** 操作地点 */
  operLocation?: string;
  /** 请求参数 */
  operParam?: string;
  /** 返回参数 */
  jsonResult?: string;
  /** 错误消息 */
  errorMsg?: string;
  /** 方法名称 */
  method?: string;
  /** 主机地址 */
  operIp?: string;
  /** 操作时间 */
  operTime?: string;
  /** 登录状态 */
  status?: '0' | '1';
  /** 消耗时间 */
  costTime?: number;
  /** 页码（从1开始） */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 排序字段 */
  orderByColumn?: string;
  /** 排序方向 */
  isAsc?: 'asc' | 'desc';
  /** 时间范围 */
  params?: DateRangeDto;
}

export interface CreateOssConfigRequestDto {
  /** 配置名称 */
  configKey: string;
  /** accessKey */
  accessKey: string;
  /** 秘钥secretKey */
  secretKey: string;
  /** 桶名称 */
  bucketName: string;
  /** 前缀 */
  prefix?: string;
  /** 访问站点 */
  endpoint: string;
  /** 自定义域名 */
  domain?: string;
  /** 是否https（Y=是,N=否） */
  isHttps?: string;
  /** 域 */
  region?: string;
  /** 桶权限类型（0=private,1=public,2=custom） */
  accessPolicy?: string;
  /** 状态（0=是默认,1=否） */
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
}

export interface OssConfigResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** OSS配置ID */
  ossConfigId: number;
  /** 配置名称 */
  configKey: string;
  /** accessKey */
  accessKey: string;
  /** 秘钥secretKey */
  secretKey: string;
  /** 桶名称 */
  bucketName: string;
  /** 前缀 */
  prefix: string;
  /** 访问站点 */
  endpoint: string;
  /** 自定义域名 */
  domain: string;
  /** 是否https（Y=是,N=否） */
  isHttps: string;
  /** 域 */
  region: string;
  /** 桶权限类型 */
  accessPolicy: string;
  /** 状态（0=是默认,1=否） */
  status: StatusEnum;
  /** 扩展字段 */
  ext1: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface OssConfigListResponseDto {
  /** OSS配置列表 */
  rows: OssConfigResponseDto[];
  /** 总数量 */
  total: number;
}

export interface UpdateOssConfigRequestDto {
  /** OSS配置ID */
  ossConfigId: number;
  /** 配置名称 */
  configKey?: string;
  /** accessKey */
  accessKey?: string;
  /** 秘钥secretKey */
  secretKey?: string;
  /** 桶名称 */
  bucketName?: string;
  /** 前缀 */
  prefix?: string;
  /** 访问站点 */
  endpoint?: string;
  /** 自定义域名 */
  domain?: string;
  /** 是否https（Y=是,N=否） */
  isHttps?: string;
  /** 域 */
  region?: string;
  /** 桶权限类型（0=private,1=public,2=custom） */
  accessPolicy?: string;
  /** 状态（0=是默认,1=否） */
  status?: StatusEnum;
  /** 备注 */
  remark?: string;
}

export interface ChangeOssConfigStatusRequestDto {
  /** OSS配置ID */
  ossConfigId: number;
  /** 状态（0=是默认,1=否） */
  status: StatusEnum;
}

export interface OssResponseDto {
  /** 创建者 */
  createBy?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新者 */
  updateBy?: string;
  /** 更新时间 */
  updateTime?: string;
  /** 备注 */
  remark?: string;
  /** 对象存储主键 */
  ossId: number;
  /** 文件名 */
  fileName: string;
  /** 原名 */
  originalName: string;
  /** 文件后缀名 */
  fileSuffix: string;
  /** URL地址 */
  url: string;
  /** 文件大小（字节） */
  size: number;
  /** 服务商 */
  service: string;
  /** 删除标记 - 不返回给前端 */
  delFlag?: string;
  /** 租户ID - 不返回给前端 */
  tenantId?: number;
  /** 密码 - 不返回给前端 */
  password?: string;
}

export interface OssListResponseDto {
  /** OSS文件列表 */
  rows: OssResponseDto[];
  /** 总数量 */
  total: number;
}
