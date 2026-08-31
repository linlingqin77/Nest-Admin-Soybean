import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema, NoticeTypeEnum, NoticeTypeEnumSchema } from 'src/shared/enums';

export class CreateNoticeRequestDto {
  @ApiProperty({ required: true, description: '公告标题' })
  @IsString()
  @Length(0, 50)
  noticeTitle: string;

  @ApiProperty({ enum: NoticeTypeEnum, enumName: 'NoticeTypeEnum', enumSchema: NoticeTypeEnumSchema, required: true })
  @IsString()
  @IsEnum(NoticeTypeEnum)
  noticeType: string;

  @ApiProperty({
    required: true,
    description: '备注',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;

  @ApiProperty({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiProperty({ required: false, description: '公告内容' })
  @IsOptional()
  @IsString()
  noticeContent?: string;
}
