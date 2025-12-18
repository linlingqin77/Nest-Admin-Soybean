import { Controller, Get, Post, Body, Query, UploadedFile, UseInterceptors, HttpCode } from '@nestjs/common';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChunkFileDto, ChunkMergeFileDto, FileUploadDto, uploadIdDto } from './dto/index';
import { Result } from 'src/common/response';
import { Api } from 'src/common/decorators/api.decorator';
import { Operlog } from 'src/common/decorators/operlog.decorator';
import { BusinessType } from 'src/common/constant/business.constant';

@ApiTags('通用-文件上传')
@Controller('common/upload')
@ApiBearerAuth('Authorization')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 文件上传
   * @param file
   * @returns
   */
  @Api({
    summary: '文件上传',
    description: '上传单个文件',
    fileUpload: {
      fieldName: 'file',
      description: '上传的文件',
    },
  })
  @HttpCode(200)
  @Operlog({ businessType: BusinessType.IMPORT })
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async singleFileUpload(@UploadedFile() file: Express.Multer.File, @Body() body: FileUploadDto) {
    const res = await this.uploadService.singleFileUpload(file, body.folderId || 0);
    return Result.ok(res);
  }

  /**
   * 获取切片上传任务Id
   * @param file
   * @returns
   */
  @Api({
    summary: '获取切片上传任务Id',
    description: '初始化切片上传，获取任务ID',
  })
  @HttpCode(200)
  @Get('/chunk/uploadId')
  getChunkUploadId() {
    return this.uploadService.getChunkUploadId();
  }

  /**
   * 文件分片上传
   * @param file
   * @returns
   */
  @Api({
    summary: '文件切片上传',
    description: '上传文件分片',
    fileUpload: {
      fieldName: 'file',
      description: '文件分片数据',
    },
  })
  @HttpCode(200)
  @Operlog({ businessType: BusinessType.IMPORT })
  @Post('/chunk')
  @UseInterceptors(FileInterceptor('file'))
  chunkFileUpload(@UploadedFile() file: Express.Multer.File, @Body() body: ChunkFileDto) {
    return this.uploadService.chunkFileUpload(file, body);
  }

  /**
   * 文件分片合并
   * @returns
   */
  @Api({
    summary: '合并切片',
    description: '合并所有分片为完整文件',
    body: ChunkMergeFileDto,
  })
  @HttpCode(200)
  @Post('/chunk/merge')
  chunkMergeFile(@Body() body: ChunkMergeFileDto) {
    return this.uploadService.chunkMergeFile(body);
  }

  /**
   * 获取切片上传任务结果
   * @param file
   * @returns
   *
   */
  @Api({
    summary: '获取切片上传结果',
    description: '查询切片上传任务的状态',
    queries: [{ name: 'uploadId', description: '上传任务ID', required: true }],
  })
  @HttpCode(200)
  @Get('/chunk/result')
  getChunkUploadResult(@Query() query: { uploadId: string }) {
    return this.uploadService.getChunkUploadResult(query.uploadId);
  }

  /**
   * 获取cos授权
   * @param query
   */
  @Api({
    summary: '获取COS上传密钥',
    description: '获取腾讯云COS上传临时授权密钥',
    queries: [{ name: 'key', description: '文件对象路径', required: true }],
  })
  @Get('/cos/authorization')
  getAuthorization(@Query() query: { key: string }) {
    return this.uploadService.getAuthorization(query.key);
  }
}
