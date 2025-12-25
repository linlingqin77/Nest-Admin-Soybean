import {
  IsString,
  IsNumberString,
  IsEnum,
  IsPhoneNumber,
  Min,
  Length,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OnlineListDto {
  @ApiProperty({ required: false, description: '当前页码' })
  @IsNumberString()
  pageNum: string;

  @ApiProperty({ required: false, description: '每页条数' })
  @IsNumberString()
  pageSize: string;
  @ApiProperty({
    required: false,
    description: '登录IP地址',
  })
  @IsOptional()
  @IsString()
  @Length(0, 128)
  ipaddr?: string;

  @ApiProperty({
    required: false,
    description: '用户名',
  })
  @IsOptional()
  @IsString()
  @Length(0, 50)
  userName?: string;
}
