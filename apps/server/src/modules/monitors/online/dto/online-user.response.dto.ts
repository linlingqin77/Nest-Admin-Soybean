import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { DateFormat } from 'src/shared/decorators/date-format.decorator';

/**
 * 在线用户响应 DTO
 *
 * @description 用于在线用户列表的响应数据格式化
 * - 自动格式化 loginTime 字段
 */
export class OnlineUserResponseDto {
  @ApiProperty({ description: '会话编号' })
  @Expose()
  tokenId: string;

  @ApiPropertyOptional({ description: '部门名称' })
  @Expose()
  deptName?: string;

  @ApiProperty({ description: '用户名称' })
  @Expose()
  userName: string;

  @ApiProperty({ description: '登录IP地址' })
  @Expose()
  ipaddr: string;

  @ApiPropertyOptional({ description: '登录地点' })
  @Expose()
  loginLocation?: string;

  @ApiPropertyOptional({ description: '浏览器类型' })
  @Expose()
  browser?: string;

  @ApiPropertyOptional({ description: '操作系统' })
  @Expose()
  os?: string;

  @ApiProperty({ description: '登录时间', example: '2025-01-01 00:00:00' })
  @Expose()
  @DateFormat()
  loginTime: string;

  @ApiPropertyOptional({ description: '设备类型' })
  @Expose()
  deviceType?: string;
}
