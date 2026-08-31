import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * 验证码响应 DTO
 *
 * @description 获取验证码接口返回的数据
 */
export class CaptchaResponseDto {
  @Expose()
  @ApiProperty({ description: '是否开启验证码', example: true })
  captchaEnabled: boolean;

  @Expose()
  @ApiProperty({ description: '验证码唯一标识', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  uuid: string;

  @Expose()
  @ApiProperty({ description: '验证码图片Base64', example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...' })
  img: string;
}

/**
 * 验证码响应 DTO (Auth 模块)
 *
 * @description Auth 模块获取验证码接口返回的数据
 */
export class CaptchaCodeResponseDto {
  @Expose()
  @ApiProperty({ description: '是否开启验证码', example: true })
  captchaEnabled: boolean;

  @Expose()
  @ApiProperty({ description: '验证码唯一标识', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  uuid?: string;

  @Expose()
  @ApiProperty({
    description: '验证码图片(Base64)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    required: false,
  })
  img?: string;
}
