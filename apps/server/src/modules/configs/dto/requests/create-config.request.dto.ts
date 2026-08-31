import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema, ConfigTypeEnum, ConfigTypeEnumSchema } from 'src/shared/enums';

export class CreateConfigRequestDto {
  @ApiProperty({ required: true, description: '参数名称' })
  @IsString()
  @Length(0, 100)
  configName: string;

  @ApiProperty({ required: true, description: '参数键值' })
  @IsString()
  @Length(0, 500)
  configValue: string;

  @ApiProperty({ required: true, description: '参数键名' })
  @IsString()
  @Length(0, 100)
  configKey: string;

  @ApiProperty({ enum: ConfigTypeEnum, enumName: 'ConfigTypeEnum', enumSchema: ConfigTypeEnumSchema, required: true })
  @IsString()
  @IsEnum(ConfigTypeEnum)
  configType: string;

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
