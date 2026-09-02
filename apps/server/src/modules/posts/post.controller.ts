import { Body, Controller, Delete, Get, Param, Post, Put, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PostService } from './post.service';
import {
  CreatePostRequestDto,
  CreatePostResultResponseDto,
  DeletePostResultResponseDto,
  DeptTreeResponseDto,
  ListPostRequestDto,
  PostListResponseDto,
  PostResponseDto,
  UpdatePostRequestDto,
  UpdatePostResultResponseDto,
} from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Response } from 'express';
import { Api } from 'src/core/http/decorators/api.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { UserTool, UserToolType } from '../users/user.decorator';

@ApiTags('岗位管理')
@Controller('system/post')
@ApiBearerAuth('Authorization')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Api({
    summary: '岗位管理-创建',
    description: '创建新岗位',
    body: CreatePostRequestDto,
    type: CreatePostResultResponseDto,
  })
  @RequirePermission('system:post:add')
  @Operlog({ businessType: BusinessType.INSERT })
  @Post('/')
  create(@Body() createPostDto: CreatePostRequestDto, @UserTool() { injectCreate }: UserToolType) {
    return this.postService.create(injectCreate(createPostDto));
  }

  @Api({
    summary: '岗位管理-列表',
    description: '分页查询岗位列表',
    type: PostListResponseDto,
  })
  @RequirePermission('system:post:list')
  @Get('/list')
  findAll(@Query() query: ListPostRequestDto) {
    return this.postService.findAll(query);
  }

  @Api({
    summary: '岗位管理-选择框列表',
    description: '获取岗位选择框列表',
    type: PostResponseDto,
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
    type: DeptTreeResponseDto,
    isArray: true,
  })
  @Get('/deptTree')
  deptTree() {
    return this.postService.deptTree();
  }

  @Api({
    summary: '岗位管理-详情',
    description: '根据ID获取岗位详情',
    type: PostResponseDto,
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
    body: UpdatePostRequestDto,
    type: UpdatePostResultResponseDto,
  })
  @RequirePermission('system:post:edit')
  @Operlog({ businessType: BusinessType.UPDATE })
  @Put('/')
  update(@Body() updatePostDto: UpdatePostRequestDto) {
    return this.postService.update(updatePostDto);
  }

  @Api({
    summary: '岗位管理-删除',
    description: '批量删除岗位，多个ID用逗号分隔',
    params: [{ name: 'ids', description: '岗位ID，多个用逗号分隔' }],
    type: DeletePostResultResponseDto,
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
    body: ListPostRequestDto,
    produces: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  })
  @RequirePermission('system:post:export')
  @Operlog({ businessType: BusinessType.EXPORT })
  @Get('/export')
  async export(@Res() res: Response, @Query() query: ListPostRequestDto): Promise<void> {
    return this.postService.export(res, query);
  }
}
