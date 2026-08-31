import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageQueryDto } from 'src/shared/dto/index';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';
import { Type } from 'class-transformer';
import { SmsTemplateTypeEnum } from './create-sms-template.request.dto';

export class ListSmsTemplateRequestDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '模板名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '模板编码' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: '渠道ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  channelId?: number;

  @ApiPropertyOptional({
    description: '模板类型',
    enum: SmsTemplateTypeEnum,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  type?: number;

  @ApiPropertyOptional({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    description: '状态',
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;
}
