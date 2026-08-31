import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDictTypeRequestDto } from './create-dict-type.request.dto';

export class UpdateDictTypeRequestDto extends CreateDictTypeRequestDto {
  @ApiProperty({ required: true, description: '字典ID' })
  @IsNumber()
  dictId: number;
}
