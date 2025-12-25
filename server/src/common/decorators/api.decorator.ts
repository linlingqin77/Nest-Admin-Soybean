import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiConsumes,
  ApiProduces,
  ApiSecurity,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Result } from '../response';

/**
 * 路径参数配置
 */
export interface ApiParamOption {
  /** 参数名称 */
  name: string;
  /** 参数描述 */
  description?: string;
  /** 参数类型 */
  type?: 'string' | 'number' | 'boolean';
  /** 是否必填，默认 true */
  required?: boolean;
  /** 示例值 */
  example?: any;
  /** 枚举值 */
  enum?: any[];
}

/**
 * 查询参数配置
 */
export interface ApiQueryOption {
  /** 参数名称 */
  name: string;
  /** 参数描述 */
  description?: string;
  /** 参数类型 */
  type?: 'string' | 'number' | 'boolean' | 'array';
  /** 是否必填，默认 false */
  required?: boolean;
  /** 示例值 */
  example?: any;
  /** 枚举值 */
  enum?: any[];
  /** 是否允许为空 */
  allowEmptyValue?: boolean;
}

/**
 * 请求头配置
 */
export interface ApiHeaderOption {
  /** 请求头名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 是否必填 */
  required?: boolean;
  /** 示例值 */
  example?: string;
}

/**
 * 自定义响应配置
 */
export interface ApiResponseOption {
  /** 响应描述 */
  description: string;
  /** 响应数据类型 */
  type?: Type<any>;
  /** 是否为数组 */
  isArray?: boolean;
}

/**
 * 文件上传配置
 */
export interface FileUploadOption {
  /** 文件字段名，默认 'file' */
  fieldName?: string;
  /** 是否多文件，默认 false */
  multiple?: boolean;
  /** 文件描述 */
  description?: string;
  /** 允许的文件类型 */
  allowedTypes?: string[];
  /** 最大文件大小描述 */
  maxSize?: string;
}

/**
 * API 装饰器配置选项
 */
export interface ApiOptions {
  /**
   * 接口摘要（必填）
   */
  summary: string;

  /**
   * 接口详细描述
   */
  description?: string;

  /**
   * 请求体类型
   */
  body?: Type<any>;

  /**
   * 响应 data 字段的类型
   */
  type?: Type<any>;

  /**
   * 响应 data 是否为数组
   */
  isArray?: boolean;

  /**
   * 是否为分页格式 { rows: T[], total: number }
   */
  isPager?: boolean;

  /**
   * 是否标记为已弃用
   */
  deprecated?: boolean;

  /**
   * 路径参数配置
   * @example [{ name: 'id', description: '用户ID', type: 'number' }]
   */
  params?: ApiParamOption[];

  /**
   * 查询参数配置
   * @example [{ name: 'keyword', description: '搜索关键词', required: false }]
   */
  queries?: ApiQueryOption[];

  /**
   * 自定义请求头
   * @example [{ name: 'X-Custom-Header', description: '自定义头' }]
   */
  headers?: ApiHeaderOption[];

  /**
   * 请求 Content-Type
   * @example ['multipart/form-data']
   */
  consumes?: string[];

  /**
   * 响应 Content-Type
   * @example ['application/json', 'application/xml']
   */
  produces?: string[];

  /**
   * 是否需要认证，设为 false 可关闭认证标记
   */
  security?: boolean;

  /**
   * 方法级别的额外标签
   */
  tags?: string[];

  /**
   * 自定义操作 ID
   */
  operationId?: string;

  /**
   * 自定义多状态码响应
   * @example { 400: { description: '参数错误' }, 404: { description: '资源不存在' } }
   */
  responses?: Record<number, ApiResponseOption>;

  /**
   * 请求示例
   */
  requestExample?: any;

  /**
   * 响应示例
   */
  responseExample?: any;

  /**
   * 文件上传配置，设为 true 使用默认配置，或传入对象自定义
   * @example true
   * @example { fieldName: 'avatar', maxSize: '2MB', allowedTypes: ['image/jpeg', 'image/png'] }
   */
  fileUpload?: boolean | FileUploadOption;
}

/**
 * 基础类型名称列表
 */
const baseTypeNames = ['String', 'Number', 'Boolean'];

/**
 * 构建响应 data 字段的 schema
 */
function buildDataSchema(type?: Type<any>, isArray?: boolean, isPager?: boolean) {
  // 无类型时返回简单成功标识
  if (!type) {
    return {
      type: 'object',
      properties: {
        value: {
          type: 'boolean',
          default: true,
        },
      },
      nullable: true,
    };
  }

  const isBaseType = baseTypeNames.includes(type.name);
  const items = isBaseType ? { type: type.name.toLowerCase() } : { $ref: getSchemaPath(type) };

  // 分页格式: { rows: T[], total: number }
  if (isArray && isPager) {
    return {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items,
        },
        total: {
          type: 'number',
          default: 0,
        },
      },
    };
  }

  // 纯数组格式: T[]
  if (isArray) {
    return {
      type: 'array',
      items,
    };
  }

  // 单对象格式: T
  return items;
}

/**
 * 统一 API 装饰器
 *
 * 合并 @ApiOperation、@ApiBody、@ApiResponse 等常用装饰器
 * 自动包装统一响应格式 { code, msg, data }
 *
 * @example
 * // 简单用法
 * @Api({ summary: '创建部门', body: CreateDeptDto })
 *
 * // 带响应类型
 * @Api({ summary: '部门详情', type: DeptVo })
 *
 * // 分页列表
 * @Api({ summary: '部门列表', type: DeptVo, isArray: true, isPager: true })
 *
 * // 文件上传
 * @Api({ summary: '上传头像', fileUpload: { fieldName: 'avatar', maxSize: '2MB' } })
 *
 * // 完整配置
 * @Api({
 *   summary: '用户详情',
 *   description: '根据用户ID获取用户详细信息',
 *   params: [{ name: 'id', description: '用户ID', type: 'number' }],
 *   type: UserVo,
 *   responses: { 404: { description: '用户不存在' } },
 * })
 */
export const Api = (options: ApiOptions) => {
  const {
    summary,
    description,
    body,
    type,
    isArray,
    isPager,
    deprecated,
    params,
    queries,
    headers,
    consumes,
    produces,
    security,
    tags,
    operationId,
    responses,
    requestExample,
    responseExample,
    fileUpload,
  } = options;

  const decorators: (ClassDecorator | MethodDecorator | PropertyDecorator)[] = [];

  // 1. ApiOperation - 接口基本信息
  const operationOptions: any = {
    summary,
    description,
    deprecated,
  };
  if (operationId) {
    operationOptions.operationId = operationId;
  }
  decorators.push(ApiOperation(operationOptions));

  // 2. ApiTags - 方法级别额外标签
  if (tags && tags.length > 0) {
    decorators.push(ApiTags(...tags));
  }

  // 3. 文件上传处理
  if (fileUpload) {
    const uploadConfig: FileUploadOption = typeof fileUpload === 'boolean' ? { fieldName: 'file' } : fileUpload;

    const { fieldName = 'file', multiple, description: fileDesc, allowedTypes, maxSize } = uploadConfig;

    // 设置 Content-Type
    decorators.push(ApiConsumes('multipart/form-data'));

    // 构建文件字段描述
    let fieldDescription = fileDesc || '上传文件';
    if (allowedTypes && allowedTypes.length > 0) {
      fieldDescription += `，支持格式: ${allowedTypes.join(', ')}`;
    }
    if (maxSize) {
      fieldDescription += `，最大: ${maxSize}`;
    }

    // 文件上传 Body
    decorators.push(
      ApiBody({
        schema: {
          type: 'object',
          properties: {
            [fieldName]: multiple
              ? {
                  type: 'array',
                  items: { type: 'string', format: 'binary' },
                  description: fieldDescription,
                }
              : {
                  type: 'string',
                  format: 'binary',
                  description: fieldDescription,
                },
          },
          required: [fieldName],
        },
      }),
    );
  } else if (body) {
    // 4. ApiBody - 请求体（如有）
    const bodyOptions: any = {
      type: body,
      required: true,
    };
    if (requestExample) {
      bodyOptions.examples = {
        default: {
          summary: '请求示例',
          value: requestExample,
        },
      };
    }
    decorators.push(ApiBody(bodyOptions));
  }

  // 5. ApiConsumes - 请求 Content-Type（非文件上传时）
  if (!fileUpload && consumes && consumes.length > 0) {
    decorators.push(ApiConsumes(...consumes));
  }

  // 6. ApiProduces - 响应 Content-Type
  if (produces && produces.length > 0) {
    decorators.push(ApiProduces(...produces));
  }

  // 7. ApiParam - 路径参数
  if (params && params.length > 0) {
    params.forEach((param) => {
      decorators.push(
        ApiParam({
          name: param.name,
          description: param.description,
          type: param.type || 'string',
          required: param.required !== false,
          example: param.example,
          enum: param.enum,
        }),
      );
    });
  }

  // 8. ApiQuery - 查询参数
  if (queries && queries.length > 0) {
    queries.forEach((query) => {
      decorators.push(
        ApiQuery({
          name: query.name,
          description: query.description,
          type: query.type || 'string',
          required: query.required === true,
          example: query.example,
          enum: query.enum,
          allowEmptyValue: query.allowEmptyValue,
        }),
      );
    });
  }

  // 9. ApiHeader - 自定义请求头
  if (headers && headers.length > 0) {
    headers.forEach((header) => {
      decorators.push(
        ApiHeader({
          name: header.name,
          description: header.description,
          required: header.required,
          example: header.example,
        }),
      );
    });
  }

  // 10. ApiSecurity - 认证配置
  if (security === false) {
    // 关闭认证标记（空数组表示不需要认证）
    decorators.push(ApiSecurity({}));
  }

  // 11. 收集需要额外注册的模型
  const extraModels: Type<any>[] = [Result];
  const isBaseType = type && baseTypeNames.includes(type.name);
  if (type && !isBaseType) {
    extraModels.push(type);
  }
  if (body && !baseTypeNames.includes(body.name)) {
    extraModels.push(body);
  }
  // 收集自定义响应中的类型
  if (responses) {
    Object.values(responses).forEach((resp) => {
      if (resp.type && !baseTypeNames.includes(resp.type.name)) {
        extraModels.push(resp.type);
      }
    });
  }

  // 12. ApiExtraModels - 注册额外模型
  decorators.push(ApiExtraModels(...extraModels));

  // 13. ApiOkResponse - 成功响应（统一格式）
  const dataSchema = buildDataSchema(type, isArray, isPager);
  const okResponseOptions: any = {
    description: '操作成功',
    schema: {
      allOf: [
        { $ref: getSchemaPath(Result) },
        {
          properties: {
            data: dataSchema,
          },
        },
      ],
    },
  };
  if (responseExample) {
    okResponseOptions.schema.example = {
      code: 200,
      msg: '操作成功',
      data: responseExample,
    };
  }
  decorators.push(ApiOkResponse(okResponseOptions));

  // 14. 自定义多状态码响应
  if (responses) {
    Object.entries(responses).forEach(([statusCode, respOption]) => {
      const status = parseInt(statusCode, 10);
      const respSchema: any = {
        properties: {
          code: { type: 'number', example: status },
          msg: { type: 'string', example: respOption.description },
          data: { type: 'object', nullable: true },
        },
      };

      if (respOption.type) {
        const respIsBaseType = baseTypeNames.includes(respOption.type.name);
        const respItems = respIsBaseType
          ? { type: respOption.type.name.toLowerCase() }
          : { $ref: getSchemaPath(respOption.type) };

        respSchema.properties.data = respOption.isArray ? { type: 'array', items: respItems } : respItems;
      }

      decorators.push(
        ApiResponse({
          status,
          description: respOption.description,
          schema: respSchema,
        }),
      );
    });
  }

  // 15. 默认错误响应（如果没有自定义）
  const hasCustom401 = responses && responses[401];
  const hasCustom403 = responses && responses[403];
  const hasCustom500 = responses && responses[500];

  if (!hasCustom401) {
    decorators.push(
      ApiResponse({
        status: 401,
        description: '未登录或登录已过期',
        schema: {
          properties: {
            code: { type: 'number', example: 401 },
            msg: { type: 'string', example: '请先登录' },
            data: { type: 'object', nullable: true },
          },
        },
      }),
    );
  }

  if (!hasCustom403) {
    decorators.push(
      ApiResponse({
        status: 403,
        description: '无权限访问',
        schema: {
          properties: {
            code: { type: 'number', example: 403 },
            msg: { type: 'string', example: '没有操作权限' },
            data: { type: 'object', nullable: true },
          },
        },
      }),
    );
  }

  if (!hasCustom500) {
    decorators.push(
      ApiResponse({
        status: 500,
        description: '服务器内部错误',
        schema: {
          properties: {
            code: { type: 'number', example: 500 },
            msg: { type: 'string', example: '系统异常' },
            data: { type: 'object', nullable: true },
          },
        },
      }),
    );
  }

  return applyDecorators(...decorators);
};

/**
 * @deprecated 请使用 Api 装饰器代替
 * 保留用于向后兼容
 */
export const ApiDataResponse = <TModel extends Type<any>>(model?: TModel, isArray?: boolean, isPager?: boolean) => {
  const extraModels: Type<any>[] = [Result];
  const isBaseType = model && baseTypeNames.includes(model.name);
  if (model && !isBaseType) {
    extraModels.push(model);
  }

  const dataSchema = buildDataSchema(model, isArray, isPager);

  return applyDecorators(
    ApiExtraModels(...extraModels),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(Result) },
          {
            properties: {
              data: dataSchema,
            },
          },
        ],
      },
    }),
  );
};
