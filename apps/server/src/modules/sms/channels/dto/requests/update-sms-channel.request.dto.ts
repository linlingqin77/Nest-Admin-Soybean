import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateSmsChannelRequestDto } from './create-sms-channel.request.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateSmsChannelRequestDto extends PartialType(CreateSmsChannelRequestDto) {
  @ApiProperty({ description: '渠道ID', example: 1 })
  @IsNumber()
  id: number;
}
