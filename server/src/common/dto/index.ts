/**
 * 通用 DTO 导出入口
 */
export * from './base.dto';
export * from './dept-tree-node.vo';

// 重新导出分页相关类型，方便使用
export {
  PageQueryDto,
  CursorPaginationDto,
  PageResponseDto,
  CursorPageResponseDto,
  CursorPaginationMeta,
  SortOrder,
  DateRangeDto,
} from './base.dto';
