import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';

/**
 * 岗位响应 DTO
 */
export class PostResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '岗位ID' })
  postId: number;

  @Expose()
  @ApiProperty({ description: '岗位编码' })
  postCode: string;

  @Expose()
  @ApiProperty({ description: '岗位名称' })
  postName: string;

  @Expose()
  @ApiProperty({ description: '类别编码' })
  postCategory: string;

  @Expose()
  @ApiProperty({ description: '显示顺序' })
  postSort: number;

  @Expose()
  @ApiProperty({ description: '状态（0正常 1停用）' })
  status: string;

  @Expose()
  @ApiProperty({ description: '备注' })
  remark: string;

  @Expose()
  @ApiProperty({ description: '部门ID' })
  deptId: number;
}

/**
 * 岗位列表响应 DTO
 */
export class PostListResponseDto {
  @ApiProperty({ description: '岗位列表', type: [PostResponseDto] })
  rows: PostResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

/**
 * 创建岗位结果响应 DTO
 */
export class CreatePostResultResponseDto {
  @ApiProperty({ description: '创建的岗位ID', example: 1 })
  postId: number;
}

/**
 * 更新岗位结果响应 DTO
 */
export class UpdatePostResultResponseDto {
  @ApiProperty({ description: '更新是否成功', example: true })
  success: boolean;
}

/**
 * 删除岗位结果响应 DTO
 */
export class DeletePostResultResponseDto {
  @ApiProperty({ description: '删除的记录数', example: 1 })
  affected: number;
}

/**
 * 部门树响应 DTO
 */
export class DeptTreeResponseDto {
  @ApiProperty({ description: '部门ID' })
  id: number;

  @ApiProperty({ description: '部门名称' })
  label: string;

  @ApiProperty({ description: '子部门', type: [DeptTreeResponseDto], required: false })
  children?: DeptTreeResponseDto[];
}
