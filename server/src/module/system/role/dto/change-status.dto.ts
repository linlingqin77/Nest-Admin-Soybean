import { IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/common/enum';

/**
 * 修改角色状态 DTO
 */
export class ChangeStatusDto {
  @ApiProperty({ required: true, description: '角色ID' })
  @IsNumber()
  roleId: number;

  @ApiProperty({
    required: true,
    description: '角色状态（0正常 1停用）',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  @IsString()
  @IsEnum(StatusEnum)
  status: string;
}
