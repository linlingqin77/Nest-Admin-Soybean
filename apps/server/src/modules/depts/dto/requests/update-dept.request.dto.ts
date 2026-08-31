import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateDeptRequestDto } from './create-dept.request.dto';

export class UpdateDeptRequestDto extends CreateDeptRequestDto {
  @ApiProperty({
    required: false,
    description: '部门ID',
  })
  @IsNumber()
  deptId: number;
}
