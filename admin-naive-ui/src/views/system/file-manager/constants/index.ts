/**
 * 文件管理常量统一导出
 */

export * from './layout';
export * from './responsive';

/** 文件类型分类常量（百度网盘风格） */
export const FILE_TYPE_CATEGORIES = {
  all: { label: '全部文件', icon: 'i-carbon-folder-open', exts: [] },
  image: {
    label: '图片',
    icon: 'i-carbon-image',
    exts: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'],
  },
  video: {
    label: '视频',
    icon: 'i-carbon-video',
    exts: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v', '3gp', 'qt'],
  },
  document: {
    label: '文档',
    icon: 'i-carbon-document',
    exts: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'txt', 'md', 'csv'],
  },
  audio: {
    label: '音频',
    icon: 'i-carbon-music',
    exts: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'],
  },
  archive: {
    label: '压缩包',
    icon: 'i-carbon-zip-folder',
    exts: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
  },
  code: {
    label: '代码',
    icon: 'i-carbon-code',
    exts: [
      'js',
      'ts',
      'jsx',
      'tsx',
      'vue',
      'html',
      'css',
      'scss',
      'less',
      'json',
      'xml',
      'py',
      'java',
      'c',
      'cpp',
      'go',
      'rs',
      'php',
      'rb',
      'swift',
    ],
  },
  other: { label: '其他', icon: 'i-carbon-document-blank', exts: [] },
} as const;

export type FileTypeCategory = keyof typeof FILE_TYPE_CATEGORIES;

/** 根据扩展名判断文件类型 */
export function getFileTypeCategory(ext?: string): FileTypeCategory {
  if (!ext) return 'other';
  const lowerExt = ext.toLowerCase().replace('.', '');

  for (const [category, config] of Object.entries(FILE_TYPE_CATEGORIES)) {
    if (category === 'all' || category === 'other') continue;
    if ((config.exts as readonly string[]).includes(lowerExt)) {
      return category as FileTypeCategory;
    }
  }

  return 'other';
}

/** 根据文件类型获取图标 */
export function getFileIcon(ext?: string, isFolder?: boolean): string {
  if (isFolder) return 'i-carbon-folder';

  const category = getFileTypeCategory(ext);
  return FILE_TYPE_CATEGORIES[category].icon;
}

/** 格式化文件大小 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/** 格式化日期 */
export function formatDate(date?: string | Date): string {
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  // 小于1分钟
  if (diff < 60 * 1000) {
    return '刚刚';
  }

  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`;
  }

  // 小于1天
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`;
  }

  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}天前`;
  }

  // 格式化为 YYYY-MM-DD HH:mm
  return d
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    .replace(/\//g, '-');
}
