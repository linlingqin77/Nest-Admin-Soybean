import { Controller, Get, Post, Body, Put, Param, Query, Delete, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DeptService } from './dept.service';
import { CreateDeptDto, UpdateDeptDto, ListDeptDto } from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { Api } from 'src/common/decorators/api.decorator';
import { DeptVo } from './vo/dept.vo';
import { DeptTreeNodeVo } from 'src/common/dto/dept-tree-node.vo';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';
import { UserTool, UserToolType } from '../user/user.decorator';

@ApiTags('部门管理')
@Controller('system/dept')
@ApiBearerAuth('Authorization')
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  @Api({
    summary: '部门管理-创建',
    description: '创建新部门，需要指定父部门ID',
    body: CreateDeptDto,
  })
  @RequirePermission('system:dept:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post()
  @HttpCode(200)
  create(@Body() createDeptDto: CreateDeptDto, @UserTool() { injectCreate }: UserToolType) {
    return this.deptService.create(injectCreate(createDeptDto));
  }

  @Api({
    summary: '部门管理-列表',
    description: '获取部门列表，支持按名称和状态筛选',
    type: DeptVo,
    isArray: true,
    queries: [
      { name: 'deptName', description: '部门名称', required: false },
      { name: 'status', description: '状态（0正常 1停用）', required: false, enum: ['0', '1'] },
    ],
  })
  @RequirePermission('system:dept:list')
  @Get('/list')
  findAll(@Query() query: ListDeptDto) {
    return this.deptService.findAll(query);
  }

  @Api({
    summary: '部门管理-选择框列表',
    description: '获取部门选择框列表',
    type: DeptVo,
    isArray: true,
  })
  @Get('/optionselect')
  optionselect() {
    return this.deptService.optionselect();
  }

  @Api({
    summary: '部门管理-详情',
    description: '根据部门ID获取部门详细信息',
    type: DeptVo,
    params: [{ name: 'id', description: '部门ID', type: 'number' }],
  })
  @RequirePermission('system:dept:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deptService.findOne(+id);
  }

  @Api({
    summary: '部门管理-排除节点列表',
    description: '查询部门列表（排除指定节点及其子节点），用于编辑时选择父部门',
    type: DeptVo,
    isArray: true,
    params: [{ name: 'id', description: '需要排除的部门ID', type: 'number' }],
  })
  @RequirePermission('system:dept:query')
  @Get('/list/exclude/:id')
  findListExclude(@Param('id') id: string) {
    return this.deptService.findListExclude(+id);
  }

  @Api({
    summary: '部门管理-更新',
    description: '更新部门信息',
    body: UpdateDeptDto,
  })
  @RequirePermission('system:dept:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put()
  update(@Body() updateDeptDto: UpdateDeptDto) {
    return this.deptService.update(updateDeptDto);
  }

  @Api({
    summary: '部门管理-删除',
    description: '根据ID删除部门，如果存在子部门则无法删除',
    params: [{ name: 'id', description: '部门ID', type: 'number' }],
    responses: {
      400: { description: '该部门存在子部门，无法删除' },
    },
  })
  @RequirePermission('system:dept:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deptService.remove(+id);
  }
}
