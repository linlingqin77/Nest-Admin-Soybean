import { IsString, IsNumber, IsEnum, Length, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';
import { Type } from 'class-transformer';

/**
 * 短信模板类型枚举
 */
export enum SmsTemplateTypeEnum {
  VERIFICATION = 1, // 验证码
  NOTIFICATION = 2, // 通知
  MARKETING = 3, // 营销
}

export class CreateSmsTemplateRequestDto {
  @ApiProperty({ description: '渠道ID', example: 1 })
  @IsNumber()
  @Type(() => Number)
  channelId: number;

  @ApiProperty({ description: '模板编码', example: 'SMS_LOGIN_CODE' })
  @IsString()
  @Length(1, 100)
  code: string;

  @ApiProperty({ description: '模板名称', example: '登录验证码' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: '模板内容', example: '您的验证码是${code}，有效期${time}分钟。' })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: '参数列表（JSON数组）',
    example: '["code", "time"]',
    type: String,
  })
  @IsOptional()
  @IsString()
  params?: string;

  @ApiProperty({ description: '第三方模板ID', example: 'SMS_123456789' })
  @IsString()
  @Length(1, 100)
  apiTemplateId: string;

  @ApiProperty({
    description: '模板类型（1-验证码 2-通知 3-营销）',
    enum: SmsTemplateTypeEnum,
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  @IsEnum(SmsTemplateTypeEnum)
  type: number;

  @ApiPropertyOptional({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    description: '状态（0-禁用 1-启用）',
    default: '0',
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;
}
