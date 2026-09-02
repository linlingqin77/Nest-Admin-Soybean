import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/shared/validators/password.validator';
import { TenantContext } from 'src/core/tenancy/context/tenant.context';

/**
 * 注册请求 DTO
 */
export class AuthRegisterRequestDto {
  @ApiProperty({ description: '租户ID', required: false, default: TenantContext.SUPER_TENANT_ID })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ description: '用户名', required: true })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  username!: string;

  @ApiProperty({ description: '密码', required: true })
  @IsNotEmpty({ message: '密码不能为空' })
  @IsString()
  @IsStrongPassword()
  @MinLength(5)
  @MaxLength(20)
  password!: string;

  @ApiProperty({ description: '确认密码', required: true })
  @IsNotEmpty({ message: '确认密码不能为空' })
  @IsString()
  confirmPassword!: string;

  @ApiProperty({ description: '验证码', required: true })
  @IsNotEmpty({ message: '验证码不能为空' })
  @IsString()
  code!: string;

  @ApiProperty({ description: '验证码唯一标识', required: true })
  @IsNotEmpty({ message: 'uuid不能为空' })
  @IsString()
  uuid!: string;

  @ApiProperty({ description: '用户类型', required: false })
  @IsOptional()
  @IsString()
  userType?: string;
}
