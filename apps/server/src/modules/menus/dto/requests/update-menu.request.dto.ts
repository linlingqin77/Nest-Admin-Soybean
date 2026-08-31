import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateMenuRequestDto } from './create-menu.request.dto';

export class UpdateMenuRequestDto extends CreateMenuRequestDto {
  @ApiProperty({ required: true, description: '菜单ID' })
  @IsNumber()
  menuId: number;
}

// 保持向后兼容
export { UpdateMenuRequestDto as UpdateMenuDto };
