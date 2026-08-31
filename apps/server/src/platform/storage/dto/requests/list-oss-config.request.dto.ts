import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/shared/dto/index';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class ListOssConfigRequestDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '配置名称' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  configKey?: string;

  @ApiProperty({ required: false, description: '桶名称' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  bucketName?: string;

  @ApiProperty({ required: false, description: '域' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  region?: string;

  @ApiProperty({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    required: false,
    description: '状态（0=是默认,1=否）',
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;
}
