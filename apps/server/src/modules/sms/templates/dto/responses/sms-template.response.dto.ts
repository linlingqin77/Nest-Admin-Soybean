import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';

/**
 * 短信模板响应 DTO
 */
export class SmsTemplateResponseDto extends BaseResponseDto {
  @ApiProperty({ description: '模板ID' })
  @Expose()
  id: number;

  @ApiProperty({ description: '模板编码' })
  @Expose()
  code: string;

  @ApiProperty({ description: '模板名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '渠道ID' })
  @Expose()
  channelId: number;

  @ApiPropertyOptional({ description: '渠道编码' })
  @Expose()
  channelCode?: string;

  @ApiPropertyOptional({ description: '渠道名称' })
  @Expose()
  channelName?: string;

  @ApiProperty({ description: '模板类型' })
  @Expose()
  type: number;

  @ApiProperty({ description: '模板内容' })
  @Expose()
  content: string;

  @ApiPropertyOptional({ description: '参数列表' })
  @Expose()
  params?: string;

  @ApiPropertyOptional({ description: 'API模板ID' })
  @Expose()
  apiTemplateId?: string;

  @ApiProperty({ description: '状态' })
  @Expose()
  status: string;

  @ApiPropertyOptional({ description: '备注' })
  @Expose()
  remark?: string;
}
