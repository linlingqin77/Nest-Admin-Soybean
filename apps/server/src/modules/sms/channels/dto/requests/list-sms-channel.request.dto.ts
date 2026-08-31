import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageQueryDto } from 'src/shared/dto/index';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class ListSmsChannelRequestDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '渠道名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '渠道编码' })
  @IsOptional()
  @IsString()
  code?: string;

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
