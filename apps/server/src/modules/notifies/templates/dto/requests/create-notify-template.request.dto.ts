import { IsString, IsNumber, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class CreateNotifyTemplateRequestDto {
  @ApiProperty({ description: '模板名称', example: '系统通知' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ description: '模板编码', example: 'system_notify' })
  @IsString()
  @Length(1, 100)
  code: string;

  @ApiProperty({ description: '发送人名称', example: '系统管理员' })
  @IsString()
  @Length(1, 100)
  nickname: string;

  @ApiProperty({ description: '模板内容', example: '您有一条新的通知：${content}' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '参数列表（JSON数组）', example: '["content", "time"]' })
  @IsOptional()
  @IsString()
  params?: string;

  @ApiPropertyOptional({ description: '类型（1-系统通知 2-业务通知）', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  type?: number;

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
