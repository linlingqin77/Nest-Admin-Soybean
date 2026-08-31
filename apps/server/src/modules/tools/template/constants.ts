/**
 * Vue 代码生成模板常量配置
 * 用于消除模板中的魔法数字
 */

export const TEMPLATE_CONSTANTS = {
  /**
   * 图片预览尺寸
   */
  IMAGE_PREVIEW: {
    WIDTH: 50,
    HEIGHT: 50,
  },

  /**
   * 编辑器配置
   */
  EDITOR: {
    MIN_HEIGHT: 192,
  },

  /**
   * 对话框配置
   */
  DIALOG: {
    WIDTH: '500',
    WIDTH_LARGE: '800',
  },

  /**
   * 布局配置
   */
  LAYOUT: {
    ROW_GUTTER: 10,
    MARGIN_BOTTOM: 8,
  },

  /**
   * 表格配置
   */
  TABLE: {
    SELECTION_WIDTH: 55,
    DATE_COLUMN_WIDTH: 180,
    STATUS_COLUMN_WIDTH: 100,
  },

  /**
   * 表单配置
   */
  FORM: {
    LABEL_WIDTH: '80px',
    LABEL_WIDTH_LARGE: '120px',
  },
} as const;

/**
 * 获取图片预览尺寸属性
 */
export function getImagePreviewSize() {
  return {
    width: TEMPLATE_CONSTANTS.IMAGE_PREVIEW.WIDTH,
    height: TEMPLATE_CONSTANTS.IMAGE_PREVIEW.HEIGHT,
  };
}

/**
 * 获取表格列宽配置
 */
export function getTableColumnWidth(type: 'selection' | 'date' | 'status'): number {
  const widthMap = {
    selection: TEMPLATE_CONSTANTS.TABLE.SELECTION_WIDTH,
    date: TEMPLATE_CONSTANTS.TABLE.DATE_COLUMN_WIDTH,
    status: TEMPLATE_CONSTANTS.TABLE.STATUS_COLUMN_WIDTH,
  };
  return widthMap[type];
}
