import { IsString, IsEnum, Length, IsOptional, IsInt, Min, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema, DeviceTypeEnum, DeviceTypeEnumSchema } from 'src/shared/enums';

export class CreateClientRequestDto {
  @ApiProperty({ required: true, description: '客户端key' })
  @IsString()
  @Length(1, 64)
  clientKey: string;

  @ApiProperty({ required: true, description: '客户端秘钥' })
  @IsString()
  @Length(1, 255)
  clientSecret: string;

  @ApiProperty({ required: false, description: '授权类型列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  grantTypeList?: string[];

  @ApiProperty({
    enum: DeviceTypeEnum,
    enumName: 'DeviceTypeEnum',
    enumSchema: DeviceTypeEnumSchema,
    required: false,
    description: '设备类型',
  })
  @IsOptional()
  @IsString()
  @IsEnum(DeviceTypeEnum)
  deviceType?: string;

  @ApiProperty({ required: false, description: 'token活跃超时时间（秒）', default: 1800 })
  @IsOptional()
  @IsInt()
  @Min(0)
  activeTimeout?: number;

  @ApiProperty({ required: false, description: 'token固定超时时间（秒）', default: 86400 })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeout?: number;

  @ApiProperty({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    required: false,
    description: '状态',
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;
}
