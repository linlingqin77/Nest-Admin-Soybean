import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 取消用户授权角色请求 DTO
 */
export class AuthUserCancelRequestDto {
  @ApiProperty({ required: true, description: '角色ID' })
  @IsNumber()
  roleId: number;

  @ApiProperty({ required: true, description: '用户ID' })
  @IsNumber()
  userId: number;
}

/**
 * 批量取消用户授权角色请求 DTO
 */
export class AuthUserCancelAllRequestDto {
  @ApiProperty({ required: true, description: '角色ID' })
  @IsNumber()
  roleId: number;

  @ApiProperty({ required: true, description: '用户ID列表' })
  @IsString()
  userIds: string;
}

/**
 * 批量选择用户授权角色请求 DTO
 */
export class AuthUserSelectAllRequestDto {
  @ApiProperty({ required: true, description: '角色ID' })
  @IsNumber()
  roleId: number;

  @ApiProperty({ required: true, description: '用户ID列表' })
  @IsString()
  userIds: string;
}
