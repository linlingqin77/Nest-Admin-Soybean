import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';
import { StatusEnum, StatusEnumSchema, NoticeTypeEnum, NoticeTypeEnumSchema } from 'src/shared/enums';

/**
 * 通知公告响应 DTO
 *
 * @description 继承 BaseResponseDto，自动处理：
 * - createTime/updateTime 日期格式化（通过 @DateFormat() 装饰器）
 * - 敏感字段排除（delFlag, tenantId 等）
 */
export class NoticeResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '公告ID' })
  noticeId: number;

  @Expose()
  @ApiProperty({ description: '公告标题' })
  noticeTitle: string;

  @Expose()
  @ApiPropertyOptional({
    description: '公告类型',
    enum: NoticeTypeEnum,
    enumName: 'NoticeTypeEnum',
    enumSchema: NoticeTypeEnumSchema,
  })
  noticeType?: string;

  @Expose()
  @ApiPropertyOptional({ description: '公告内容' })
  noticeContent?: string;

  @Expose()
  @ApiPropertyOptional({
    description: '公告状态',
    enum: StatusEnum,
    enumName: 'StatusEnum',
    enumSchema: StatusEnumSchema,
  })
  status?: string;

  // createTime, updateTime, remark 继承自 BaseResponseDto，已自动应用 @DateFormat() 装饰器
}

/**
 * 通知公告列表响应 DTO
 */
export class NoticeListResponseDto {
  @ApiProperty({ description: '公告列表', type: [NoticeResponseDto] })
  rows: NoticeResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

/**
 * 创建通知公告结果响应 DTO
 */
export class CreateNoticeResultResponseDto {
  @ApiProperty({ description: '创建的公告ID', example: 1 })
  noticeId: number;
}

/**
 * 更新通知公告结果响应 DTO
 */
export class UpdateNoticeResultResponseDto {
  @ApiProperty({ description: '更新是否成功', example: true })
  success: boolean;
}

/**
 * 删除通知公告结果响应 DTO
 */
export class DeleteNoticeResultResponseDto {
  @ApiProperty({ description: '删除的记录数', example: 1 })
  affected: number;
}
