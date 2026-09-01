import { Controller, Get, Delete, Query, Param, ParseIntPipe, Res, Body, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { Response } from 'express';
import { HistoryService, QueryHistoryDto } from './history.service';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions/business.exception';
import archiver from 'archiver';
import * as path from 'path';
import * as fs from 'fs-extra';
import { IsOptional, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 历史记录查询 DTO
 */
class QueryHistoryParamsDto {
  @ApiPropertyOptional({ description: '表ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  tableId?: number;

  @ApiPropertyOptional({ description: '表名（模糊匹配）', example: 'sys_user' })
  @IsOptional()
  @IsString()
  tableName?: string;

  @ApiPropertyOptional({ description: '页码', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageNum?: number;

  @ApiPropertyOptional({ description: '每页条数', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
}

/**
 * 批量删除 DTO
 */
class BatchDeleteDto {
  @ApiProperty({ description: '历史记录ID列表', example: [1, 2, 3], type: [Number] })
  historyIds!:  number[];
}

/**
 * 历史版本管理控制器
 *
 * @description 提供代码生成历史的查询、下载、删除等 API
 * Requirements: 9.3, 11.1
 */
@ApiTags('生成历史管理')
@Controller('tool/gen/history')
@ApiBearerAuth('Authorization')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  /**
   * 查询历史记录列表
   * Requirements: 9.3, 11.1
   */
  @Get('list')
  @ApiOperation({
    summary: '查询历史记录列表',
    description: '分页查询代码生成历史记录列表',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        msg: { type: 'string', example: '操作成功' },
        data: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  tableId: { type: 'number', example: 1 },
                  tableName: { type: 'string', example: 'sys_user' },
                  templateGroupId: { type: 'number', example: 1 },
                  generatedBy: { type: 'string', example: 'admin' },
                  generatedAt: { type: 'string', example: '2025-01-16T00:00:00.000Z' },
                },
              },
            },
            total: { type: 'number', example: 100 },
            pageNum: { type: 'number', example: 1 },
            pageSize: { type: 'number', example: 10 },
            pages: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  @RequirePermission('tool:gen:history:list')
  async list(@Query() query: QueryHistoryParamsDto): Promise<Result> {
    const historyQuery: QueryHistoryDto = {
      tableId: query.tableId ? Number(query.tableId) : undefined,
      tableName: query.tableName,
      pageNum: query.pageNum ? Number(query.pageNum) : 1,
      pageSize: query.pageSize ? Number(query.pageSize) : 10,
    };
    return this.historyService.getHistory(historyQuery);
  }

  /**
   * 查询历史记录详情
   * Requirements: 9.3, 11.1
   */
  @Get(':id')
  @ApiOperation({
    summary: '查询历史记录详情',
    description: '根据ID查询历史记录详情，包含生成的代码快照',
  })
  @ApiParam({ name: 'id', description: '历史记录ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        msg: { type: 'string', example: '操作成功' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            tableId: { type: 'number', example: 1 },
            tableName: { type: 'string', example: 'sys_user' },
            templateGroupId: { type: 'number', example: 1 },
            generatedBy: { type: 'string', example: 'admin' },
            generatedAt: { type: 'string', example: '2025-01-16T00:00:00.000Z' },
            snapshotData: {
              type: 'object',
              description: '生成的代码快照',
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '历史记录不存在' })
  @RequirePermission('tool:gen:history:query')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Result> {
    return this.historyService.getHistoryDetail(id);
  }

  /**
   * 下载历史版本代码
   * Requirements: 9.3, 11.1
   */
  @Get(':id/download')
  @ApiOperation({
    summary: '下载历史版本代码',
    description: '下载指定历史版本的生成代码（ZIP格式）',
  })
  @ApiParam({ name: 'id', description: '历史记录ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '下载成功',
    content: {
      'application/zip': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: '历史记录不存在' })
  @RequirePermission('tool:gen:history:download')
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
    const result = await this.historyService.getHistoryDetail(id);

    if (!result.isSuccess() || !result.data) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '历史记录不存在');
    }

    const history = result.data;
    const snapshotData = history.snapshotData;

    // 生成 ZIP 文件
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, '')
      .slice(0, 14);
    const zipFileName = `${history.tableName}_history_${history.id}_${timestamp}.zip`;
    const zipFilePath = path.posix.join(__dirname, zipFileName);

    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', async () => {
      res.download(zipFilePath, zipFileName, async (err) => {
        if (!err) {
          await fs.remove(zipFilePath);
        } else {
          res.status(500).send('Error downloading file');
        }
      });
    });

    archive.on('error', (err) => {
      res.status(500).json(Result.fail(500, `ZIP 文件创建失败: ${err.message}`));
    });

    archive.pipe(output);

    // 将快照中的文件添加到 ZIP
    if (snapshotData.files && Array.isArray(snapshotData.files)) {
      for (const file of snapshotData.files) {
        if (file.content) {
          archive.append(Buffer.from(file.content, 'utf-8'), { name: file.path });
        }
      }
    }

    await archive.finalize();
  }

  /**
   * 删除历史记录
   * Requirements: 9.3, 11.1
   */
  @Delete(':id')
  @ApiOperation({
    summary: '删除历史记录',
    description: '删除指定的历史记录',
  })
  @ApiParam({ name: 'id', description: '历史记录ID', type: Number })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '历史记录不存在' })
  @RequirePermission('tool:gen:history:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<Result> {
    return this.historyService.deleteHistory(id);
  }

  /**
   * 批量删除历史记录
   * Requirements: 9.3, 11.1
   */
  @Delete('batch')
  @ApiOperation({
    summary: '批量删除历史记录',
    description: '批量删除多条历史记录',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        historyIds: {
          type: 'array',
          items: { type: 'number' },
          description: '历史记录ID列表',
          example: [1, 2, 3],
        },
      },
      required: ['historyIds'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        msg: { type: 'string', example: '成功删除 3 条记录' },
        data: { type: 'number', example: 3 },
      },
    },
  })
  @RequirePermission('tool:gen:history:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  async batchDelete(@Body() dto: BatchDeleteDto): Promise<Result> {
    return this.historyService.batchDeleteHistory(dto.historyIds);
  }

  /**
   * 清理过期历史记录
   * Requirements: 9.5, 11.1
   */
  @Post('cleanup')
  @ApiOperation({
    summary: '清理过期历史记录',
    description: '清理指定天数之前的历史记录（默认30天）',
  })
  @ApiQuery({ name: 'days', required: false, description: '保留天数', type: Number, example: 30 })
  @ApiResponse({
    status: 200,
    description: '清理成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        msg: { type: 'string', example: '成功清理 10 条过期记录' },
        data: { type: 'number', example: 10 },
      },
    },
  })
  @RequirePermission('tool:gen:history:cleanup')
  @Operlog({ businessType: BusinessType.CLEAN })
  async cleanup(@Query('days') days?: number): Promise<Result> {
    return this.historyService.cleanupOldHistory(days ? Number(days) : undefined);
  }
}
