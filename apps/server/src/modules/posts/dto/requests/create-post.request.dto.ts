import { IsString, IsEnum, Length, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

export class CreatePostRequestDto {
  @ApiProperty({ required: false, description: '部门ID' })
  @IsOptional()
  @IsNumber()
  deptId?: number;

  @ApiProperty({ required: true, description: '岗位名称' })
  @IsString()
  @Length(0, 50)
  postName: string;

  @ApiProperty({ required: true, description: '岗位编码' })
  @IsString()
  @Length(0, 64)
  postCode: string;

  @ApiProperty({ required: false, description: '类别编码' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  postCategory?: string;

  @ApiProperty({ enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema, required: false })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiProperty({
    required: false,
    description: '备注',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;

  @ApiProperty({ required: false, description: '岗位排序' })
  @IsOptional()
  @IsNumber()
  postSort?: number;
}
