import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateMailAccountRequestDto } from './create-mail-account.request.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateMailAccountRequestDto extends PartialType(CreateMailAccountRequestDto) {
  @ApiProperty({ description: '账号ID', example: 1 })
  @IsNumber()
  id: number;
}
