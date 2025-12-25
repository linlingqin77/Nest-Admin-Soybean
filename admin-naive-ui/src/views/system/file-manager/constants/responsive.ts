/**
 * 文件管理响应式配置
 * 基于百度网盘设计规范
 */

/** 网格视图列数断点配置 */
export const GRID_COLS_BREAKPOINTS = {
  /** 默认 (≥1920px) */
  default: 8,
  /** 超大屏 (≥1920px) */
  1920: 8,
  /** 大屏 (≥1600px) */
  1600: 7,
  /** 中大屏 (≥1280px) */
  1280: 6,
  /** 中屏 (≥1024px) */
  1024: 5,
  /** 小屏 (≥768px) */
  768: 4,
  /** 平板 (≥640px) */
  640: 3,
  /** 手机 (≥480px) */
  480: 2,
  /** 小手机 (<480px) */
  xs: 1,
} as const;

/** 响应式断点 (px) */
export const BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1600,
  '3xl': 1920,
} as const;

/** 获取当前屏幕宽度对应的网格列数 */
export function getGridCols(width: number): number {
  if (width >= BREAKPOINTS['3xl']) return GRID_COLS_BREAKPOINTS[1920];
  if (width >= BREAKPOINTS['2xl']) return GRID_COLS_BREAKPOINTS[1600];
  if (width >= BREAKPOINTS.xl) return GRID_COLS_BREAKPOINTS[1280];
  if (width >= BREAKPOINTS.lg) return GRID_COLS_BREAKPOINTS[1024];
  if (width >= BREAKPOINTS.md) return GRID_COLS_BREAKPOINTS[768];
  if (width >= BREAKPOINTS.sm) return GRID_COLS_BREAKPOINTS[640];
  if (width >= BREAKPOINTS.xs) return GRID_COLS_BREAKPOINTS[480];
  return GRID_COLS_BREAKPOINTS.xs;
}

/** 动态计算网格列数（基于容器宽度） */
export function calculateGridCols(containerWidth: number, cardWidth: number, gap: number): number {
  const availableWidth = containerWidth - gap;
  const cols = Math.floor(availableWidth / (cardWidth + gap));
  return Math.max(1, cols);
}
