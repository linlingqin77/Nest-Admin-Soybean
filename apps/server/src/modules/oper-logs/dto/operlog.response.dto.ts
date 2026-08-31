import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import { DateFormat } from 'src/shared/decorators/date-format.decorator';

/**
 * 操作日志响应 DTO
 *
 * @description 用于操作日志列表和详情的响应数据格式化
 * - 自动格式化 operTime 字段
 * - 排除敏感字段 tenantId
 */
export class OperLogResponseDto {
  @ApiProperty({ description: '日志主键' })
  @Expose()
  operId: number;

  @ApiProperty({ description: '模块标题' })
  @Expose()
  title: string;

  @ApiProperty({ description: '业务类型' })
  @Expose()
  businessType: number;

  @ApiProperty({ description: '请求方式' })
  @Expose()
  requestMethod: string;

  @ApiProperty({ description: '操作类别' })
  @Expose()
  operatorType: number;

  @ApiProperty({ description: '操作人员' })
  @Expose()
  operName: string;

  @ApiProperty({ description: '部门名称' })
  @Expose()
  deptName: string;

  @ApiProperty({ description: '请求URL' })
  @Expose()
  operUrl: string;

  @ApiProperty({ description: '操作地点' })
  @Expose()
  operLocation: string;

  @ApiPropertyOptional({ description: '请求参数' })
  @Expose()
  operParam?: string;

  @ApiPropertyOptional({ description: '返回参数' })
  @Expose()
  jsonResult?: string;

  @ApiPropertyOptional({ description: '错误消息' })
  @Expose()
  errorMsg?: string;

  @ApiProperty({ description: '方法名称' })
  @Expose()
  method: string;

  @ApiProperty({ description: '主机地址' })
  @Expose()
  operIp: string;

  @ApiProperty({ description: '操作时间', example: '2025-01-01 00:00:00' })
  @Expose()
  @DateFormat()
  operTime: string;

  @ApiProperty({ description: '操作状态（0正常 1异常）' })
  @Expose()
  status: string;

  @ApiProperty({ description: '消耗时间（毫秒）' })
  @Expose()
  costTime: number;

  /**
   * 租户ID - 不返回给前端
   */
  @Exclude()
  tenantId?: string;
}
