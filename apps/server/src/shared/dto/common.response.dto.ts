import { ApiProperty } from '@nestjs/swagger';

/**
 * 操作成功响应（无具体数据）
 */
export class SuccessVo {
  @ApiProperty({ description: '操作是否成功', example: true })
  success!: boolean;
}

/**
 * 布尔值响应
 */
export class BooleanResultVo {
  @ApiProperty({ description: '结果值', example: true })
  value!: boolean;
}

/**
 * 删除操作响应
 */
export class DeleteResultVo {
  @ApiProperty({ description: '删除的记录数', example: 1 })
  affected!: number;
}

/**
 * 创建操作响应
 */
export class CreateResultVo {
  @ApiProperty({ description: '创建的记录ID', example: 1 })
  id!: number;
}

/**
 * 更新操作响应
 */
export class UpdateResultVo {
  @ApiProperty({ description: '更新是否成功', example: true })
  success!: boolean;

  @ApiProperty({ description: '影响的记录数', example: 1 })
  affected!: number;
}
