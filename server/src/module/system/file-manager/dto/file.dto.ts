import { IsString, IsNumber, IsOptional, IsEnum, IsInt, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ListFileDto {
  @ApiProperty({ required: false, description: '文件夹ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  folderId?: number;

  @ApiProperty({ required: false, description: '文件名' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiProperty({ required: false, description: '文件类型（扩展名）' })
  @IsOptional()
  @IsString()
  ext?: string;

  @ApiProperty({ required: false, description: '文件类型列表（扩展名，逗号分隔，用于批量筛选）' })
  @IsOptional()
  @IsString()
  exts?: string;

  @ApiProperty({ required: false, description: '存储类型' })
  @IsOptional()
  @IsString()
  storageType?: string;

  @ApiProperty({ required: false, description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageNum?: number;

  @ApiProperty({ required: false, description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
}

export class MoveFileDto {
  @ApiProperty({ required: true, description: '文件ID列表', type: [String] })
  @IsArray()
  @IsString({ each: true })
  uploadIds: string[];

  @ApiProperty({ required: true, description: '目标文件夹ID' })
  @IsInt()
  targetFolderId: number;
}

export class RenameFileDto {
  @ApiProperty({ required: true, description: '文件ID' })
  @IsString()
  uploadId: string;

  @ApiProperty({ required: true, description: '新文件名' })
  @IsString()
  newFileName: string;
}

export class CreateShareDto {
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

export class GetShareDto {
  @ApiProperty({ required: true, description: '分享ID' })
  @IsString()
  shareId: string;

  @ApiProperty({ required: false, description: '分享码' })
  @IsOptional()
  @IsString()
  shareCode?: string;
}
