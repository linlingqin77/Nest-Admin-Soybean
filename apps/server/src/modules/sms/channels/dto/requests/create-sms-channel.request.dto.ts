import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

/**
 * 短信渠道编码枚举
 */
export enum SmsChannelCodeEnum {
  ALIYUN = 'aliyun',
  TENCENT = 'tencent',
  HUAWEI = 'huawei',
}

export class CreateSmsChannelRequestDto {
  @ApiProperty({
    description: '渠道编码',
    enum: SmsChannelCodeEnum,
    example: 'aliyun',
  })
  @IsString()
  @Length(1, 50)
  code: string;

  @ApiProperty({ description: '渠道名称', example: '阿里云短信' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: '短信签名', example: '若依管理系统' })
  @IsString()
  @Length(1, 100)
  signature: string;

  @ApiProperty({ description: 'API Key', example: 'LTAI5tXXXXXXXXXXXXXX' })
  @IsString()
  @Length(1, 255)
  apiKey: string;

  @ApiProperty({ description: 'API Secret', example: 'XXXXXXXXXXXXXXXXXXXXXXXX' })
  @IsString()
  @Length(1, 255)
  apiSecret: string;

  @ApiPropertyOptional({ description: '回调地址', example: 'https://example.com/callback' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  callbackUrl?: string;

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
