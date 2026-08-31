import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';

/**
 * 站内信模板响应 DTO
 */
export class NotifyTemplateResponseDto extends BaseResponseDto {
  @ApiProperty({ description: '模板ID' })
  @Expose()
  id: number;

  @ApiProperty({ description: '模板名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '模板编码' })
  @Expose()
  code: string;

  @ApiProperty({ description: '发送人名称' })
  @Expose()
  nickname: string;

  @ApiProperty({ description: '模板内容' })
  @Expose()
  content: string;

  @ApiProperty({ description: '模板类型' })
  @Expose()
  type: number;

  @ApiPropertyOptional({ description: '参数列表' })
  @Expose()
  params?: string;

  @ApiProperty({ description: '状态' })
  @Expose()
  status: string;

  @ApiPropertyOptional({ description: '备注' })
  @Expose()
  remark?: string;
}
