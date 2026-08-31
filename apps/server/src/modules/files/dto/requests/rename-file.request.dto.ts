import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RenameFileRequestDto {
  @ApiProperty({ required: true, description: '文件ID' })
  @IsString()
  uploadId: string;

  @ApiProperty({ required: true, description: '新文件名' })
  @IsString()
  newFileName: string;
}
