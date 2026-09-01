import { Injectable } from '@nestjs/common';
import { StructuredLoggerService } from 'src/platform/logger/structured-logger.service';
import { Prisma } from '@prisma/client';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions';
import { toDto, toDtoList } from 'src/shared/utils/index';
import { DelFlagEnum } from 'src/shared/enums/index';
import { OssRepository } from './oss.repository';
import { ListOssDto, OssResponseDto } from './dto/index';
import { InjectTransactionHost, Transactional, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';
import { UploadService } from 'src/modules/files/upload.service';
import { extname } from 'path';

@Injectable()
export class OssService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly ossRepo: OssRepository,
    private readonly uploadService: UploadService,
    private readonly logger: StructuredLoggerService,
  ) {
    this.logger.setContext(OssService.name);
  }

  private get prisma() {
    return this.txHost.tx;
  }

  /**
   * 查询OSS文件列表
   */
  async findAll(query: ListOssDto) {
    const where: Prisma.SysOssWhereInput = {
      delFlag: '0',
    };

    if (query.fileName) {
      where.fileName = {
        contains: query.fileName,
      };
    }

    if (query.originalName) {
      where.originalName = {
        contains: query.originalName,
      };
    }

    if (query.fileSuffix) {
      where.fileSuffix = {
        contains: query.fileSuffix,
      };
    }

    if (query.service) {
      where.service = query.service;
    }

    const { list, total } = await this.ossRepo.findPageWithFilter(where, query.skip, query.take);

    return Result.page(toDtoList(OssResponseDto, list), total, query.pageNum, query.pageSize);
  }

  /**
   * 根据ID列表查询OSS文件
   */
  async findByIds(ossIds: bigint[]) {
    const list = await this.ossRepo.findByIds(ossIds);
    return Result.ok(list.map((item) => toDto(OssResponseDto, item)));
  }

  /**
   * 根据ID查询OSS文件详情
   */
  async findOne(ossId: bigint) {
    const data = await this.ossRepo.findByOssId(ossId);
    BusinessException.throwIfNull(data, 'OSS文件不存在', ResponseCode.DATA_NOT_FOUND);

    return Result.ok(toDto(OssResponseDto, data));
  }

  /**
   * 上传文件
   */
  @Transactional()
  async upload(file: Express.Multer.File, createBy: string) {
    // 使用现有的上传服务处理文件
    const uploadResult = await this.uploadService.singleFileUpload(file);

    const fileInfo = uploadResult;

    // 保存到OSS表
    const ossRecord = await this.ossRepo.create({
      fileName: fileInfo.newFileName,
      originalName: fileInfo.fileName,
      fileSuffix: extname(fileInfo.fileName).replace('.', ''),
      url: fileInfo.url,
      size: BigInt(file.size || 0),
      service: 'local',
      createBy,
    });

    return Result.ok(toDto(OssResponseDto, ossRecord));
  }

  /**
   * 批量删除OSS文件
   */
  @Transactional()
  async remove(ossIds: bigint[]) {
    await this.ossRepo.softDeleteByOssIds(ossIds);
    return Result.ok(null, '删除成功');
  }
}
