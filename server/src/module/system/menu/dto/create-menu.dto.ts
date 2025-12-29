import { IsString, IsEnum, Length, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, MenuTypeEnum, MenuTypeEnumSchema, YesNoEnum, YesNoEnumSchema } from 'src/common/enum';

export class CreateMenuDto {
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

  @ApiProperty({ enum: YesNoEnum, enumName: 'YesNoEnum', enumSchema: YesNoEnumSchema, required: false, description: '是否缓存（YES缓存 NO不缓存）' })
  @IsOptional()
  @IsString()
  @IsEnum(YesNoEnum)
  isCache: string;

  @ApiProperty({ enum: YesNoEnum, enumName: 'YesNoEnum', enumSchema: YesNoEnumSchema, required: true, description: '是否为外链（YES是 NO否）' })
  @IsString()
  @IsEnum(YesNoEnum)
  isFrame: string;

  @ApiProperty({ required: false, description: '菜单状态（NORMAL正常 DISABLED停用）' })
  @IsOptional()
  @IsString()
  @IsEnum(StatusEnum)
  status: string;

  @ApiProperty({ enum: YesNoEnum, enumName: 'YesNoEnum', enumSchema: YesNoEnumSchema, required: false, description: '显示状态（YES显示 NO隐藏）' })
  @IsOptional()
  @IsString()
  @IsEnum(YesNoEnum)
  visible: string;

  @ApiProperty({ required: false, description: '权限标识' })
  @IsOptional()
  @IsString()
  perms: string;
}
