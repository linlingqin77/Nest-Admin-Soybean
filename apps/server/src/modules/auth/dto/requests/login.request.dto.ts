import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户登录请求 DTO
 *
 * @description 用于用户登录的请求参数
 * @example
 * ```json
 * {
 *   "userName": "admin",
 *   "password": "admin123",
 *   "code": "1234",
 *   "uuid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 * }
 * ```
 */
export class LoginRequestDto {
  @ApiProperty({
    required: false,
    description: '验证码（4位数字）',
    example: '1234',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    required: true,
    description: '用户名',
    example: 'admin',
    minLength: 2,
    maxLength: 10,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  userName: string;

  @ApiProperty({
    required: true,
    description: '密码',
    example: 'admin123',
    minLength: 5,
    maxLength: 20,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  password: string;

  @ApiProperty({
    required: false,
    description: '验证码唯一标识（获取验证码时返回）',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsString()
  uuid?: string;
}
