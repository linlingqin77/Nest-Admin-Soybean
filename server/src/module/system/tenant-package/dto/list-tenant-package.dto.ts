import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PageQueryDto } from 'src/common/dto/index';

export class ListTenantPackageDto extends PageQueryDto {
  @ApiProperty({ required: false, description: '套餐名称' })
  @IsOptional()
  @IsString()
  packageName?: string;

  @ApiProperty({ required: false, description: '状态(0正常 1停用)' })
  @IsOptional()
  @IsString()
  status?: string;
}
