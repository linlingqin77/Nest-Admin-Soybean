import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class CreateDictTypeRequestDto {
  @ApiProperty({
    required: true,
    description: '字典名称',
  })
  @IsString()
  @Length(0, 100)
  dictName: string;

  @ApiProperty({
    required: true,
    description: '字典类型',
  })
  @IsString()
  @Length(0, 100)
  dictType: string;

  @ApiProperty({
    required: true,
    description: '备注',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;

  @ApiProperty({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;
}
