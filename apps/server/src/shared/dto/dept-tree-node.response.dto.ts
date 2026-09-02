import { ApiProperty } from '@nestjs/swagger';

/**
 * 部门树节点（公共 ResponseDto）
 */
export class DeptTreeNodeResponseDto {
  @ApiProperty({ description: '部门ID' })
  id!: number;

  @ApiProperty({ description: '部门名称' })
  label!: string;

  @ApiProperty({ description: '子节点列表', type: [DeptTreeNodeResponseDto], required: false })
  children?: DeptTreeNodeResponseDto[];
}
