import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/common/dto/index';
import { NoticeTypeEnum, NoticeTypeEnumSchema } from 'src/common/enum';

export class ListNoticeDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '公告标题' })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  noticeTitle?: string;

  @ApiProperty({ enum: NoticeTypeEnum, enumName: 'NoticeTypeEnum', enumSchema: NoticeTypeEnumSchema, required: false })
  @IsOptional()
  @IsString()
  @IsEnum(NoticeTypeEnum)
  noticeType?: string;

  @ApiProperty({ required: false, description: '创建人' })
  @IsOptional()
  @IsString()
  createBy?: string;
}
