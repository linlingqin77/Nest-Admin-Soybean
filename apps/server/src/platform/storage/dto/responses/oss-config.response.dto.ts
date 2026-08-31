import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

/**
 * OSS配置响应 DTO
 */
export class OssConfigResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: 'OSS配置ID' })
  ossConfigId: number;

  @Expose()
  @ApiProperty({ description: '配置名称' })
  configKey: string;

  @Expose()
  @ApiProperty({ description: 'accessKey' })
  accessKey: string;

  @Expose()
  @ApiProperty({ description: '秘钥secretKey' })
  secretKey: string;

  @Expose()
  @ApiProperty({ description: '桶名称' })
  bucketName: string;

  @Expose()
  @ApiProperty({ description: '前缀' })
  prefix: string;

  @Expose()
  @ApiProperty({ description: '访问站点' })
  endpoint: string;

  @Expose()
  @ApiProperty({ description: '自定义域名' })
  domain: string;

  @Expose()
  @ApiProperty({ description: '是否https（Y=是,N=否）' })
  isHttps: string;

  @Expose()
  @ApiProperty({ description: '域' })
  region: string;

  @Expose()
  @ApiProperty({ description: '桶权限类型' })
  accessPolicy: string;

  @Expose()
  @ApiProperty({
    description: '状态（0=是默认,1=否）',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  status: string;

  @Expose()
  @ApiProperty({ description: '扩展字段' })
  ext1: string;

  @Expose()
  @ApiProperty({ description: '备注' })
  remark: string;
}

/**
 * OSS配置列表响应 DTO
 */
export class OssConfigListResponseDto {
  @ApiProperty({ description: 'OSS配置列表', type: [OssConfigResponseDto] })
  rows: OssConfigResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}
