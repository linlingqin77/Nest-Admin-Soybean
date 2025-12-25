import { ApiProperty } from '@nestjs/swagger';
import { ConfigTypeEnum, ConfigTypeEnumSchema } from 'src/common/enum';

/**
 * 系统配置基础信息
 */
export class ConfigVo {
  @ApiProperty({ description: '参数配置ID' })
  configId: number;

  @ApiProperty({ description: '参数名称' })
  configName: string;

  @ApiProperty({ description: '参数键名' })
  configKey: string;

  @ApiProperty({ description: '参数键值' })
  configValue: string;

  @ApiProperty({
    description: '系统内置',
    enum: ConfigTypeEnum,
    enumName: 'ConfigTypeEnum',
    enumSchema: ConfigTypeEnumSchema,
  })
  configType: string;

  @ApiProperty({ description: '备注' })
  remark: string;

  @ApiProperty({ description: '创建时间' })
  createTime: Date;

  @ApiProperty({ description: '更新时间' })
  updateTime: Date;
}

/**
 * 系统配置列表响应
 */
export class ConfigListVo {
  @ApiProperty({ description: '配置列表', type: [ConfigVo] })
  rows: ConfigVo[];

  @ApiProperty({ description: '总数量' })
  total: number;
}
