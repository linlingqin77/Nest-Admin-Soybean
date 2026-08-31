import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';
import { StatusEnum, StatusEnumSchema, DeviceTypeEnum, DeviceTypeEnumSchema } from 'src/shared/enums';

/**
 * 客户端响应 DTO
 */
export class ClientResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '客户端ID' })
  id: number;

  @Expose()
  @ApiProperty({ description: '客户端唯一标识' })
  clientId: string;

  @Expose()
  @ApiProperty({ description: '客户端key' })
  clientKey: string;

  @Expose()
  @ApiProperty({ description: '客户端秘钥' })
  clientSecret: string;

  @Expose()
  @ApiProperty({ description: '授权类型列表（逗号分隔）' })
  grantTypeList: string;

  @Expose()
  @Transform(({ value }) => (value ? value.split(',') : []))
  @ApiProperty({ description: '授权类型数组', type: [String] })
  grantTypeArray: string[];

  @Expose()
  @ApiProperty({
    description: '设备类型',
    enum: DeviceTypeEnum,
    enumName: 'DeviceTypeEnum',
    enumSchema: DeviceTypeEnumSchema,
  })
  deviceType: string;

  @Expose()
  @ApiProperty({ description: 'token活跃超时时间（秒）' })
  activeTimeout: number;

  @Expose()
  @ApiProperty({ description: 'token固定超时时间（秒）' })
  timeout: number;

  @Expose()
  @ApiProperty({
    description: '状态',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  status: string;
}

/**
 * 客户端列表响应 DTO
 */
export class ClientListResponseDto {
  @ApiProperty({ description: '客户端列表', type: [ClientResponseDto] })
  rows: ClientResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}
