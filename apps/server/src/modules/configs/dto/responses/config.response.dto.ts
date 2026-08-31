import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';
import { ConfigTypeEnum, ConfigTypeEnumSchema } from 'src/shared/enums';

/**
 * 系统配置响应 DTO
 */
export class ConfigResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '参数配置ID' })
  configId: number;

  @Expose()
  @ApiProperty({ description: '参数名称' })
  configName: string;

  @Expose()
  @ApiProperty({ description: '参数键名' })
  configKey: string;

  @Expose()
  @ApiProperty({ description: '参数键值' })
  configValue: string;

  @Expose()
  @ApiProperty({
    description: '系统内置',
    enum: ConfigTypeEnum,
    enumName: 'ConfigTypeEnum',
    enumSchema: ConfigTypeEnumSchema,
  })
  configType: string;
}

/**
 * 系统配置列表响应 DTO
 */
export class ConfigListResponseDto {
  @ApiProperty({ description: '配置列表', type: [ConfigResponseDto] })
  rows: ConfigResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

/**
 * 配置值响应 DTO
 */
export class ConfigValueResponseDto {
  @Expose()
  @ApiProperty({ description: '配置值' })
  configValue: string;
}
