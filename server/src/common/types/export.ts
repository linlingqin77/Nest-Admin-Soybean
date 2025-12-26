/**
 * Export Type Definitions
 * 导出相关类型定义
 */

/**
 * Export header configuration
 * 导出表头配置
 */
export type ExportHeader = {
  title: string;
  dataIndex: string;
  width?: number;
  formateStr?: (value: unknown) => string;
};

/**
 * Export options configuration
 * 导出选项配置
 */
export type ExportOptions = {
  data: Record<string, unknown>[];
  header: ExportHeader[];
  filename?: string;
  sheetName?: string;
  dictMap?: Record<string, Record<string | number, string>>;
};
