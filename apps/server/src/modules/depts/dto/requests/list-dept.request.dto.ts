import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class ListDeptRequestDto {
  @ApiProperty({
    required: false,
    description: '部门名称',
  })
  @IsOptional()
  @IsString()
  deptName?: string;

  @ApiProperty({
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;
}
