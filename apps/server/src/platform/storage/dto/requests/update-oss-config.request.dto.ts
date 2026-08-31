import { IsString, IsEnum, Length, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema, YesNo } from 'src/shared/enums';

export class UpdateOssConfigRequestDto {
  @ApiProperty({ required: true, description: 'OSS配置ID' })
  @IsInt()
  ossConfigId: number;

  @ApiProperty({ required: false, description: '配置名称' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  configKey?: string;

  @ApiProperty({ required: false, description: 'accessKey' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  accessKey?: string;

  @ApiProperty({ required: false, description: '秘钥secretKey' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  secretKey?: string;

  @ApiProperty({ required: false, description: '桶名称' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  bucketName?: string;

  @ApiProperty({ required: false, description: '前缀' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  prefix?: string;

  @ApiProperty({ required: false, description: '访问站点' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  endpoint?: string;

  @ApiProperty({ required: false, description: '自定义域名' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  domain?: string;

  @ApiProperty({ required: false, description: '是否https（Y=是,N=否）' })
  @IsOptional()
  @IsString()
  @IsEnum(YesNo)
  isHttps?: string;

  @ApiProperty({ required: false, description: '域' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  region?: string;

  @ApiProperty({ required: false, description: '桶权限类型（0=private,1=public,2=custom）' })
  @IsOptional()
  @IsString()
  accessPolicy?: string;

  @ApiProperty({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    required: false,
    description: '状态（0=是默认,1=否）',
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiProperty({ required: false, description: '备注' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;
}

export class ChangeOssConfigStatusRequestDto {
  @ApiProperty({ required: true, description: 'OSS配置ID' })
  @IsInt()
  ossConfigId: number;

  @ApiProperty({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    required: true,
    description: '状态（0=是默认,1=否）',
  })
  @IsString()
  @IsEnum(StatusEnum)
  status: string;
}
