import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoveFileRequestDto {
  @ApiProperty({ required: true, description: '文件ID列表', type: [String] })
  @IsString({ each: true })
  uploadIds: string[];

  @ApiProperty({ required: true, description: '目标文件夹ID' })
  @IsNumber()
  targetFolderId: number;
}
