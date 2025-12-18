import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/common/dto/index';
import { ConfigTypeEnum, ConfigTypeEnumSchema } from 'src/common/enum';

export class ListConfigDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '参数名称' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  configName?: string;

  @ApiProperty({ required: false, description: '参数键名' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  configKey?: string;

  @ApiProperty({ enum: ConfigTypeEnum, enumName: 'ConfigTypeEnum', enumSchema: ConfigTypeEnumSchema, required: false })
  @IsOptional()
  @IsString()
  @IsEnum(ConfigTypeEnum)
  configType?: string;
}
