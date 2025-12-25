import { ApiProperty } from '@nestjs/swagger';

export class TenantVo {
  @ApiProperty({ description: '租户ID' })
  id: number;

  @ApiProperty({ description: '租户编号' })
  tenantId: string;

  @ApiProperty({ description: '联系人' })
  contactUserName?: string;

  @ApiProperty({ description: '联系电话' })
  contactPhone?: string;

  @ApiProperty({ description: '企业名称' })
  companyName: string;

  @ApiProperty({ description: '统一社会信用代码' })
  licenseNumber?: string;

  @ApiProperty({ description: '地址' })
  address?: string;

  @ApiProperty({ description: '企业简介' })
  intro?: string;

  @ApiProperty({ description: '域名' })
  domain?: string;

  @ApiProperty({ description: '租户套餐ID' })
  packageId?: number;

  @ApiProperty({ description: '租户套餐名称' })
  packageName?: string;

  @ApiProperty({ description: '过期时间' })
  expireTime?: Date;

  @ApiProperty({ description: '账号数量' })
  accountCount: number;

  @ApiProperty({ description: '状态(0正常 1停用)' })
  status: string;

  @ApiProperty({ description: '创建者' })
  createBy: string;

  @ApiProperty({ description: '创建时间' })
  createTime: Date;

  @ApiProperty({ description: '更新者' })
  updateBy: string;

  @ApiProperty({ description: '更新时间' })
  updateTime: Date;

  @ApiProperty({ description: '备注' })
  remark?: string;
}

export class TenantListVo {
  @ApiProperty({ type: [TenantVo] })
  rows: TenantVo[];

  @ApiProperty({ description: '总数' })
  total: number;
}
