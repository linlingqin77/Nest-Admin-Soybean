import { IsString, Length, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from 'src/shared/validators/password.validator';

/**
 * 重置密码 DTO
 */
export class ResetPwdRequestDto {
  @ApiProperty({ required: true, description: '用户ID' })
  @IsNumber()
  userId: number;

  @ApiProperty({ required: true, description: '新密码' })
  @IsString()
  @IsStrongPassword()
  @Length(5, 20)
  password: string;
}
