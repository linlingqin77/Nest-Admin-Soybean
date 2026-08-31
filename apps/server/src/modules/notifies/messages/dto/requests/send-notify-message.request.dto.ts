import { IsString, IsNumber, IsArray, IsOptional, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 发送站内信DTO（单发/群发）
 */
export class SendNotifyMessageRequestDto {
  @ApiProperty({ description: '接收用户ID列表', example: [1, 2, 3] })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  userIds: number[];

  @ApiProperty({ description: '模板编码', example: 'system_notify' })
  @IsString()
  templateCode: string;

  @ApiPropertyOptional({ description: '模板参数', example: { content: '系统升级通知' } })
  @IsOptional()
  params?: Record<string, string>;
}

/**
 * 发送站内信给所有用户DTO
 */
export class SendNotifyAllRequestDto {
  @ApiProperty({ description: '模板编码', example: 'system_notify' })
  @IsString()
  templateCode: string;

  @ApiPropertyOptional({ description: '模板参数', example: { content: '系统升级通知' } })
  @IsOptional()
  params?: Record<string, string>;
}
