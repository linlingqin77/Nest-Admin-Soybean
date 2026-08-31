import { IsString, IsEnum, Min, Length, IsOptional, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class CreateDeptRequestDto {
  @ApiProperty({
    required: true,
    description: '父部门ID',
  })
  @IsNumber()
  parentId: number;

  @ApiProperty({
    required: true,
    description: '部门名称',
  })
  @IsString()
  @Length(0, 30)
  deptName: string;

  @ApiProperty({
    required: true,
    description: '显示顺序',
  })
  @IsNumber()
  @Min(0)
  orderNum: number;

  @ApiProperty({
    required: false,
    description: '负责人',
  })
  @IsOptional()
  @IsString()
  leader?: string;

  @ApiProperty({
    required: false,
    description: '联系电话',
  })
  @IsOptional()
  @IsString()
  @Length(0, 11)
  phone?: string;

  @ApiProperty({
    required: false,
    description: '邮箱',
  })
  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

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
