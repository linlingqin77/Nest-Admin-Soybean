import { Controller, Get, Post, Body, Put, Param, Delete, Res, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto, ListPostDto } from './dto/index';
import { RequirePermission } from 'src/common/decorators/require-premission.decorator';
import { Response } from 'express';
import { Api } from 'src/common/decorators/api.decorator';
import { PostVo, PostListVo } from './vo/post.vo';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';
import { UserTool, UserToolType } from '../user/user.decorator';

@ApiTags('岗位管理')
@Controller('system/post')
@ApiBearerAuth('Authorization')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Api({
    summary: '岗位管理-创建',
    description: '创建新岗位',
    body: CreatePostDto,
  })
  @RequirePermission('system:post:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post('/')
  create(@Body() createPostDto: CreatePostDto, @UserTool() { injectCreate }: UserToolType) {
    return this.postService.create(injectCreate(createPostDto));
  }

  @Api({
    summary: '岗位管理-列表',
    description: '分页查询岗位列表',
    type: PostListVo,
  })
  @RequirePermission('system:post:list')
  @Get('/list')
  findAll(@Query() query: ListPostDto) {
    return this.postService.findAll(query);
  }

  @Api({
    summary: '岗位管理-选择框列表',
    description: '获取岗位选择框列表',
    type: PostVo,
    isArray: true,
  })
  @Get('/optionselect')
  optionselect(@Query('deptId') deptId?: string, @Query('postIds') postIds?: string) {
    const ids = postIds ? postIds.split(',').map((id) => +id) : undefined;
    return this.postService.optionselect(deptId ? +deptId : undefined, ids);
  }

  @Api({
    summary: '岗位管理-部门树',
    description: '获取部门树形结构',
  })
  @Get('/deptTree')
  deptTree() {
    return this.postService.deptTree();
  }

  @Api({
    summary: '岗位管理-详情',
    description: '根据ID获取岗位详情',
    type: PostVo,
    params: [{ name: 'id', description: '岗位ID', type: 'number' }],
  })
  @RequirePermission('system:post:query')
  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(+id);
  }

  @Api({
    summary: '岗位管理-更新',
    description: '修改岗位信息',
    body: UpdatePostDto,
  })
  @RequirePermission('system:post:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('/')
  update(@Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(updatePostDto);
  }

  @Api({
    summary: '岗位管理-删除',
    description: '批量删除岗位，多个ID用逗号分隔',
    params: [{ name: 'ids', description: '岗位ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:post:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete('/:ids')
  remove(@Param('ids') ids: string) {
    const menuIds = ids.split(',').map((id) => id);
    return this.postService.remove(menuIds);
  }

  @Api({
    summary: '岗位管理-导出Excel',
    description: '导出岗位数据为xlsx文件',
    body: ListPostDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('system:post:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Post('/export')
  async export(@Res() res: Response, @Body() body: ListPostDto): Promise<void> {
    return this.postService.export(res, body);
  }
}
