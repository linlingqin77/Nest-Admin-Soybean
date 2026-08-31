import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateNoticeRequestDto } from './create-notice.request.dto';

export class UpdateNoticeRequestDto extends CreateNoticeRequestDto {
  @ApiProperty({ required: true, description: '公告ID' })
  @IsNumber()
  noticeId: number;
}
