import * as Lodash from 'lodash';
import { assertIdentifier, escapeMultilineText, escapeStringLiteral, isValidIdentifier } from '../../utils/sanitize';

interface ColumnInfo {
  javaField?: string;
  javaType?: string;
}

interface ControllerOptions {
  BusinessName: string;
  businessName: string;
  functionName?: string;
  moduleName: string;
  primaryKey?: string;
  tableComment?: string;
  columns?: ColumnInfo[];
  tenantAware?: boolean;
}

/**
 * NestJS Controller 模板生成器
 *
 * 生成符合项目规范的 Controller 代码，包含：
 * - 完整的 Swagger 装饰器 (@ApiTags, @ApiBearerAuth, @ApiOperation, @ApiResponse)
 * - 权限控制装饰器 (@RequirePermission)
 * - 统一响应格式 (@ApiDataResponse)
 * - 多租户支持 (tenantId 字段处理)
 *
 * C5 安全修复：所有外部输入字符串在拼入模板前都通过
 * escapeStringLiteral / escapeMultilineText / assertIdentifier 做严格转义或校验，
 * 防止列注释/函数名/模块名中含特殊字符（如 ` ' " $ \n {} ）破坏生成的 TS 代码或注入新代码。
 *
 * Requirements: 13.2, 13.4, 15.1-15.10
 */
export const controllerTem = (options: ControllerOptions) => {
  const {
    BusinessName,
    businessName,
    functionName,
    moduleName,
    primaryKey,
    tableComment,
    columns,
    tenantAware = false,
  } = options;

  // 安全：businessName / moduleName / primaryKey 必须为合法标识符，否则直接抛错
  assertIdentifier(businessName, 'businessName');
  assertIdentifier(moduleName, 'moduleName');
  if (primaryKey) {
    assertIdentifier(primaryKey, 'primaryKey');
  }

  const serviceName = `${Lodash.upperFirst(BusinessName)}Service`;
  const serviceInstance = `${businessName}Service`;
  const className = Lodash.upperFirst(BusinessName);
  const primaryKeyType = getPrimaryKeyType(options);

  // 检查是否有租户字段
  const hasTenantId = tenantAware || columns?.some((col: ColumnInfo) => col.javaField === 'tenantId');

  // 安全：functionName / tableComment 转义后用于注释/描述
  const safeFunctionName = escapeMultilineText(functionName ?? '');
  const safeTableComment = escapeMultilineText(tableComment ?? '');
  const safeBusinessName = escapeStringLiteral(businessName);

  return `import { Controller, Get, Post, Put, Body, Query, Param, Delete } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { ApiDataResponse } from 'src/core/http/decorators/api.decorator';
import { ${serviceName} } from './${businessName}.service';
import {
  Create${className}Dto,
  Update${className}Dto,
  Query${className}Dto,
  ${className}ResponseDto,
  ${className}ListResponseDto,
} from './dto/${businessName}.dto';

/**
 * ${safeFunctionName || safeTableComment || safeBusinessName}控制器
 *
 * @description 提供${safeFunctionName || safeTableComment || safeBusinessName}的增删改查接口
 */
@ApiTags('${safeFunctionName || safeTableComment || safeBusinessName}')
@ApiBearerAuth('Authorization')
@Controller('${moduleName}/${businessName}')
export class ${className}Controller {
  constructor(private readonly ${serviceInstance}: ${serviceName}) {}

  /**
   * 创建${safeFunctionName || safeBusinessName}
   */
  @Post()
  @ApiOperation({
    summary: '${safeFunctionName || safeBusinessName}-创建',
    description: '创建新的${safeFunctionName || safeTableComment || safeBusinessName}记录',
  })
  @ApiResponse({ status: 200, description: '创建成功', type: ${className}ResponseDto })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '无权限' })
  @ApiDataResponse(${className}ResponseDto)
  @RequirePermission('${moduleName}:${businessName}:add')
  create(@Body() createDto: Create${className}Dto) {
    return this.${serviceInstance}.create(createDto);
  }

  /**
   * 获取${safeFunctionName || safeBusinessName}列表
   */
  @Get('list')
  @ApiOperation({
    summary: '${safeFunctionName || safeBusinessName}-列表',
    description: '分页查询${safeFunctionName || safeTableComment || safeBusinessName}列表',
  })
  @ApiResponse({ status: 200, description: '查询成功', type: ${className}ListResponseDto })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiDataResponse(${className}ListResponseDto, true, true)
  @RequirePermission('${moduleName}:${businessName}:list')
  findAll(@Query() query: Query${className}Dto) {
    return this.${serviceInstance}.findAll(query);
  }

  /**
   * 获取${safeFunctionName || safeBusinessName}详情
   */
  @Get(':${primaryKey}')
  @ApiOperation({
    summary: '${safeFunctionName || safeBusinessName}-详情',
    description: '根据ID获取${safeFunctionName || safeTableComment || safeBusinessName}详情',
  })
  @ApiParam({
    name: '${primaryKey}',
    description: '${safeFunctionName || safeBusinessName}ID',
    type: '${primaryKeyType === 'number' ? 'number' : 'string'}',
    required: true,
  })
  @ApiResponse({ status: 200, description: '查询成功', type: ${className}ResponseDto })
  @ApiResponse({ status: 404, description: '数据不存在' })
  @ApiDataResponse(${className}ResponseDto)
  @RequirePermission('${moduleName}:${businessName}:query')
  findOne(@Param('${primaryKey}') ${primaryKey}: ${primaryKeyType}) {
    return this.${serviceInstance}.findOne(${primaryKeyType === 'number' ? `+${primaryKey}` : primaryKey});
  }

  /**
   * 更新${safeFunctionName || safeBusinessName}
   */
  @Put()
  @ApiOperation({
    summary: '${safeFunctionName || safeBusinessName}-修改',
    description: '更新${safeFunctionName || safeTableComment || safeBusinessName}信息',
  })
  @ApiResponse({ status: 200, description: '修改成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '数据不存在' })
  @ApiDataResponse()
  @RequirePermission('${moduleName}:${businessName}:edit')
  update(@Body() updateDto: Update${className}Dto) {
    return this.${serviceInstance}.update(updateDto);
  }

  /**
   * 删除${safeFunctionName || safeBusinessName}
   */
  @Delete(':${primaryKey}')
  @ApiOperation({
    summary: '${safeFunctionName || safeBusinessName}-删除',
    description: '根据ID删除${safeFunctionName || safeTableComment || safeBusinessName}，支持批量删除（逗号分隔）',
  })
  @ApiParam({
    name: '${primaryKey}',
    description: '${safeFunctionName || safeBusinessName}ID，多个用逗号分隔',
    type: 'string',
    required: true,
    example: '1,2,3',
  })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '数据不存在' })
  @ApiDataResponse()
  @RequirePermission('${moduleName}:${businessName}:remove')
  remove(@Param('${primaryKey}') ${primaryKey}: string) {
    const ${primaryKey}s = ${primaryKey}.split(',').map((id) => ${primaryKeyType === 'number' ? '+id' : 'id'});
    return this.${serviceInstance}.remove(${primaryKey}s);
  }
}
`;
};

/**
 * 获取主键类型
 */
const getPrimaryKeyType = (options: ControllerOptions) => {
  const { primaryKey, columns } = options;

  if (!primaryKey || !columns) {
    return 'string';
  }

  const primaryKeyColumn = columns.find((item: ColumnInfo) => item.javaField === primaryKey);
  if (!primaryKeyColumn) {
    return 'string';
  }

  return mapJavaTypeToTs(primaryKeyColumn.javaType);
};

/**
 * Java 类型映射到 TypeScript 类型
 */
const mapJavaTypeToTs = (javaType = 'String') => {
  switch (javaType) {
    case 'Number':
    case 'Integer':
    case 'Long':
    case 'Double':
    case 'BigDecimal':
      return 'number';
    case 'Boolean':
      return 'boolean';
    case 'Date':
      return 'string';
    case 'String':
    default:
      return 'string';
  }
};

// 安全导出：外部代码可校验字符串是否适合用作标识符
export { isValidIdentifier };