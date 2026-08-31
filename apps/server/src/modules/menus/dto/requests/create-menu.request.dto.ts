import { IsString, IsEnum, Length, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, MenuTypeEnum, MenuTypeEnumSchema } from 'src/shared/enums';

export class CreateMenuRequestDto {
  @ApiProperty({ required: true, description: '菜单名称' })
  @IsString()
  @Length(0, 50)
  menuName: string;

  @ApiProperty({ required: false, description: '显示顺序' })
  @IsOptional()
  @IsNumber()
  orderNum: number;

  @ApiProperty({ required: true, description: '父菜单ID' })
  @IsOptional()
  @IsNumber()
  parentId: number;

  @ApiProperty({ required: false, description: '路由地址' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  path?: string;

  @ApiProperty({ required: false, description: '路由参数' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  query: string;

  @ApiProperty({ required: false, description: '组件路径' })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  component?: string;

  @ApiProperty({ required: false, description: '菜单图标' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  icon?: string;

  @ApiProperty({ enum: MenuTypeEnum, enumName: 'MenuTypeEnum', enumSchema: MenuTypeEnumSchema, required: false })
  @IsOptional()
  @IsString()
  @IsEnum(MenuTypeEnum)
  menuType: string;

  @ApiProperty({ required: false, description: '是否缓存（0缓存 1不缓存）' })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  isCache: string;

  @ApiProperty({ required: true, description: '是否为外链（0是 1否）' })
  @IsString()
  @IsEnum(StatusEnum)
  isFrame: string;

  @ApiProperty({ required: false, description: '菜单状态（0正常 1停用）' })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status: string;

  @ApiProperty({ required: false, description: '显示状态（0显示 1隐藏）' })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  visible: string;

  @ApiProperty({ required: false, description: '权限标识' })
  @IsOptional()
  @IsString()
  perms: string;

  @ApiProperty({ required: false, description: '路由参数' })
  @IsOptional()
  @IsString()
  queryParam?: string;

  @ApiProperty({ required: false, description: '备注' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  remark?: string;
}

// 保持向后兼容
export { CreateMenuRequestDto as CreateMenuDto };
