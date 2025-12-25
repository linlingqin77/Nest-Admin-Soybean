import { IsString, IsEnum, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/common/dto';
import { StatusEnum, StatusEnumSchema } from 'src/common/enum';

/**
 * 角色列表查询 DTO
 */
export class ListRoleDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '角色名称' })
  @IsOptional()
  @IsString()
  @Length(0, 30)
  roleName?: string;

  @ApiProperty({ required: false, description: '角色权限字符串' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  roleKey?: string;

  @ApiProperty({
    required: false,
    description: '角色状态（0正常 1停用）',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiProperty({ required: false, description: '角色ID' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  roleId?: string;
}
