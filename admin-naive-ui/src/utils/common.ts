import { AcceptType } from '@/enum/business';
import { $t } from '@/locales';
/**
 * Transform record to option
 *
 * @example
 *   ```ts
 *   const record = {
 *     key1: 'label1',
 *     key2: 'label2'
 *   };
 *   const options = transformRecordToOption(record);
 *   // [
 *   //   { value: 'key1', label: 'label1' },
 *   //   { value: 'key2', label: 'label2' }
 *   // ]
 *   ```;
 *
 * @param record
 */
export function transformRecordToOption<T extends Record<string, string>>(record: T) {
  return Object.entries(record).map(([value, label]) => ({
    value,
    label,
  })) as CommonType.Option<keyof T, T[keyof T]>[];
}

export function transformRecordToNumberOption<T extends Record<string, string>>(record: T) {
  return Object.entries(record).map(([value, label]) => ({
    value,
    label,
  })) as CommonType.Option<keyof T>[];
}

/**
 * Translate options
 *
 * @param options
 */
export function translateOptions(options: CommonType.Option<string, App.I18n.I18nKey>[]) {
  return options.map((option) => ({
    ...option,
    label: $t(option.label),
  }));
}

/**
 * Toggle html class
 *
 * @param className
 */
export function toggleHtmlClass(className: string) {
  function add() {
    document.documentElement.classList.add(className);
  }

  function remove() {
    document.documentElement.classList.remove(className);
  }

  return {
    add,
    remove,
  };
}

/* 驼峰转换下划线 */
export function humpToLine(str: string, line: string = '-') {
  let temp = str.replace(/[A-Z]/g, (match) => {
    return `${line}${match.toLowerCase()}`;
  });
  // 如果首字母是大写，执行replace时会多一个_，这里需要去掉
  if (temp.slice(0, 1) === line) {
    temp = temp.slice(1);
  }
  return temp;
}

/** 判断是否为空 */
export function isNotNull(value: any) {
  return value !== undefined && value !== null && value !== '';
}

/** 判断是否为空 */
export function isNull(value: any) {
  return value === undefined || value === null || value === '';
}

/** 判断是否为图片类型 */
export function isImage(suffix: string) {
  return AcceptType.Image.split(',').includes(suffix.toLowerCase());
}

/**
 * 构造树型结构数据
 *
 * @param {T[]} data 数据源
 * @param {TreeConfig} config 配置选项
 * @returns {T[]} 树形结构数据
 */
export const handleTree = <T extends Record<string, any>>(data: T[], config: CommonType.TreeConfig): T[] => {
  if (!data?.length) {
    return [];
  }

  const {
    idField,
    parentIdField = 'parentId',
    childrenField = 'children',
    filterFn = () => true, // 添加过滤函数，默认为不过滤
  } = config;

  // 使用 Map 替代普通对象，提高性能
  const childrenMap = new Map<string | number, T[]>();
  const nodeMap = new Map<string | number, T>();
  const tree: T[] = [];

  // 第一遍遍历：构建节点映射
  for (const item of data) {
    const id = item[idField];
    const parentId = item[parentIdField];

    nodeMap.set(id, item);

    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    // 应用过滤函数
    if (filterFn(item)) {
      childrenMap.get(parentId)!.push(item);
    }
  }

  // 第二遍遍历：找出根节点
  for (const item of data) {
    const parentId = item[parentIdField];
    if (!nodeMap.has(parentId) && filterFn(item)) {
      tree.push(item);
    }
  }

  // 递归构建树形结构
  const buildTree = (node: T) => {
    const id = node[idField];
    const children = childrenMap.get(id);

    if (children?.length) {
      // 使用类型断言确保类型安全
      (node as any)[childrenField] = children;
      for (const child of children) {
        buildTree(child);
      }
    } else {
      // 如果没有子节点，设置为 undefined
      (node as any)[childrenField] = undefined;
    }
  };

  // 从根节点开始构建树
  for (const root of tree) {
    buildTree(root);
  }

  return tree;
};

/**
 * 将对象转换为 URLSearchParams
 *
 * @param obj
 */
export function transformToURLSearchParams(obj: Record<string, any>, excludeKeys: string[] = []) {
  const searchParams = new URLSearchParams();
  if (!isNotNull(obj)) {
    return searchParams;
  }
  Object.entries(obj).forEach(([key, value]) => {
    if (excludeKeys.includes(key)) {
      return;
    }
    if (typeof value === 'object') {
      transformToURLSearchParams(value).forEach((v, k) => {
        searchParams.append(`${key}[${k}]`, v);
      });
      return;
    }
    if (!isNotNull(value)) {
      return;
    }
    searchParams.append(key, value);
  });
  return searchParams;
}

/** 判断两个数组是否相等 */
export function arraysEqualSet(arr1: Array<any>, arr2: Array<any>) {
  return (
    arr1.length === arr2.length &&
    new Set(arr1).size === arr1.length &&
    new Set(arr2).size === arr2.length &&
    [...arr1].sort().join() === [...arr2].sort().join()
  );
}

/**
 * Format file size to human readable format
 *
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format date time to string
 *
 * @param date - Date string or Date object
 * @param format - Format pattern (default: 'YYYY-MM-DD HH:mm:ss')
 * @returns Formatted date string
 */
export function formatDateTime(date: string | Date | null | undefined, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * Get file extension from filename
 *
 * @param filename - File name
 * @returns File extension (lowercase, without dot)
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Get file icon based on file extension
 *
 * @param ext - File extension
 * @returns Icon name
 */
export function getFileIcon(ext: string): string {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'];
  const documentExts = ['doc', 'docx', 'pdf', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz'];
  const codeExts = ['js', 'ts', 'vue', 'html', 'css', 'json', 'xml', 'java', 'py', 'go', 'c', 'cpp'];

  if (imageExts.includes(ext)) return 'ant-design:file-image-outlined';
  if (videoExts.includes(ext)) return 'ant-design:video-camera-outlined';
  if (audioExts.includes(ext)) return 'ant-design:audio-outlined';
  if (documentExts.includes(ext)) return 'ant-design:file-text-outlined';
  if (archiveExts.includes(ext)) return 'ant-design:file-zip-outlined';
  if (codeExts.includes(ext)) return 'ant-design:file-outlined';

  return 'ant-design:file-unknown-outlined';
}
