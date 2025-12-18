import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/common/dto/index';
import { StatusEnum } from 'src/common/enum';

export class ListDictData extends PageQueryDto {
  @ApiProperty({ required: false, description: '字典标签' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  dictLabel?: string;

  @ApiProperty({ required: false, description: '字典类型' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  dictType?: string;

  @ApiProperty({ required: false, description: '状态（0正常 1停用）' })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;
}
