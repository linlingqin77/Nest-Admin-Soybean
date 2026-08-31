import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/shared/dto/base.response.dto';

/**
 * 字典类型响应 DTO
 *
 * @description 继承 BaseResponseDto，自动处理：
 * - createTime/updateTime 日期格式化（通过 @DateFormat() 装饰器）
 * - 敏感字段排除（delFlag, tenantId 等）
 */
export class DictTypeResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '字典类型ID' })
  dictId: number;

  @Expose()
  @ApiProperty({ description: '字典名称' })
  dictName: string;

  @Expose()
  @ApiProperty({ description: '字典类型' })
  dictType: string;

  @Expose()
  @ApiPropertyOptional({ description: '状态（0正常 1停用）' })
  status?: string;

  // createTime, updateTime, remark 继承自 BaseResponseDto，已自动应用 @DateFormat() 装饰器
}

/**
 * 字典类型列表响应 DTO
 */
export class DictTypeListResponseDto {
  @ApiProperty({ description: '字典类型列表', type: [DictTypeResponseDto] })
  rows: DictTypeResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

/**
 * 字典数据响应 DTO
 *
 * @description 继承 BaseResponseDto，自动处理：
 * - createTime/updateTime 日期格式化（通过 @DateFormat() 装饰器）
 * - 敏感字段排除（delFlag, tenantId 等）
 */
export class DictDataResponseDto extends BaseResponseDto {
  @Expose()
  @ApiProperty({ description: '字典数据ID' })
  dictCode: number;

  @Expose()
  @ApiPropertyOptional({ description: '字典排序' })
  dictSort?: number;

  @Expose()
  @ApiProperty({ description: '字典标签' })
  dictLabel: string;

  @Expose()
  @ApiProperty({ description: '字典键值' })
  dictValue: string;

  @Expose()
  @ApiProperty({ description: '字典类型' })
  dictType: string;

  @Expose()
  @ApiPropertyOptional({ description: '样式属性' })
  cssClass?: string;

  @Expose()
  @ApiPropertyOptional({ description: '表格回显样式' })
  listClass?: string;

  @Expose()
  @ApiPropertyOptional({ description: '是否默认（Y是 N否）' })
  isDefault?: string;

  @Expose()
  @ApiPropertyOptional({ description: '状态（0正常 1停用）' })
  status?: string;

  // createTime, updateTime, remark 继承自 BaseResponseDto，已自动应用 @DateFormat() 装饰器
}

/**
 * 字典数据列表响应 DTO
 */
export class DictDataListResponseDto {
  @ApiProperty({ description: '字典数据列表', type: [DictDataResponseDto] })
  rows: DictDataResponseDto[];

  @ApiProperty({ description: '总数量' })
  total: number;
}

/**
 * 字典选项响应 DTO（下拉框）
 */
export class DictOptionResponseDto {
  @Expose()
  @ApiProperty({ description: '字典标签' })
  dictLabel: string;

  @Expose()
  @ApiProperty({ description: '字典值' })
  dictValue: string;

  @Expose()
  @ApiProperty({ description: '样式类名' })
  cssClass: string;

  @Expose()
  @ApiProperty({ description: '列表样式' })
  listClass: string;
}

/**
 * 创建字典类型结果响应 DTO
 */
export class CreateDictTypeResultResponseDto {
  @Expose()
  @ApiProperty({ description: '创建的字典类型ID', example: 1 })
  dictId: number;
}

/**
 * 更新字典类型结果响应 DTO
 */
export class UpdateDictTypeResultResponseDto {
  @Expose()
  @ApiProperty({ description: '更新是否成功', example: true })
  success: boolean;
}

/**
 * 删除字典类型结果响应 DTO
 */
export class DeleteDictTypeResultResponseDto {
  @Expose()
  @ApiProperty({ description: '删除的记录数', example: 1 })
  affected: number;
}

/**
 * 创建字典数据结果响应 DTO
 */
export class CreateDictDataResultResponseDto {
  @Expose()
  @ApiProperty({ description: '创建的字典数据ID', example: 1 })
  dictCode: number;
}

/**
 * 更新字典数据结果响应 DTO
 */
export class UpdateDictDataResultResponseDto {
  @Expose()
  @ApiProperty({ description: '更新是否成功', example: true })
  success: boolean;
}

/**
 * 删除字典数据结果响应 DTO
 */
export class DeleteDictDataResultResponseDto {
  @Expose()
  @ApiProperty({ description: '删除的记录数', example: 1 })
  affected: number;
}

/**
 * 刷新缓存结果响应 DTO
 */
export class RefreshCacheResultResponseDto {
  @Expose()
  @ApiProperty({ description: '刷新是否成功', example: true })
  success: boolean;
}
