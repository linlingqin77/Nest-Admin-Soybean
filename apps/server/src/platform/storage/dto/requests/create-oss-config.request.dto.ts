import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema, YesNo } from 'src/shared/enums';

export class CreateOssConfigRequestDto {
  @ApiProperty({ required: true, description: '配置名称' })
  @IsString()
  @Length(1, 100)
  configKey: string;

  @ApiProperty({ required: true, description: 'accessKey' })
  @IsString()
  @Length(1, 255)
  accessKey: string;

  @ApiProperty({ required: true, description: '秘钥secretKey' })
  @IsString()
  @Length(1, 255)
  secretKey: string;

  @ApiProperty({ required: true, description: '桶名称' })
  @IsString()
  @Length(1, 255)
  bucketName: string;

  @ApiProperty({ required: false, description: '前缀' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  prefix?: string;

  @ApiProperty({ required: true, description: '访问站点' })
  @IsString()
  @Length(1, 255)
  endpoint: string;

  @ApiProperty({ required: false, description: '自定义域名' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  domain?: string;

  @ApiProperty({ required: false, description: '是否https（Y=是,N=否）', default: 'N' })
  @IsOptional()
  @IsString()
  @IsEnum(YesNo)
  isHttps?: string;

  @ApiProperty({ required: false, description: '域' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  region?: string;

  @ApiProperty({ required: false, description: '桶权限类型（0=private,1=public,2=custom）', default: '1' })
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
