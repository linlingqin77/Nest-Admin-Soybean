import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShareRequestDto {
  @ApiProperty({ required: true, description: '文件ID' })
  @IsString()
  uploadId: string;

  @ApiProperty({ required: false, description: '分享码（6位，不填则无需密码）' })
  @IsOptional()
  @IsString()
  shareCode?: string;

  @ApiProperty({ required: false, description: '过期时间（小时，-1 永久有效）' })
  @IsOptional()
  @IsNumber()
  expireHours?: number;

  @ApiProperty({ required: false, description: '最大下载次数（-1 不限）' })
  @IsOptional()
  @IsNumber()
  maxDownload?: number;
}
