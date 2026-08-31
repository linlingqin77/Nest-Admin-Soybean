import { IsString, IsEmail, IsOptional, IsArray, IsObject, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMailDto {
  @ApiProperty({ description: '收件人邮箱', example: 'user@example.com' })
  @IsEmail()
  toMail: string;

  @ApiProperty({ description: '模板编码', example: 'user_register_code' })
  @IsString()
  @Length(1, 100)
  templateCode: string;

  @ApiPropertyOptional({
    description: '模板参数',
    example: { code: '123456', time: '5' },
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, string>;
}

export class BatchSendMailDto {
  @ApiProperty({
    description: '收件人邮箱列表',
    example: ['user1@example.com', 'user2@example.com'],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  toMails: string[];

  @ApiProperty({ description: '模板编码', example: 'user_register_code' })
  @IsString()
  @Length(1, 100)
  templateCode: string;

  @ApiPropertyOptional({
    description: '模板参数',
    example: { code: '123456', time: '5' },
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, string>;
}

export class TestMailDto {
  @ApiProperty({ description: '收件人邮箱', example: 'user@example.com' })
  @IsEmail()
  toMail: string;

  @ApiProperty({ description: '邮箱账号ID', example: 1 })
  accountId: number;

  @ApiPropertyOptional({ description: '邮件标题', example: '测试邮件' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: '邮件内容', example: '<p>这是一封测试邮件</p>' })
  @IsOptional()
  @IsString()
  content?: string;
}
