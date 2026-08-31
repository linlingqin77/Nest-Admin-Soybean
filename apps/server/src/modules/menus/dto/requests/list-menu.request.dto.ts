import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum } from 'src/shared/enums';
import { Type } from 'class-transformer';

export class ListMenuRequestDto {
  @ApiProperty({
    required: false,
    description: '菜单名称',
  })
  @IsOptional()
  @IsString()
  menuName?: string;

  @ApiProperty({
    required: false,
    description: '菜单状态',
  })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status?: string;

  @ApiProperty({
    required: false,
    description: '父菜单ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  parentId?: number;

  @ApiProperty({
    required: false,
    description: '菜单类型（M目录 C菜单 F按钮）',
  })
  @IsOptional()
  @IsString()
  menuType?: string;
}

// 保持向后兼容
export { ListMenuRequestDto as ListMenuDto };
export { ListMenuRequestDto as ListDeptDto };
