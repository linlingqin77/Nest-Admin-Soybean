import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import { DateFormat } from 'src/shared/decorators/date-format.decorator';

/**
 * 定时任务响应 DTO
 *
 * @description 用于定时任务列表和详情的响应数据格式化
 * - 自动格式化 createTime, updateTime 字段
 * - 排除敏感字段 tenantId
 */
export class JobResponseDto {
  @ApiProperty({ description: '任务ID' })
  @Expose()
  jobId: number;

  @ApiProperty({ description: '任务名称' })
  @Expose()
  jobName: string;

  @ApiProperty({ description: '任务组名' })
  @Expose()
  jobGroup: string;

  @ApiProperty({ description: '调用目标字符串' })
  @Expose()
  invokeTarget: string;

  @ApiPropertyOptional({ description: 'cron执行表达式' })
  @Expose()
  cronExpression?: string;

  @ApiPropertyOptional({ description: '计划执行错误策略' })
  @Expose()
  misfirePolicy?: string;

  @ApiPropertyOptional({ description: '是否并发执行' })
  @Expose()
  concurrent?: string;

  @ApiPropertyOptional({ description: '状态（0正常 1暂停）' })
  @Expose()
  status?: string;

  @ApiPropertyOptional({ description: '创建者' })
  @Expose()
  createBy?: string;

  @ApiPropertyOptional({ description: '创建时间', example: '2025-01-01 00:00:00' })
  @Expose()
  @DateFormat()
  createTime?: string;

  @ApiPropertyOptional({ description: '更新者' })
  @Expose()
  updateBy?: string;

  @ApiPropertyOptional({ description: '更新时间', example: '2025-01-01 00:00:00' })
  @Expose()
  @DateFormat()
  updateTime?: string;

  @ApiPropertyOptional({ description: '备注' })
  @Expose()
  remark?: string;

  /**
   * 租户ID - 不返回给前端
   */
  @Exclude()
  tenantId?: string;
}

/**
 * 任务日志响应 DTO
 *
 * @description 用于任务日志列表的响应数据格式化
 * - 自动格式化 createTime 字段
 */
export class JobLogResponseDto {
  @ApiProperty({ description: '日志ID' })
  @Expose()
  jobLogId: number;

  @ApiProperty({ description: '任务名称' })
  @Expose()
  jobName: string;

  @ApiProperty({ description: '任务组名' })
  @Expose()
  jobGroup: string;

  @ApiProperty({ description: '调用目标字符串' })
  @Expose()
  invokeTarget: string;

  @ApiPropertyOptional({ description: '日志信息' })
  @Expose()
  jobMessage?: string;

  @ApiProperty({ description: '执行状态（0正常 1失败）' })
  @Expose()
  status: string;

  @ApiPropertyOptional({ description: '异常信息' })
  @Expose()
  exceptionInfo?: string;

  @ApiProperty({ description: '创建时间', example: '2025-01-01 00:00:00' })
  @Expose()
  @DateFormat()
  createTime: string;
}
