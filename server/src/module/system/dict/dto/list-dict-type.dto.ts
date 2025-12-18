import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/common/dto/index';
import { StatusEnum, StatusEnumSchema } from 'src/common/enum';

export class ListDictType extends PageQueryDto {
  @ApiProperty({ required: false, description: '字典名称' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  dictName?: string;

  @ApiProperty({ required: false, description: '字典类型' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  dictType?: string;

  @ApiProperty({ enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema, required: false })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;
}
