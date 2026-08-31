import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class ChunkFileDto {
  @ApiProperty({ description: '上传ID' })
  @IsString()
  @IsNotEmpty()
  uploadId: string;

  @ApiProperty({ description: '文件名' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: '分片索引' })
  @IsNumber()
  index: number;
}

export class ChunkMergeFileDto {
  @ApiProperty({ description: '上传ID' })
  @IsString()
  @IsNotEmpty()
  uploadId: string;

  @ApiProperty({ description: '文件名' })
  @IsString()
  @IsNotEmpty()
  fileName: string;
}

export class FileUploadDto {
  @ApiProperty({ description: '文件夹ID' })
  @IsNumber()
  folderId?: number;

  @ApiProperty({ description: '文件' })
  file: any;
}

export class uploadIdDto {
  @ApiProperty({ description: '上传ID' })
  @IsString()
  @IsNotEmpty()
  uploadId: string;
}
