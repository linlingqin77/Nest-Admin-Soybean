import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateLoginlogDto } from './create-loginlog.dto';

export class UpdateLoginlogDto extends CreateLoginlogDto {
  @ApiProperty({ required: true, description: '日志ID' })
  @IsNumber()
  infoId: number;
}
