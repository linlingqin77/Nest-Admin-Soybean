import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateMailTemplateRequestDto } from './create-mail-template.request.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateMailTemplateRequestDto extends PartialType(CreateMailTemplateRequestDto) {
  @ApiProperty({ description: '模板ID', example: 1 })
  @IsNumber()
  id: number;
}
