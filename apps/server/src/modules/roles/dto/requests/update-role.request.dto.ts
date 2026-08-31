import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { CreateRoleRequestDto } from './create-role.request.dto';

/**
 * 更新角色请求 DTO
 */
export class UpdateRoleRequestDto extends CreateRoleRequestDto {
  @ApiProperty({ required: true, description: '角色ID' })
  @IsNumber()
  roleId: number;
}
