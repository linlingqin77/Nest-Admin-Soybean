import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetShareRequestDto {
  @ApiProperty({ required: true, description: '分享ID' })
  @IsString()
  shareId: string;

  @ApiProperty({ required: false, description: '分享码' })
  @IsOptional()
  @IsString()
  shareCode?: string;
}
