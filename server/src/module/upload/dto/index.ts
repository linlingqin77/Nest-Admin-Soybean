import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Type for uploaded file from multer
 */
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

export class FileUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', description: '上传文件' })
  file: UploadedFile;

  @ApiProperty({ required: false, description: '文件夹ID', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  folderId?: number;
}

export class UploadIdDto {
  @ApiProperty({ type: 'string', description: '上传标识ID' })
  uploadId: string;
}
export class ChunkFileDto {
  @ApiProperty({ type: 'string', description: '分片索引' })
  index: number;
  @ApiProperty({ type: 'string', description: '总分片数' })
  totalChunks: number;
  @ApiProperty({ type: 'string', description: '上传标识ID' })
  uploadId: string;
  @ApiProperty({ type: 'string', description: '文件名称' })
  fileName: string;

  @ApiProperty({ required: false, description: '文件夹ID', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  folderId?: number;
}

export class ChunkMergeFileDto {
  @ApiProperty({ type: 'string', description: '上传标识ID' })
  uploadId: string;
  @ApiProperty({ type: 'string', description: '文件名称' })
  fileName: string;

  @ApiProperty({ required: false, description: '文件夹ID', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  folderId?: number;
}
