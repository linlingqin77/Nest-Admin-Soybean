import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';

/**
 * 租户套餐响应 DTO
 */
export class TenantPackageResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '套餐ID' })
  packageId: number;

  @Expose()
  @ApiProperty({ description: '套餐名称' })
  packageName: string;

  @Expose()
  @ApiProperty({ description: '关联的菜单ID' })
  menuIds?: string;

  @Expose()
  @ApiProperty({ description: '菜单树选择项是否关联显示' })
  menuCheckStrictly: boolean;

  @Expose()
  @ApiProperty({ description: '状态(0正常 1停用)' })
  status: string;
}

/**
 * 租户套餐列表响应 DTO
 */
export class TenantPackageListResponseDto {
  @ApiProperty({ type: [TenantPackageResponseDto], description: '套餐列表' })
  rows: TenantPackageResponseDto[];

  @ApiProperty({ description: '总数' })
  total: number;
}

/**
 * 租户套餐选择框响应 DTO
 */
export class TenantPackageSelectResponseDto {
  @Expose()
  @ApiProperty({ description: '套餐ID' })
  packageId: number;

  @Expose()
  @ApiProperty({ description: '套餐名称' })
  packageName: string;
}
