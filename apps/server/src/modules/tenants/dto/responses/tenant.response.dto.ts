import { ApiProperty } from '@nestjs/swagger';
import { Expose, Exclude } from 'class-transformer';
import { DateFormat } from 'src/shared/decorators';

/**
 * 租户响应 DTO
 * 注意：不继承 BaseResponseDto，因为租户模块的 tenantId 是租户编号（string），
 * 而不是其他模块中的租户ID（number）
 */
export class TenantResponseDto {
  @Expose()
  @ApiProperty({ description: '租户ID' })
  id: number;

  @Expose()
  @ApiProperty({ description: '租户编号' })
  tenantId: string;

  @Expose()
  @ApiProperty({ description: '联系人' })
  contactUserName?: string;

  @Expose()
  @ApiProperty({ description: '联系电话' })
  contactPhone?: string;

  @Expose()
  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @Expose()
  @ApiProperty({ description: '统一社会信用代码' })
  licenseNumber?: string;

  @Expose()
  @ApiProperty({ description: '地址' })
  address?: string;

  @Expose()
  @ApiProperty({ description: '企业简介' })
  intro?: string;

  @Expose()
  @ApiProperty({ description: '域名' })
  domain?: string;

  @Expose()
  @ApiProperty({ description: '租户套餐ID' })
  packageId?: number;

  @Expose()
  @ApiProperty({ description: '租户套餐名称' })
  packageName?: string;

  @Expose()
  @ApiProperty({ description: '过期时间' })
  @DateFormat()
  expireTime?: string;

  @Expose()
  @ApiProperty({ description: '账号数量' })
  accountCount: number;

  @Expose()
  @ApiProperty({ description: '状态(0正常 1停用)' })
  status: string;

  @Expose()
  @ApiProperty({ description: '创建时间' })
  @DateFormat()
  createTime: string;

  @Expose()
  @ApiProperty({ description: '更新时间' })
  @DateFormat()
  updateTime: string;

  @Expose()
  @ApiProperty({ description: '备注' })
  remark?: string;

  // 敏感字段 - 不返回给前端
  @Exclude()
  delFlag?: string;

  @Exclude()
  createBy?: string;

  @Exclude()
  updateBy?: string;
}

/**
 * 租户列表响应 DTO
 */
export class TenantListResponseDto {
  @ApiProperty({ type: [TenantResponseDto], description: '租户列表' })
  rows: TenantResponseDto[];

  @ApiProperty({ description: '总数' })
  total: number;
}

/**
 * 租户切换响应 DTO
 */
export class TenantSwitchResponseDto {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '目标租户ID' })
  tenantId: string;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '原租户ID', required: false })
  originalTenantId?: string;
}

/**
 * 租户恢复响应 DTO
 */
export class TenantRestoreResponseDto {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '原租户ID' })
  originalTenantId: string;

  @ApiProperty({ description: '原企业名称' })
  originalCompanyName: string;
}

/**
 * 可切换租户列表项 DTO
 */
export class TenantSelectItemResponseDto {
  @ApiProperty({ description: '租户ID' })
  tenantId: string;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '状态' })
  status: string;
}

/**
 * 可切换租户列表响应 DTO
 */
export class TenantSelectListResponseDto {
  @ApiProperty({ type: [TenantSelectItemResponseDto], description: '可切换租户列表' })
  list: TenantSelectItemResponseDto[];
}

/**
 * 创建租户结果响应 DTO
 */
export class CreateTenantResultResponseDto {
  @ApiProperty({ description: '创建的租户ID', example: 1 })
  id: number;

  @ApiProperty({ description: '租户编号' })
  tenantId: string;
}

/**
 * 更新租户结果响应 DTO
 */
export class UpdateTenantResultResponseDto {
  @ApiProperty({ description: '更新是否成功', example: true })
  success: boolean;
}

/**
 * 删除租户结果响应 DTO
 */
export class DeleteTenantResultResponseDto {
  @ApiProperty({ description: '删除的记录数', example: 1 })
  affected: number;
}

/**
 * 同步租户字典结果响应 DTO
 */
export class SyncTenantDictResultResponseDto {
  @ApiProperty({ description: '同步是否成功', example: true })
  success: boolean;
}

/**
 * 同步租户套餐结果响应 DTO
 */
export class SyncTenantPackageResultResponseDto {
  @ApiProperty({ description: '同步是否成功', example: true })
  success: boolean;
}

/**
 * 同步租户配置结果响应 DTO
 */
export class SyncTenantConfigResultResponseDto {
  @ApiProperty({ description: '同步是否成功', example: true })
  success: boolean;
}

/**
 * 租户切换状态响应 DTO
 */
export class TenantSwitchStatusResponseDto {
  @ApiProperty({ description: '是否已切换租户' })
  isSwitched: boolean;

  @ApiProperty({ description: '当前租户ID', required: false })
  currentTenantId?: string;

  @ApiProperty({ description: '原租户ID', required: false })
  originalTenantId?: string;
}
