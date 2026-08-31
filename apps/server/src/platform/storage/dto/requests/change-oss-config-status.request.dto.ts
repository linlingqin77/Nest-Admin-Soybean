import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class ChangeOssConfigStatusDto {
  @ApiProperty({ description: '配置ID' })
  @IsString()
  configId: string;

  @ApiProperty({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    description: '状态（0=是默认,1=否）',
  })
  @IsString()
  @IsEnum(StatusEnum)
  status: string;
}
