import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TenantContext } from 'src/core/tenancy/context/tenant.context';

/**
 * 登录请求 DTO - 匹配 Soybean 前端
 */
export class AuthLoginRequestDto {
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
  rememberMe?: boolean;
}
