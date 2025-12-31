import { get } from 'lodash';

/**
 * 从函数字符串中提取参数名列表
 */
function getArgs(func: (...args: unknown[]) => unknown): string[] | null {
  const funcString = func.toString();
  return funcString.slice(funcString.indexOf('(') + 1, funcString.indexOf(')')).match(/([^\s,]+)/g);
}

/**
 * 字符串格式化，替换 {key} 占位符
 */
const stringFormat = (str: string, callback: (key: string) => string): string => {
  return str.replace(/\{([^}]+)\}/g, (_word, key) => callback(key));
};

/**
 * 根据格式化字符串和参数生成缓存 key
 */
export function paramsKeyFormat(func: (...args: unknown[]) => unknown, formatKey: string, args: unknown[]): string | null {
  const originMethodArgs = getArgs(func);

  const paramsMap: Record<string, unknown> = {};

  originMethodArgs?.forEach((arg, index) => {
    paramsMap[arg] = args[index];
  });

  let isNotGet = false;
  const key = stringFormat(formatKey, (key) => {
    const str = get(paramsMap, key) as string | undefined;
    if (!str) isNotGet = true;
    return str ?? '';
  });

  if (isNotGet) {
    return null;
  }

  return key;
}

/**
 * 从参数中获取对象
 */
export function paramsKeyGetObj(func: (...args: unknown[]) => unknown, formatKey: string | undefined, args: unknown[]): Record<string, unknown> | null {
  const originMethodArgs = getArgs(func);

  const paramsMap: Record<string, unknown> = {};

  originMethodArgs?.forEach((arg, index) => {
    paramsMap[arg] = args[index];
  });

  const obj = get(paramsMap, formatKey);

  if (typeof obj === 'object' && obj !== null) return obj as Record<string, unknown>;

  if (args[0] && typeof args[0] === 'object') return args[0] as Record<string, unknown>;

  return null;
}
