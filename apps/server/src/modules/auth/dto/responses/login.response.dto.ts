import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * 登录响应 DTO
 *
 * @description 用户登录成功后返回的数据
 */
export class LoginResponseDto {
  @Expose()
  @ApiProperty({
    description: 'JWT访问令牌',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJOYW1lIjoiYWRtaW4iLCJpYXQiOjE3MDk4ODg4ODgsImV4cCI6MTcwOTk3NTI4OH0.xxxxx',
  })
  token: string;
}

/**
 * 退出登录响应 DTO
 *
 * @description 用户退出登录后返回的数据
 */
export class LogoutResponseDto {
  @Expose()
  @ApiProperty({ description: '退出是否成功', example: true })
  success: boolean;
}

/**
 * 注册结果响应 DTO
 *
 * @description 用户注册后返回的数据
 */
export class RegisterResultResponseDto {
  @Expose()
  @ApiProperty({ description: '注册是否成功', example: true })
  success: boolean;

  @Expose()
  @ApiProperty({ description: '提示消息', example: '注册成功', required: false })
  message?: string;
}

/**
 * 是否开启注册响应 DTO
 *
 * @description 查询系统是否开启用户注册功能
 */
export class RegisterEnabledResponseDto {
  @Expose()
  @ApiProperty({ description: '是否开启用户注册', example: true })
  enabled: boolean;
}
