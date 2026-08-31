/**
 * 代码生成工具 DTO 统一导出
 */

// === GenTable DTO ===
export {
  TplCategory,
  TplWebType,
  CreateGenTableDto,
  UpdateGenTableDto,
  ListGenTableRequestDto,
  ListDbTableRequestDto,
  ImportTablesDto,
  TableIdsDto,
  GenerateCodeDto,
  SyncTableDto,
  BatchGenCodeDto,
} from './gen-table.dto';

// === GenTableColumn DTO ===
export {
  QueryType,
  HtmlType,
  CreateGenTableColumnDto,
  GenTableColumnUpdateDto,
  ColumnSortDto,
  BatchColumnSortDto,
} from './gen-table-column.dto';

// === 响应 DTO ===
export * from './responses';

// === 向后兼容别名（已废弃，请使用新的 DTO） ===
// @deprecated 请使用 ImportTablesDto
export { ImportTablesDto as TableName } from './gen-table.dto';
// @deprecated 请使用 ListDbTableRequestDto
export { ListDbTableRequestDto as GenDbTableList } from './gen-table.dto';
// @deprecated 请使用 ListGenTableRequestDto
export { ListGenTableRequestDto as GenTableList } from './gen-table.dto';
// @deprecated 请使用 UpdateGenTableDto
export { UpdateGenTableDto as GenTableUpdate } from './gen-table.dto';
// @deprecated 请使用 TableIdsDto
export { TableIdsDto as TableId } from './gen-table.dto';
// @deprecated 请使用 GenTableColumnUpdateDto
export { GenTableColumnUpdateDto as genTableCloumnUpdate } from './gen-table-column.dto';
