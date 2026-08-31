import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';
import { DeptTreeNodeResponseDto } from 'src/shared/dto/dept-tree-node.response.dto';

/**
 * 部门响应 DTO
 *
 * @description 继承 BaseResponseDto，自动处理：
 * - createTime/updateTime 日期格式化（通过 @DateFormat() 装饰器）
 * - 敏感字段排除（delFlag, tenantId 等）
 */
export class DeptResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '部门ID' })
  deptId: number;

  @Expose()
  @ApiPropertyOptional({ description: '父部门ID' })
  parentId?: number;

  @Expose()
  @ApiPropertyOptional({ description: '祖级列表' })
  ancestors?: string;

  @Expose()
  @ApiProperty({ description: '部门名称' })
  deptName: string;

  @Expose()
  @ApiPropertyOptional({ description: '显示顺序' })
  orderNum?: number;

  @Expose()
  @ApiPropertyOptional({ description: '负责人' })
  leader?: string;

  @Expose()
  @ApiPropertyOptional({ description: '联系电话' })
  phone?: string;

  @Expose()
  @ApiPropertyOptional({ description: '邮箱' })
  email?: string;

  @Expose()
  @ApiPropertyOptional({ description: '部门状态（0正常 1停用）' })
  status?: string;

  @Expose()
  @ApiPropertyOptional({ description: '子部门列表', type: [DeptResponseDto] })
  @Type(() => DeptResponseDto)
  children?: DeptResponseDto[];

  // createTime, updateTime, remark 继承自 BaseResponseDto，已自动应用 @DateFormat() 装饰器
}

/**
 * 部门列表响应 DTO
 */
export class DeptListResponseDto {
  @ApiProperty({ description: '部门列表', type: [DeptResponseDto] })
  list: DeptResponseDto[];
}

/**
 * 部门树响应 DTO
 */
export class DeptTreeResponseDto {
  @ApiProperty({ description: '部门树数据', type: [DeptTreeNodeResponseDto] })
  data: DeptTreeNodeResponseDto[];
}

/**
 * 部门下拉树选项响应 DTO
 */
export class DeptTreeSelectResponseDto {
  @ApiProperty({ description: '部门下拉树数据', type: [DeptTreeNodeResponseDto] })
  data: DeptTreeNodeResponseDto[];
}

/**
 * 角色部门树响应 DTO
 */
export class RoleDeptTreeSelectResponseDto {
  @ApiProperty({ description: '已选中的部门ID列表', type: [Number] })
  checkedKeys: number[];

  @ApiProperty({ description: '部门树数据', type: [DeptTreeNodeResponseDto] })
  depts: DeptTreeNodeResponseDto[];
}

/**
 * 创建部门结果响应 DTO
 */
export class CreateDeptResultResponseDto {
  @ApiProperty({ description: '创建的部门ID', example: 1 })
  deptId: number;
}

/**
 * 更新部门结果响应 DTO
 */
export class UpdateDeptResultResponseDto {
  @ApiProperty({ description: '更新是否成功', example: true })
  success: boolean;
}

/**
 * 删除部门结果响应 DTO
 */
export class DeleteDeptResultResponseDto {
  @ApiProperty({ description: '删除的记录数', example: 1 })
  affected: number;
}
