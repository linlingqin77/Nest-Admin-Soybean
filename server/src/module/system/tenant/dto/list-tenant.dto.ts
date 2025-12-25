import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/common/dto/index';

export class ListTenantDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '租户ID' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ required: false, description: '联系人' })
  @IsOptional()
  @IsString()
  contactUserName?: string;

  @ApiProperty({ required: false, description: '联系电话' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ required: false, description: '企业名称' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false, description: '状态(0正常 1停用)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: '开始时间' })
  @IsOptional()
  @IsDateString()
  beginTime?: Date;

  @ApiProperty({ required: false, description: '结束时间' })
  @IsOptional()
  @IsDateString()
  endTime?: Date;
}
