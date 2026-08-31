import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import { DateFormat } from 'src/shared/decorators/date-format.decorator';

/**
 * 登录日志响应 DTO
 *
 * @description 用于登录日志列表和详情的响应数据格式化
 * - 自动格式化 loginTime 字段
 * - 排除敏感字段 tenantId, delFlag
 */
export class LoginLogResponseDto {
  @ApiProperty({ description: '访问ID' })
  @Expose()
  infoId: number;

  @ApiProperty({ description: '用户账号' })
  @Expose()
  userName: string;

  @ApiProperty({ description: '登录IP地址' })
  @Expose()
  ipaddr: string;

  @ApiPropertyOptional({ description: '登录地点' })
  @Expose()
  loginLocation?: string;

  @ApiProperty({ description: '浏览器类型' })
  @Expose()
  browser: string;

  @ApiProperty({ description: '操作系统' })
  @Expose()
  os: string;

  @ApiPropertyOptional({ description: '设备类型' })
  @Expose()
  deviceType?: string;

  @ApiProperty({ description: '登录状态（0成功 1失败）' })
  @Expose()
  status: string;

  @ApiPropertyOptional({ description: '提示消息' })
  @Expose()
  msg?: string;

  @ApiProperty({ description: '访问时间', example: '2025-01-01 00:00:00' })
  @Expose()
  @DateFormat()
  loginTime: string;

  /**
   * 租户ID - 不返回给前端
   */
  @Exclude()
  tenantId?: string;

  /**
   * 删除标记 - 不返回给前端
   */
  @Exclude()
  delFlag?: string;
}
