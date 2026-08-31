/**
 * Vue3 API 服务模板
 *
 * 生成符合项目规范的 API 服务文件
 * - 使用 fetchXxx 命名规范
 * - 包含 TypeScript 类型定义
 * - 使用 @/service/request 请求工具
 *
 * @modules vue/api
 */

export interface ApiTemplateOptions {
  /** 业务名称 (PascalCase) */
  BusinessName: string;
  /** 业务名称 (camelCase) */
  businessName: string;
  /** 模块名称 */
  moduleName: string;
  /** 功能名称 (中文) */
  functionName: string;
  /** 主键字段名 */
  primaryKey: string;
  /** 表注释 */
  tableComment?: string;
  /** 列配置 */
  columns: Array<{
    javaField: string;
    javaType: string;
    columnComment: string;
    isPk: string;
    isInsert: string;
    isEdit: string;
    isList: string;
    isQuery: string;
    isRequired: string;
    queryType: string;
    htmlType: string;
    dictType?: string;
  }>;
}

/**
 * 生成 API 服务文件
 */
export function apiTemplate(options: ApiTemplateOptions): string {
  const { BusinessName, moduleName, functionName, businessName, primaryKey, columns } = options;

  // 生成类型定义
  const typeDefinitions = generateTypeDefinitions(options);

  // 生成查询参数类型
  const queryColumns = columns.filter((col) => col.isQuery === '1');

  return `import { request } from 'src/service/request';

${typeDefinitions}

/**
 * 获取${functionName}列表
 */
export function fetch${BusinessName}List(params?: ${BusinessName}SearchParams) {
  return request<${BusinessName}List>({
    url: '/${moduleName}/${businessName}/list',
    method: 'get',
    params,
  });
}

/**
 * 获取${functionName}详情
 */
export function fetch${BusinessName}Detail(${primaryKey}: CommonType.IdType) {
  return request<${BusinessName}Record>({
    url: \`/${moduleName}/${businessName}/\${${primaryKey}}\`,
    method: 'get',
  });
}

/**
 * 新增${functionName}
 */
export function fetchCreate${BusinessName}(data: Create${BusinessName}Params) {
  return request<boolean>({
    url: '/${moduleName}/${businessName}',
    method: 'post',
    data,
  });
}

/**
 * 修改${functionName}
 */
export function fetchUpdate${BusinessName}(data: Update${BusinessName}Params) {
  return request<boolean>({
    url: '/${moduleName}/${businessName}',
    method: 'put',
    data,
  });
}

/**
 * 删除${functionName}
 */
export function fetchDelete${BusinessName}(${primaryKey}: CommonType.IdType | CommonType.IdType[]) {
  const ids = Array.isArray(${primaryKey}) ? ${primaryKey}.join(',') : ${primaryKey};
  return request<boolean>({
    url: \`/${moduleName}/${businessName}/\${ids}\`,
    method: 'delete',
  });
}

/**
 * 导出${functionName}
 */
export function fetchExport${BusinessName}(params?: ${BusinessName}SearchParams) {
  return request<Blob>({
    url: '/${moduleName}/${businessName}/export',
    method: 'post',
    data: params,
    responseType: 'blob',
  });
}
`;
}

/**
 * 生成 TypeScript 类型定义
 */
function generateTypeDefinitions(options: ApiTemplateOptions): string {
  const { BusinessName, columns, primaryKey } = options;

  // 列表字段
  const listColumns = columns.filter((col) => col.isList === '1' || col.isPk === '1');
  // 查询字段
  const queryColumns = columns.filter((col) => col.isQuery === '1');
  // 新增字段
  const insertColumns = columns.filter((col) => col.isInsert === '1' && col.isPk !== '1');
  // 编辑字段
  const editColumns = columns.filter((col) => col.isEdit === '1' || col.isPk === '1');

  // 生成字段类型
  const generateFieldType = (col: ApiTemplateOptions['columns'][0]): string => {
    switch (col.javaType) {
      case 'Number':
      case 'number':
        return 'number';
      case 'Boolean':
      case 'boolean':
        return 'boolean';
      case 'Date':
        return 'string';
      default:
        return 'string';
    }
  };

  // 生成记录类型
  const recordFields = listColumns
    .map((col) => {
      const comment = col.columnComment.split('（')[0].split('(')[0];
      const type = generateFieldType(col);
      return `  /** ${comment} */\n  ${col.javaField}${col.isRequired === '1' ? '' : '?'}: ${type};`;
    })
    .join('\n');

  // 生成查询参数类型
  const searchFields = queryColumns
    .map((col) => {
      const comment = col.columnComment.split('（')[0].split('(')[0];
      const type = generateFieldType(col);
      // 查询参数都是可选的
      return `  /** ${comment} */\n  ${col.javaField}?: ${type};`;
    })
    .join('\n');

  // 生成新增参数类型
  const createFields = insertColumns
    .map((col) => {
      const comment = col.columnComment.split('（')[0].split('(')[0];
      const type = generateFieldType(col);
      return `  /** ${comment} */\n  ${col.javaField}${col.isRequired === '1' ? '' : '?'}: ${type};`;
    })
    .join('\n');

  // 生成更新参数类型
  const updateFields = editColumns
    .map((col) => {
      const comment = col.columnComment.split('（')[0].split('(')[0];
      const type = generateFieldType(col);
      // 主键必填，其他可选
      return `  /** ${comment} */\n  ${col.javaField}${col.isPk === '1' ? '' : '?'}: ${type};`;
    })
    .join('\n');

  return `/** ${options.functionName}记录 */
export interface ${BusinessName}Record {
${recordFields}
}

/** ${options.functionName}列表 */
export interface ${BusinessName}List {
  rows: ${BusinessName}Record[];
  total: number;
  pageNum: number;
  pageSize: number;
  pages: number;
}

/** ${options.functionName}查询参数 */
export interface ${BusinessName}SearchParams {
  /** 页码 */
  pageNum?: number;
  /** 每页条数 */
  pageSize?: number;
${searchFields}
}

/** 新增${options.functionName}参数 */
export interface Create${BusinessName}Params {
${createFields}
}

/** 更新${options.functionName}参数 */
export interface Update${BusinessName}Params {
${updateFields}
}`;
}

// 保持向后兼容的旧函数名
export const apiTempalte = apiTemplate;
