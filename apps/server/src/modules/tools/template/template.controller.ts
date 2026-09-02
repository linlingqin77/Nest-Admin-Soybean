import { Body, Controller, Delete, Get, Header, Param, ParseIntPipe, Post, Put, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { TemplateService } from './template.service';
import {
  CreateTemplateDto,
  CreateTemplateGroupDto,
  ExportTemplateGroupDto,
  ImportTemplateGroupDto,
  ListTemplateGroupRequestDto,
  ListTemplateRequestDto,
  TemplateGroupResponseDto,
  TemplateResponseDto,
  UpdateTemplateDto,
  UpdateTemplateGroupDto,
  ValidateTemplateDto,
} from './dto';
import { User, UserDto } from 'src/modules/users/user.decorator';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { Result } from 'src/shared/response';

/**
 * 模板管理控制器
 *
 * @description 提供模板组和模板的 CRUD 操作、模板验证、导入导出等 API
 * Requirements: 11.1, 11.4, 15.1, 15.2
 */
@ApiTags('模板管理')
@Controller('tool/gen/template')
@ApiBearerAuth('Authorization')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  // ==================== 模板组管理 ====================

  /**
   * 创建模板组
   * Requirements: 6.2, 11.1
   */
  @Post('group')
  @ApiOperation({
    summary: '创建模板组',
    description: '创建新的模板组',
  })
  @ApiResponse({
    status: 200,
    description: '创建成功',
    type: TemplateGroupResponseDto,
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 409, description: '模板组名称已存在' })
  @RequirePermission('tool:gen:template:add')
  @Operlog({ businessType: BusinessType.INSERT })
  async createGroup(@Body() dto: CreateTemplateGroupDto, @User() user: UserDto): Promise<Result> {
    return this.templateService.createGroup(dto, user.userName);
  }

  /**
   * 更新模板组
   * Requirements: 6.2, 11.1
   */
  @Put('group/:id')
  @ApiOperation({
    summary: '更新模板组',
    description: '更新模板组信息',
  })
  @ApiParam({ name: 'id', description: '模板组ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: TemplateGroupResponseDto,
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 403, description: '无权修改系统级模板组' })
  @ApiResponse({ status: 404, description: '模板组不存在' })
  @ApiResponse({ status: 409, description: '模板组名称已存在' })
  @RequirePermission('tool:gen:template:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  async updateGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateGroupDto,
    @User() user: UserDto,
  ): Promise<Result> {
    return this.templateService.updateGroup(id, dto, user.userName);
  }

  /**
   * 删除模板组
   * Requirements: 6.2, 11.1
   */
  @Delete('group/:id')
  @ApiOperation({
    summary: '删除模板组',
    description: '删除模板组及其所有模板（软删除）',
  })
  @ApiParam({ name: 'id', description: '模板组ID', type: Number })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 403, description: '系统级模板组不允许删除' })
  @ApiResponse({ status: 404, description: '模板组不存在' })
  @ApiResponse({ status: 409, description: '模板组正在使用中' })
  @RequirePermission('tool:gen:template:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  async deleteGroup(@Param('id', ParseIntPipe) id: number, @User() user: UserDto): Promise<Result> {
    return this.templateService.deleteGroup(id, user.userName);
  }

  /**
   * 查询模板组列表
   * Requirements: 6.2, 11.1
   */
  @Get('group/list')
  @ApiOperation({
    summary: '查询模板组列表',
    description: '分页查询模板组列表，包含当前租户和系统级模板组',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  @RequirePermission('tool:gen:template:list')
  async listGroups(@Query() query: ListTemplateGroupRequestDto): Promise<Result> {
    return this.templateService.findAllGroups(query);
  }

  /**
   * 查询单个模板组
   * Requirements: 6.2, 11.1
   */
  @Get('group/:id')
  @ApiOperation({
    summary: '查询模板组详情',
    description: '根据ID查询模板组详情，包含所有模板',
  })
  @ApiParam({ name: 'id', description: '模板组ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: TemplateGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: '模板组不存在' })
  @RequirePermission('tool:gen:template:query')
  async findOneGroup(@Param('id', ParseIntPipe) id: number): Promise<Result> {
    return this.templateService.findOneGroup(id);
  }

  /**
   * 获取默认模板组
   * Requirements: 6.2
   */
  @Get('group/default')
  @ApiOperation({
    summary: '获取默认模板组',
    description: '获取当前租户或系统级的默认模板组',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: TemplateGroupResponseDto,
  })
  @ApiResponse({ status: 404, description: '未找到默认模板组' })
  @RequirePermission('tool:gen:template:query')
  async getDefaultGroup(): Promise<Result> {
    return this.templateService.getDefaultGroup();
  }

  /**
   * 导出模板组
   * Requirements: 6.6
   */
  @Get('group/:id/export')
  @ApiOperation({
    summary: '导出模板组',
    description: '将模板组导出为 JSON 文件',
  })
  @ApiParam({ name: 'id', description: '模板组ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '导出成功',
    type: ExportTemplateGroupDto,
  })
  @ApiResponse({ status: 404, description: '模板组不存在' })
  @RequirePermission('tool:gen:template:export')
  @Header('Content-Type', 'application/json')
  async exportGroup(@Param('id', ParseIntPipe) id: number, @Res() res: Response): Promise<void> {
    const result = await this.templateService.exportGroupAsJson(id);

    if (!result.isSuccess()) {
      res.status(400).json(result);
      return;
    }

    // 获取模板组名称用于文件名
    const groupResult = await this.templateService.findOneGroup(id);
    const fileName = groupResult.isSuccess()
      ? `template-group-${groupResult.data?.name || id}.json`
      : `template-group-${id}.json`;

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(result.data);
  }

  /**
   * 导入模板组
   * Requirements: 6.6
   */
  @Post('group/import')
  @ApiOperation({
    summary: '导入模板组',
    description: '从 JSON 数据导入模板组',
  })
  @ApiBody({ type: ImportTemplateGroupDto })
  @ApiResponse({
    status: 200,
    description: '导入成功',
    type: TemplateGroupResponseDto,
  })
  @ApiResponse({ status: 400, description: '参数错误或模板语法错误' })
  @ApiResponse({ status: 409, description: '模板组名称已存在' })
  @RequirePermission('tool:gen:template:import')
  @Operlog({ businessType: BusinessType.IMPORT })
  async importGroup(@Body() dto: ImportTemplateGroupDto, @User() user: UserDto): Promise<Result> {
    return this.templateService.importGroup(dto, user.userName);
  }

  // ==================== 模板管理 ====================

  /**
   * 创建模板
   * Requirements: 6.2, 11.1
   */
  @Post()
  @ApiOperation({
    summary: '创建模板',
    description: '在指定模板组中创建新模板',
  })
  @ApiResponse({
    status: 200,
    description: '创建成功',
    type: TemplateResponseDto,
  })
  @ApiResponse({ status: 400, description: '参数错误或模板语法错误' })
  @ApiResponse({ status: 403, description: '无权向系统级模板组添加模板' })
  @ApiResponse({ status: 404, description: '模板组不存在' })
  @RequirePermission('tool:gen:template:add')
  @Operlog({ businessType: BusinessType.INSERT })
  async createTemplate(@Body() dto: CreateTemplateDto, @User() user: UserDto): Promise<Result> {
    return this.templateService.createTemplate(dto, user.userName);
  }

  /**
   * 更新模板
   * Requirements: 6.2, 11.1
   */
  @Put(':id')
  @ApiOperation({
    summary: '更新模板',
    description: '更新模板信息',
  })
  @ApiParam({ name: 'id', description: '模板ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: TemplateResponseDto,
  })
  @ApiResponse({ status: 400, description: '参数错误或模板语法错误' })
  @ApiResponse({ status: 403, description: '无权修改系统级模板' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  @RequirePermission('tool:gen:template:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  async updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateDto,
    @User() user: UserDto,
  ): Promise<Result> {
    return this.templateService.updateTemplate(id, dto, user.userName);
  }

  /**
   * 删除模板
   * Requirements: 6.2, 11.1
   */
  @Delete(':id')
  @ApiOperation({
    summary: '删除模板',
    description: '删除模板（软删除）',
  })
  @ApiParam({ name: 'id', description: '模板ID', type: Number })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 403, description: '系统级模板不允许删除' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  @RequirePermission('tool:gen:template:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  async deleteTemplate(@Param('id', ParseIntPipe) id: number, @User() user: UserDto): Promise<Result> {
    return this.templateService.deleteTemplate(id, user.userName);
  }

  /**
   * 查询模板列表
   * Requirements: 6.2, 11.1
   */
  @Get('list')
  @ApiOperation({
    summary: '查询模板列表',
    description: '分页查询模板列表',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  @RequirePermission('tool:gen:template:list')
  async listTemplates(@Query() query: ListTemplateRequestDto): Promise<Result> {
    return this.templateService.findAllTemplates(query);
  }

  /**
   * 查询单个模板
   * Requirements: 6.2, 11.1
   */
  @Get(':id')
  @ApiOperation({
    summary: '查询模板详情',
    description: '根据ID查询模板详情',
  })
  @ApiParam({ name: 'id', description: '模板ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: TemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: '模板不存在' })
  @RequirePermission('tool:gen:template:query')
  async findOneTemplate(@Param('id', ParseIntPipe) id: number): Promise<Result> {
    return this.templateService.findOneTemplate(id);
  }

  // ==================== 模板验证 ====================

  /**
   * 验证模板语法
   * Requirements: 6.5
   */
  @Post('validate')
  @ApiOperation({
    summary: '验证模板语法',
    description: '验证模板内容的语法是否正确，并返回使用的变量列表',
  })
  @ApiResponse({
    status: 200,
    description: '验证完成',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        msg: { type: 'string', example: '操作成功' },
        data: {
          type: 'object',
          properties: {
            valid: { type: 'boolean', example: true },
            variables: { type: 'array', items: { type: 'string' }, example: ['tableName', 'className'] },
            warnings: { type: 'array', items: { type: 'string' }, example: [] },
          },
        },
      },
    },
  })
  @RequirePermission('tool:gen:template:query')
  async validateTemplate(@Body() dto: ValidateTemplateDto): Promise<Result> {
    return this.templateService.validateTemplate(dto);
  }
}
