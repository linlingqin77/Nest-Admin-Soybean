import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { CreateUserRequestDto } from './create-user.request.dto';

/**
 * 更新用户 DTO
 */
export class UpdateUserRequestDto extends PartialType(CreateUserRequestDto) {
  @ApiProperty({ required: true, description: '用户ID' })
  @IsNumber()
  userId: number;
}
