import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSourceService } from './datasource.service';
import {
  CreateDataSourceDto,
  DataSourceResponseDto,
  DbColumnDto,
  DbTableDto,
  ListDataSourceRequestDto,
  TestConnectionDto,
  UpdateDataSourceDto,
} from './dto';
import { User, UserDto } from 'src/modules/users/user.decorator';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { Result } from 'src/shared/response';
import { MultiThrottleGuard } from 'src/core/http/guards/multi-throttle.guard';
import { MultiThrottle } from 'src/core/decorators/throttle.decorator';

/**
 * 数据源管理控制器
 *
 * @description 提供数据源的 CRUD 操作、连接测试、元数据获取等 API
 * Requirements: 11.1, 15.1, 15.2, 15.3
 */
@ApiTags('数据源管理')
@Controller('tool/gen/datasource')
@ApiBearerAuth('Authorization')
export class DataSourceController {
  constructor(private readonly dataSourceService: DataSourceService) {}

  /**
   * 创建数据源
   * Requirements: 1.1, 1.2, 11.1
   */
  @Post()
  @ApiOperation({
    summary: '创建数据源',
    description: '创建新的数据库连接配置',
  })
  @ApiResponse({
    status: 200,
    description: '创建成功',
    type: DataSourceResponseDto,
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 409, description: '数据源名称已存在' })
  @RequirePermission('tool:gen:datasource:add')
  @Operlog({ businessType: BusinessType.INSERT })
  async create(@Body() dto: CreateDataSourceDto, @User() user: UserDto): Promise<Result> {
    return this.dataSourceService.create(dto, user.userName);
  }

  /**
   * 更新数据源
   * Requirements: 1.1, 1.2, 11.1
   */
  @Put(':id')
  @ApiOperation({
    summary: '更新数据源',
    description: '更新数据库连接配置',
  })
  @ApiParam({ name: 'id', description: '数据源ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    type: DataSourceResponseDto,
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 404, description: '数据源不存在' })
  @ApiResponse({ status: 409, description: '数据源名称已存在' })
  @RequirePermission('tool:gen:datasource:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDataSourceDto,
    @User() user: UserDto,
  ): Promise<Result> {
    return this.dataSourceService.update(id, dto, user.userName);
  }

  /**
   * 删除数据源
   * Requirements: 1.1, 11.1
   */
  @Delete(':id')
  @ApiOperation({
    summary: '删除数据源',
    description: '删除数据库连接配置（软删除）',
  })
  @ApiParam({ name: 'id', description: '数据源ID', type: Number })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '数据源不存在' })
  @ApiResponse({ status: 409, description: '数据源正在使用中' })
  @RequirePermission('tool:gen:datasource:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  async delete(@Param('id', ParseIntPipe) id: number, @User() user: UserDto): Promise<Result> {
    return this.dataSourceService.delete(id, user.userName);
  }

  /**
   * 查询数据源列表
   * Requirements: 1.1, 11.1
   */
  @Get('list')
  @ApiOperation({
    summary: '查询数据源列表',
    description: '分页查询数据源列表',
  })
  @ApiResponse({
    status: 200,
    description: '查询成功',
  })
  @RequirePermission('tool:gen:datasource:list')
  async list(@Query() query: ListDataSourceRequestDto): Promise<Result> {
    return this.dataSourceService.findAll(query);
  }

  /**
   * 查询单个数据源
   * Requirements: 1.1, 11.1
   */
  @Get(':id')
  @ApiOperation({
    summary: '查询数据源详情',
    description: '根据ID查询数据源详情',
  })
  @ApiParam({ name: 'id', description: '数据源ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: DataSourceResponseDto,
  })
  @ApiResponse({ status: 404, description: '数据源不存在' })
  @RequirePermission('tool:gen:datasource:query')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Result> {
    return this.dataSourceService.findOne(id);
  }

  /**
   * 测试数据源连接
   * Requirements: 1.2, 1.5
   */
  @Post('test')
  @ApiOperation({
    summary: '测试数据源连接',
    description: '测试数据库连接是否可用',
  })
  @ApiResponse({ status: 200, description: '连接成功' })
  @ApiResponse({ status: 400, description: '连接失败' })
  @RequirePermission('tool:gen:datasource:test')
  @Operlog({ businessType: BusinessType.OTHER })
  @UseGuards(MultiThrottleGuard)
  @MultiThrottle({
    ip: { ttl: 60000, limit: 20 }, // 每分钟每IP最多20次连接测试
    user: { ttl: 60000, limit: 30 }, // 每分钟每用户最多30次连接测试
    tenant: { ttl: 60000, limit: 100 }, // 每分钟每租户最多100次连接测试
  })
  async testConnection(@Body() dto: TestConnectionDto): Promise<Result> {
    return this.dataSourceService.testConnection(dto);
  }

  /**
   * 测试已保存的数据源连接
   * Requirements: 1.2, 1.5
   */
  @Get(':id/test')
  @ApiOperation({
    summary: '测试已保存的数据源连接',
    description: '测试已保存的数据库连接是否可用',
  })
  @ApiParam({ name: 'id', description: '数据源ID', type: Number })
  @ApiResponse({ status: 200, description: '连接成功' })
  @ApiResponse({ status: 400, description: '连接失败' })
  @ApiResponse({ status: 404, description: '数据源不存在' })
  @RequirePermission('tool:gen:datasource:test')
  @Operlog({ businessType: BusinessType.OTHER })
  @UseGuards(MultiThrottleGuard)
  @MultiThrottle({
    ip: { ttl: 60000, limit: 20 }, // 每分钟每IP最多20次连接测试
    user: { ttl: 60000, limit: 30 }, // 每分钟每用户最多30次连接测试
    tenant: { ttl: 60000, limit: 100 }, // 每分钟每租户最多100次连接测试
  })
  async testConnectionById(@Param('id', ParseIntPipe) id: number): Promise<Result> {
    return this.dataSourceService.testConnectionById(id);
  }

  /**
   * 获取数据源的表列表
   * Requirements: 1.3
   */
  @Get(':id/tables')
  @ApiOperation({
    summary: '获取数据源的表列表',
    description: '获取指定数据源中的所有表',
  })
  @ApiParam({ name: 'id', description: '数据源ID', type: Number })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: [DbTableDto],
  })
  @ApiResponse({ status: 404, description: '数据源不存在' })
  @RequirePermission('tool:gen:datasource:query')
  async getTables(@Param('id', ParseIntPipe) id: number): Promise<Result> {
    return this.dataSourceService.getTables(id);
  }

  /**
   * 获取表的列信息
   * Requirements: 1.3
   */
  @Get(':id/tables/:tableName/columns')
  @ApiOperation({
    summary: '获取表的列信息',
    description: '获取指定表的所有列信息',
  })
  @ApiParam({ name: 'id', description: '数据源ID', type: Number })
  @ApiParam({ name: 'tableName', description: '表名', type: String })
  @ApiResponse({
    status: 200,
    description: '查询成功',
    type: [DbColumnDto],
  })
  @ApiResponse({ status: 404, description: '数据源不存在' })
  @RequirePermission('tool:gen:datasource:query')
  async getColumns(@Param('id', ParseIntPipe) id: number, @Param('tableName') tableName: string): Promise<Result> {
    return this.dataSourceService.getColumns(id, tableName);
  }
}
