import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * 登录令牌响应 DTO - 匹配 Soybean 前端
 */
export class LoginTokenResponseDto {
  @Expose()
  @ApiProperty({ description: '授权令牌' })
  access_token: string;

  @Expose()
  @ApiProperty({ description: '刷新令牌' })
  refresh_token?: string;

  @Expose()
  @ApiProperty({ description: '令牌有效期(秒)' })
  expire_in: number;

  @Expose()
  @ApiProperty({ description: '刷新令牌有效期(秒)' })
  refresh_expire_in?: number;

  @Expose()
  @ApiProperty({ description: '客户端ID' })
  client_id?: string;

  @Expose()
  @ApiProperty({ description: '令牌权限' })
  scope?: string;

  @Expose()
  @ApiProperty({ description: '用户openid' })
  openid?: string;
}

/**
 * 公钥响应 DTO
 */
export class PublicKeyResponseDto {
  @Expose()
  @ApiProperty({ description: 'RSA公钥', example: '-----BEGIN PUBLIC KEY-----...' })
  publicKey: string;
}

/**
 * 认证注册结果响应 DTO
 */
export class AuthRegisterResultResponseDto {
  @Expose()
  @ApiProperty({ description: '注册是否成功', example: true })
  success: boolean;

  @Expose()
  @ApiProperty({ description: '提示消息', example: '注册成功', required: false })
  message?: string;
}

/**
 * 认证退出登录响应 DTO
 */
export class AuthLogoutResponseDto {
  @Expose()
  @ApiProperty({ description: '退出是否成功', example: true })
  success: boolean;
}

/**
 * 社交登录回调响应 DTO
 */
export class SocialCallbackResponseDto {
  @Expose()
  @ApiProperty({ description: '登录是否成功', example: false })
  success: boolean;

  @Expose()
  @ApiProperty({ description: '错误消息', example: '社交登录功能暂未实现', required: false })
  message?: string;
}

/**
 * 部门信息类型
 */
class DeptInfoDto {
  @Expose()
  @ApiProperty({ description: '部门ID' })
  deptId?: number;

  @Expose()
  @ApiProperty({ description: '部门名称' })
  deptName?: string;

  @Expose()
  @ApiProperty({ description: '部门负责人' })
  leader?: string;
}

/**
 * 角色信息类型
 */
class RoleInfoDto {
  @Expose()
  @ApiProperty({ description: '角色ID' })
  roleId?: number;

  @Expose()
  @ApiProperty({ description: '角色标识' })
  roleKey?: string;

  @Expose()
  @ApiProperty({ description: '角色名称' })
  roleName?: string;
}

/**
 * 用户详情 DTO
 */
class UserDetailDto {
  @Expose()
  @ApiProperty({ description: '用户ID' })
  userId: number;

  @Expose()
  @ApiProperty({ description: '用户名' })
  userName: string;

  @Expose()
  @ApiProperty({ description: '昵称' })
  nickName: string;

  @Expose()
  @ApiProperty({ description: '邮箱' })
  email?: string;

  @Expose()
  @ApiProperty({ description: '手机号' })
  phonenumber?: string;

  @Expose()
  @ApiProperty({ description: '性别' })
  sex?: string;

  @Expose()
  @ApiProperty({ description: '头像' })
  avatar?: string;

  @Expose()
  @ApiProperty({ description: '状态' })
  status: string;

  @Expose()
  @ApiProperty({ description: '部门ID' })
  deptId?: number;

  @Expose()
  @ApiProperty({ description: '租户ID' })
  tenantId?: string;

  @Expose()
  @ApiProperty({ description: '部门信息', type: DeptInfoDto })
  @Type(() => DeptInfoDto)
  dept?: DeptInfoDto;

  @Expose()
  @ApiProperty({ description: '角色列表', type: [RoleInfoDto] })
  @Type(() => RoleInfoDto)
  roles?: RoleInfoDto[];
}

/**
 * 用户信息响应 DTO - 匹配 Soybean 前端
 */
export class UserInfoResponseDto {
  @Expose()
  @ApiProperty({ description: '用户信息', type: UserDetailDto })
  @Type(() => UserDetailDto)
  user: UserDetailDto;

  @Expose()
  @ApiProperty({ description: '角色标识列表' })
  roles: string[];

  @Expose()
  @ApiProperty({ description: '权限标识列表' })
  permissions: string[];
}
