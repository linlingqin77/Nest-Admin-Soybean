import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotRequireAuth } from 'src/modules/users/user.decorator';
import { Result } from 'src/shared/response';
import {
  getAllErrorCodes,
  getErrorCodesByCategory,
  generateErrorCodeMarkdown,
  generateErrorCodeJson,
  ErrorCodeInfo,
  ErrorCodeCategory,
} from 'src/shared/response/error-codes.doc';

/**
 * API 文档控制器
 *
 * @description 提供 API 文档相关接口，包括错误码文档
 */
@ApiTags('API 文档')
@Controller('system/docs')
export class DocsController {
  /**
   * 获取所有错误码列表
   */
  @Get('error-codes')
  @NotRequireAuth()
  @ApiOperation({
    summary: '获取所有错误码',
    description: '返回系统中所有的错误码及其含义，按错误码排序',
  })
  @ApiResponse({
    status: 200,
    description: '成功返回错误码列表',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        msg: { type: 'string', example: '操作成功' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'number', example: 200 },
              message: { type: 'string', example: '操作成功' },
              category: { type: 'string', example: '成功' },
              description: { type: 'string', example: '请求处理成功' },
              solution: { type: 'string', example: '' },
            },
          },
        },
      },
    },
  })
  getErrorCodes(): Result<ErrorCodeInfo[]> {
    return Result.ok(getAllErrorCodes());
  }

  /**
   * 按分类获取错误码
   */
  @Get('error-codes/by-category')
  @NotRequireAuth()
  @ApiOperation({
    summary: '按分类获取错误码',
    description: '返回按分类组织的错误码列表',
  })
  @ApiResponse({
    status: 200,
    description: '成功返回分类错误码',
  })
  getErrorCodesByCategory(): Result<Record<ErrorCodeCategory, ErrorCodeInfo[]>> {
    return Result.ok(getErrorCodesByCategory());
  }

  /**
   * 获取 Markdown 格式的错误码文档
   */
  @Get('error-codes/markdown')
  @NotRequireAuth()
  @ApiOperation({
    summary: '获取 Markdown 格式错误码文档',
    description: '返回 Markdown 格式的完整错误码文档，可用于生成文档',
  })
  @ApiResponse({
    status: 200,
    description: '成功返回 Markdown 文档',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        msg: { type: 'string', example: '操作成功' },
        data: { type: 'string', example: '# API 错误码文档\n\n...' },
      },
    },
  })
  getErrorCodesMarkdown(): Result<string> {
    return Result.ok(generateErrorCodeMarkdown());
  }

  /**
   * 获取 JSON 格式的错误码文档
   */
  @Get('error-codes/json')
  @NotRequireAuth()
  @ApiOperation({
    summary: '获取 JSON 格式错误码文档',
    description: '返回 JSON 格式的完整错误码文档，包含分类和详细说明',
  })
  @ApiResponse({
    status: 200,
    description: '成功返回 JSON 文档',
  })
  getErrorCodesJson(): Result<object> {
    return Result.ok(generateErrorCodeJson());
  }
}
