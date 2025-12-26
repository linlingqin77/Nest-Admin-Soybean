import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/common/validators/password.validator';
import { TenantContext } from 'src/common/tenant/tenant.context';

/**
 * 登录请求 DTO - 匹配 Soybean 前端
 */
export class AuthLoginDto {
  @ApiProperty({ description: '租户ID', required: false, default: TenantContext.SUPER_TENANT_ID })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ description: '用户名', required: true })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密码', required: true })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  password: string;

  @ApiProperty({ description: '验证码', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ description: '验证码唯一标识', required: false })
  @IsOptional()
  @IsString()
  uuid?: string;

  @ApiProperty({ description: '客户端ID', required: false, default: 'pc' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: '授权类型', required: false, default: 'password' })
  @IsOptional()
  @IsString()
  grantType?: string;

  @ApiProperty({ description: '记住我', required: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

/**
 * 注册请求 DTO
 */
export class AuthRegisterDto {
  @ApiProperty({ description: '租户ID', required: false, default: TenantContext.SUPER_TENANT_ID })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ description: '用户名', required: true })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  username: string;

  @ApiProperty({ description: '密码', required: true })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @IsStrongPassword()
  @MinLength(5)
  @MaxLength(20)
  password: string;

  @ApiProperty({ description: '确认密码', required: true })
  @IsNotEmpty({ message: '确认密码不能为空' })
  @IsString()
  confirmPassword: string;

  @ApiProperty({ description: '验证码', required: true })
  @IsNotEmpty({ message: '验证码不能为空' })
  @IsString()
  code: string;

  @ApiProperty({ description: '验证码唯一标识', required: true })
  @IsNotEmpty({ message: 'uuid不能为空' })
  @IsString()
  uuid: string;

  @ApiProperty({ description: '用户类型', required: false })
  @IsOptional()
  @IsString()
  userType?: string;
}

/**
 * 社交登录 DTO
 */
export class SocialLoginDto {
  @ApiProperty({ description: '租户ID', required: false })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ description: '社交平台来源', required: true })
  @IsNotEmpty()
  @IsString()
  source: string;

  @ApiProperty({ description: '社交平台授权码', required: true })
  @IsNotEmpty()
  @IsString()
  socialCode: string;

  @ApiProperty({ description: '社交平台状态码', required: false })
  @IsOptional()
  @IsString()
  socialState?: string;

  @ApiProperty({ description: '客户端ID', required: false })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ description: '授权类型', required: false })
  @IsOptional()
  @IsString()
  grantType?: string;
}
