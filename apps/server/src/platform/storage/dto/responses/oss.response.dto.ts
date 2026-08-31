import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';

/**
 * OSS文件响应 DTO
 */
export class OssResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '对象存储主键' })
  ossId: bigint;

  @Expose()
  @ApiProperty({ description: '文件名' })
  fileName: string;

  @Expose()
  @ApiProperty({ description: '原名' })
  originalName: string;

  @Expose()
  @ApiProperty({ description: '文件后缀名' })
  fileSuffix: string;

  @Expose()
  @ApiProperty({ description: 'URL地址' })
  url: string;

  @Expose()
  @ApiProperty({ description: '文件大小（字节）' })
  size: bigint;

  @Expose()
  @ApiProperty({ description: '服务商' })
  service: string;
}

/**
 * OSS文件列表响应 DTO
 */
export class OssListResponseDto {
  @ApiProperty({ description: 'OSS文件列表', type: [OssResponseDto] })
  rows: OssResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}
