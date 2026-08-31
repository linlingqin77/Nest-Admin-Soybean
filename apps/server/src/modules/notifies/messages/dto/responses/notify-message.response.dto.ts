import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';
import { DateFormat } from 'src/shared/decorators';

/**
 * 站内信消息响应 DTO
 */
export class NotifyMessageResponseDto extends BaseResponseDto {
  @ApiProperty({ description: '消息ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: '用户ID' })
  @Expose()
  userId: number;

  @ApiProperty({ description: '用户类型' })
  @Expose()
  userType: number;

  @ApiProperty({ description: '模板ID' })
  @Expose()
  templateId: number;

  @ApiProperty({ description: '模板编码' })
  @Expose()
  templateCode: string;

  @ApiProperty({ description: '模板发送人名称' })
  @Expose()
  templateNickname: string;

  @ApiProperty({ description: '模板内容' })
  @Expose()
  templateContent: string;

  @ApiPropertyOptional({ description: '模板参数' })
  @Expose()
  templateParams?: string;

  @ApiProperty({ description: '是否已读' })
  @Expose()
  readStatus: boolean;

  @ApiPropertyOptional({ description: '阅读时间' })
  @Expose()
  @DateFormat()
  readTime?: string;
}

/**
 * 未读通知计数响应 DTO
 */
export class UnreadCountResponseDto {
  @ApiProperty({ description: '未读计数' })
  count: number;
}
