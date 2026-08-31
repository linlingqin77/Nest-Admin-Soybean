import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/shared/dto/index';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class ListDictTypeRequestDto extends PageQueryDto {
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
