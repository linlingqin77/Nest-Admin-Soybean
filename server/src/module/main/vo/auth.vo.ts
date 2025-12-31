import { ApiProperty } from '@nestjs/swagger';

/**
 * 登录令牌响应 VO - 匹配 Soybean 前端
 */
export class LoginTokenVo {
  @ApiProperty({ description: '授权令牌' })
  access_token: string;

  @ApiProperty({ description: '刷新令牌' })
  refresh_token?: string;

  @ApiProperty({ description: '令牌有效期(秒)' })
  expire_in: number;

  @ApiProperty({ description: '刷新令牌有效期(秒)' })
  refresh_expire_in?: number;

  @ApiProperty({ description: '客户端ID' })
  client_id?: string;

  @ApiProperty({ description: '令牌权限' })
  scope?: string;

  @ApiProperty({ description: '用户openid' })
  openid?: string;
}

/**
 * 验证码响应 VO
 */
export class CaptchaCodeVo {
  @ApiProperty({ description: '是否开启验证码' })
  captchaEnabled: boolean;

  @ApiProperty({ description: '验证码唯一标识' })
  uuid?: string;

  @ApiProperty({ description: '验证码图片(Base64)' })
  img?: string;
}

/**
 * 租户信息 VO
 */
export class TenantVo {
  @ApiProperty({ description: '租户ID' })
  tenantId: string;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '域名' })
  domain?: string;
}

/**
 * 租户列表响应 VO
 */
export class LoginTenantVo {
  @ApiProperty({ description: '是否开启租户' })
  tenantEnabled: boolean;

  @ApiProperty({ description: '租户列表', type: [TenantVo] })
  voList: TenantVo[];
}

/**
 * 部门信息类型
 */
interface DeptInfo {
  deptId?: number;
  deptName?: string;
  leader?: string;
}

/**
 * 角色信息类型
 */
interface RoleInfo {
  roleId?: number;
  roleKey?: string;
  roleName?: string;
}

/**
 * 用户信息响应 VO - 匹配 Soybean 前端
 */
export class UserInfoVo {
  @ApiProperty({ description: '用户信息' })
  user: {
    userId: number;
    userName: string;
    nickName: string;
    email?: string;
    phonenumber?: string;
    sex?: string;
    avatar?: string;
    status: string;
    deptId?: number;
    tenantId?: string;
    dept?: DeptInfo;
    roles?: RoleInfo[];
  };

  @ApiProperty({ description: '角色标识列表' })
  roles: string[];

  @ApiProperty({ description: '权限标识列表' })
  permissions: string[];
}
