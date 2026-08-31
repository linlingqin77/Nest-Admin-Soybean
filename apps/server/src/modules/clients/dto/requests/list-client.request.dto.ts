import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/shared/dto/index';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class ListClientRequestDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '客户端key' })
  @IsOptional()
  @IsString()
  @Length(0, 64)
  clientKey?: string;

  @ApiProperty({ required: false, description: '客户端秘钥' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  clientSecret?: string;

  @ApiProperty({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    required: false,
    description: '状态',
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;
}
