import { IsString, IsNumber, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFolderRequestDto {
  @ApiProperty({ required: false, description: '父文件夹ID', default: 0 })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({ required: true, description: '文件夹名称' })
  @IsString()
  @Length(1, 100)
  folderName: string;

  @ApiProperty({ required: false, description: '排序' })
  @IsOptional()
  @IsNumber()
  orderNum?: number;

  @ApiProperty({ required: false, description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}
