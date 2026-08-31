import { IsString, IsEnum, Length, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class CreateDictDataRequestDto {
  @ApiProperty({ required: true, description: '字典类型' })
  @IsString()
  @Length(0, 100)
  dictType: string;

  @ApiProperty({ required: true, description: '字典标签' })
  @IsString()
  @Length(0, 100)
  dictLabel: string;

  @ApiProperty({ required: true, description: '字典键值' })
  @IsString()
  @Length(0, 100)
  dictValue: string;

  @ApiProperty({ required: true, description: '样式属性' })
  @IsString()
  @Length(0, 100)
  listClass: string;

  @ApiProperty({ required: false, description: 'CSS样式' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  cssClass?: string;

  @ApiProperty({ required: false, description: '字典排序' })
  @IsOptional()
  @IsNumber()
  dictSort?: number;

  @ApiProperty({ required: false, description: '备注' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;

  @ApiProperty({ enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema, required: false })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;
}
