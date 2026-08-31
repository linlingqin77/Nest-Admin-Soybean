import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageQueryDto } from 'src/shared/dto/index';
import { Transform } from 'class-transformer';

export class ListNotifyMessageRequestDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '用户ID' })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  userId?: number;

  @ApiPropertyOptional({ description: '模板编码' })
  @IsOptional()
  @IsString()
  templateCode?: string;

  @ApiPropertyOptional({ description: '已读状态' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  readStatus?: boolean;
}

/**
 * 我的站内信列表查询DTO
 */
export class ListMyNotifyMessageRequestDto extends PageQueryDto {
  @ApiPropertyOptional({ description: '已读状态' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  readStatus?: boolean;
}
