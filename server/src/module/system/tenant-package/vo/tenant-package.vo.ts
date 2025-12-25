import { ApiProperty } from '@nestjs/swagger';

export class TenantPackageVo {
  @ApiProperty({ description: '套餐ID' })
  packageId: number;

  @ApiProperty({ description: '套餐名称' })
  packageName: string;

  @ApiProperty({ description: '关联的菜单ID' })
  menuIds?: string;

  @ApiProperty({ description: '菜单树选择项是否关联显示' })
  menuCheckStrictly: boolean;

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

export class TenantPackageListVo {
  @ApiProperty({ type: [TenantPackageVo] })
  rows: TenantPackageVo[];

  @ApiProperty({ description: '总数' })
  total: number;
}

export class TenantPackageSelectVo {
  @ApiProperty({ description: '套餐ID' })
  packageId: number;

  @ApiProperty({ description: '套餐名称' })
  packageName: string;
}
