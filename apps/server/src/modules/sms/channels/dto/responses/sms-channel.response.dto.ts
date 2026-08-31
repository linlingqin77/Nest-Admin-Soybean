import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';

/**
 * 短信渠道响应 DTO
 */
export class SmsChannelResponseDto extends BaseResponseDto {
  @ApiProperty({ description: '渠道ID' })
  @Expose()
  id: number;

  @ApiProperty({ description: '渠道编码' })
  @Expose()
  code: string;

  @ApiProperty({ description: '渠道名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '签名' })
  @Expose()
  signature: string;

  @ApiPropertyOptional({ description: 'API Key' })
  @Expose()
  apiKey?: string;

  @Exclude()
  apiSecret?: string;

  @ApiPropertyOptional({ description: '回调URL' })
  @Expose()
  callbackUrl?: string;

  @ApiProperty({ description: '状态' })
  @Expose()
  status: string;

  @ApiPropertyOptional({ description: '备注' })
  @Expose()
  remark?: string;
}
