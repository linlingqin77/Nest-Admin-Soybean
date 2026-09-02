import { Controller, Get, Post, Param, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { OssService } from './oss.service';
import { ListOssDto, OssResponseDto, OssListResponseDto } from './dto/index';
import { RequirePermission } from 'src/core/http/decorators/require-permission.decorator';
import { Api } from 'src/core/http/decorators/api.decorator';
import { Operlog } from 'src/core/audit/decorators/operlog.decorator';
import { BusinessType } from 'src/shared/constants/business.constant';
import { User, UserDto } from 'src/modules/users/user.decorator';

@ApiTags('OSS文件管理')
@Controller('resource/oss')
@ApiBearerAuth('Authorization')
export class OssController {
  constructor(private readonly ossService: OssService) {}

  @Api({
    summary: 'OSS文件管理-列表',
    description: '分页查询OSS文件列表',
    type: OssListResponseDto,
  })
  @RequirePermission('system:oss:list')
  @Get('/list')
  findAll(@Query() query: ListOssDto) {
    return this.ossService.findAll(query);
  }

  @Api({
    summary: 'OSS文件管理-根据ID列表查询',
    description: '根据ID列表获取OSS文件',
    type: OssListResponseDto,
    params: [{ name: 'ids', description: 'OSS文件ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:oss:query')
  @Get('/listByIds/:ids')
  findByIds(@Param('ids') ids: string) {
    const ossIds = ids.split(',').map((id) => Number(id));
    return this.ossService.findByIds(ossIds);
  }

  @Api({
    summary: 'OSS文件管理-详情',
    description: '根据ID获取OSS文件详情',
    type: OssResponseDto,
    params: [{ name: 'id', description: 'OSS文件ID', type: 'number' }],
  })
  @RequirePermission('system:oss:query')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ossService.findOne(Number(id));
  }

  @Api({
    summary: 'OSS文件管理-上传',
    description: '上传文件到OSS',
    type: OssResponseDto,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '上传的文件',
        },
      },
    },
  })
  @RequirePermission('system:oss:upload')
  @Operlog({ businessType: BusinessType.INSERT })
  @UseInterceptors(FileInterceptor('file'))
  @Post('/upload')
  upload(@UploadedFile() file: Express.Multer.File, @User() user: UserDto) {
    return this.ossService.upload(file, user?.user?.userName || 'system');
  }

  @Api({
    summary: 'OSS文件管理-删除',
    description: '批量删除OSS文件，多个ID用逗号分隔',
    params: [{ name: 'ids', description: 'OSS文件ID，多个用逗号分隔' }],
  })
  @RequirePermission('system:oss:remove')
  @Operlog({ businessType: BusinessType.DELETE })
  @Delete(':ids')
  remove(@Param('ids') ids: string) {
    const ossIds = ids.split(',').map((id) => Number(id));
    return this.ossService.remove(ossIds);
  }
}
