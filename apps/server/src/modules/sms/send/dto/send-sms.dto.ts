import { IsString, IsObject, Length, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendSmsDto {
  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  @Length(11, 11)
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  mobile: string;

  @ApiProperty({ description: '模板编码', example: 'SMS_LOGIN_CODE' })
  @IsString()
  @Length(1, 100)
  templateCode: string;

  @ApiPropertyOptional({
    description: '模板参数',
    example: { code: '123456', time: '5' },
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, string>;
}

export class BatchSendSmsDto {
  @ApiProperty({
    description: '手机号列表',
    example: ['13800138000', '13800138001'],
    type: [String],
  })
  @IsString({ each: true })
  mobiles: string[];

  @ApiProperty({ description: '模板编码', example: 'SMS_LOGIN_CODE' })
  @IsString()
  @Length(1, 100)
  templateCode: string;

  @ApiPropertyOptional({
    description: '模板参数',
    example: { code: '123456', time: '5' },
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, string>;
}
