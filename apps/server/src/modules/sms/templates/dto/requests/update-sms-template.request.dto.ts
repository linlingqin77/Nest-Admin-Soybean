import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateSmsTemplateRequestDto } from './create-sms-template.request.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateSmsTemplateRequestDto extends PartialType(CreateSmsTemplateRequestDto) {
  @ApiProperty({ description: '模板ID', example: 1 })
  @IsNumber()
  id: number;
}
