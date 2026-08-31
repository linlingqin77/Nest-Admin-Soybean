import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateNotifyTemplateRequestDto } from './create-notify-template.request.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateNotifyTemplateRequestDto extends PartialType(CreateNotifyTemplateRequestDto) {
  @ApiProperty({ description: '模板ID', example: 1 })
  @IsNumber()
  id: number;
}
