import * as Lodash from 'lodash';

/**
 * NestJS Controller 模板生成器
 *
 * 生成符合项目规范的 Controller 代码，包含：
 * - 完整的 Swagger 装饰器 (@ApiTags, @ApiBearerAuth, @ApiOperation, @ApiResponse)
 * - 权限控制装饰器 (@RequirePermission)
 * - 统一响应格式 (@ApiDataResponse)
 * - 多租户支持 (tenantId 字段处理)
 *
 * Requirements: 13.2, 13.4, 15.1-15.10
 */
export const controllerTem = (options) => {
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

  const serviceName = `${Lodash.upperFirst(BusinessName)}Service`;
  const serviceInstance = `${businessName}Service`;
  const className = Lodash.upperFirst(BusinessName);
  const primaryKeyType = getPrimaryKeyType(options);

  // 检查是否有租户字段
  const hasTenantId = tenantAware || columns?.some((col) => col.javaField === 'tenantId');

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
 * ${functionName || tableComment || businessName}控制器
 *
 * @description 提供${functionName || tableComment || businessName}的增删改查接口
 */
@ApiTags('${functionName || tableComment || businessName}')
@ApiBearerAuth('Authorization')
@Controller('${moduleName}/${businessName}')
export class ${className}Controller {
  constructor(private readonly ${serviceInstance}: ${serviceName}) {}

  /**
   * 创建${functionName || businessName}
   */
  @Post()
  @ApiOperation({
    summary: '${functionName || businessName}-创建',
    description: '创建新的${functionName || tableComment || businessName}记录',
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
   * 获取${functionName || businessName}列表
   */
  @Get('list')
  @ApiOperation({
    summary: '${functionName || businessName}-列表',
    description: '分页查询${functionName || tableComment || businessName}列表',
  })
  @ApiResponse({ status: 200, description: '查询成功', type: ${className}ListResponseDto })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiDataResponse(${className}ListResponseDto, true, true)
  @RequirePermission('${moduleName}:${businessName}:list')
  findAll(@Query() query: Query${className}Dto) {
    return this.${serviceInstance}.findAll(query);
  }

  /**
   * 获取${functionName || businessName}详情
   */
  @Get(':${primaryKey}')
  @ApiOperation({
    summary: '${functionName || businessName}-详情',
    description: '根据ID获取${functionName || tableComment || businessName}详情',
  })
  @ApiParam({
    name: '${primaryKey}',
    description: '${functionName || businessName}ID',
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
   * 更新${functionName || businessName}
   */
  @Put()
  @ApiOperation({
    summary: '${functionName || businessName}-修改',
    description: '更新${functionName || tableComment || businessName}信息',
  })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '数据不存在' })
  @ApiDataResponse()
  @RequirePermission('${moduleName}:${businessName}:edit')
  update(@Body() updateDto: Update${className}Dto) {
    return this.${serviceInstance}.update(updateDto);
  }

  /**
   * 删除${functionName || businessName}
   */
  @Delete(':${primaryKey}')
  @ApiOperation({
    summary: '${functionName || businessName}-删除',
    description: '根据ID删除${functionName || tableComment || businessName}，支持批量删除（逗号分隔）',
  })
  @ApiParam({
    name: '${primaryKey}',
    description: '${functionName || businessName}ID，多个用逗号分隔',
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
const getPrimaryKeyType = (options) => {
  const { primaryKey, columns } = options;

  if (!primaryKey || !columns) {
    return 'string';
  }

  const primaryKeyColumn = columns.find((item) => item.javaField === primaryKey);
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
