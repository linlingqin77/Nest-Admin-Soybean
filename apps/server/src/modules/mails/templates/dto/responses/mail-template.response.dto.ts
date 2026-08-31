import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';

/**
 * 邮件模板响应 DTO
 */
export class MailTemplateResponseDto extends BaseResponseDto {
  @ApiProperty({ description: '模板ID' })
  @Expose()
  id: number;

  @ApiProperty({ description: '模板名称' })
  @Expose()
  name: string;

  @ApiProperty({ description: '模板编码' })
  @Expose()
  code: string;

  @ApiProperty({ description: '发送账号ID' })
  @Expose()
  accountId: number;

  @ApiPropertyOptional({ description: '发送账号邮箱' })
  @Expose()
  accountMail?: string;

  @ApiProperty({ description: '发送人昵称' })
  @Expose()
  nickname: string;

  @ApiProperty({ description: '邮件标题' })
  @Expose()
  title: string;

  @ApiProperty({ description: '邮件内容（HTML）' })
  @Expose()
  content: string;

  @ApiPropertyOptional({ description: '参数列表' })
  @Expose()
  params?: string;

  @ApiProperty({ description: '状态' })
  @Expose()
  status: string;

  @ApiPropertyOptional({ description: '备注' })
  @Expose()
  remark?: string;
}
