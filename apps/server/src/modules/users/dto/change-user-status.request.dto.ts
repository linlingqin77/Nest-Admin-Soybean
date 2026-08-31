import { IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, StatusEnumSchema } from 'src/shared/enums';

/**
 * 修改用户状态 DTO
 */
export class ChangeUserStatusRequestDto {
  @ApiProperty({ required: true, description: '用户ID' })
  @IsNumber()
  userId: number;

  @ApiProperty({ enum: StatusEnum, enumName: 'StatusEnum', enumSchema: StatusEnumSchema, required: true })
  @IsString()
  @IsEnum(StatusEnum)
  status: string;
}
