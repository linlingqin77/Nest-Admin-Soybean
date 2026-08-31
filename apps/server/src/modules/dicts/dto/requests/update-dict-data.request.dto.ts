import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDictDataRequestDto } from './create-dict-data.request.dto';

export class UpdateDictDataRequestDto extends CreateDictDataRequestDto {
  @ApiProperty({ required: true, description: '字典编码' })
  @IsNumber()
  dictCode: number;
}
