import { IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/shared/dto/index';

export class ListOssRequestDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '文件名' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  fileName?: string;

  @ApiProperty({ required: false, description: '原名' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  originalName?: string;

  @ApiProperty({ required: false, description: '文件后缀名' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  fileSuffix?: string;

  @ApiProperty({ required: false, description: '服务商' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  service?: string;
}
