import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListFolderRequestDto {
  @ApiProperty({ required: false, description: '父文件夹ID' })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({ required: false, description: '文件夹名称' })
  @IsOptional()
  @IsString()
  folderName?: string;
}
