import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateConfigRequestDto } from './create-config.request.dto';

export class UpdateConfigRequestDto extends CreateConfigRequestDto {
  @ApiProperty({ required: true, description: '参数ID' })
  @IsNumber()
  configId: number;
}
