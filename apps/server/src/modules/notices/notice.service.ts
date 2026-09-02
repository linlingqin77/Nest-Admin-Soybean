import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions';
import { DelFlagEnum } from 'src/shared/enums/index';
import { toDto, toDtoList } from 'src/shared/utils/serialize.util';
import { CreateNoticeDto, UpdateNoticeDto, ListNoticeDto } from './dto/index';
import { NoticeResponseDto } from './dto/responses';
import { NoticeRepository } from './notice.repository';
import { InjectTransactionHost, Transactional, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';

@Injectable()
export class NoticeService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly noticeRepo: NoticeRepository,
  ) {}

  private get prisma() {
    return this.txHost.tx;
  }

  async create(createNoticeDto: CreateNoticeDto) {
    await this.noticeRepo.create(createNoticeDto);
    return Result.ok();
  }

  async findAll(query: ListNoticeDto) {
    const where: Prisma.SysNoticeWhereInput = {
      delFlag: '0',
    };

    if (query.noticeTitle) {
      where.noticeTitle = {
        contains: query.noticeTitle,
      };
    }

    if (query.createBy) {
      where.createBy = {
        contains: query.createBy,
      };
    }

    if (query.noticeType) {
      where.noticeType = query.noticeType;
    }

    if (query.params?.beginTime && query.params?.endTime) {
      where.createTime = {
        gte: new Date(query.params.beginTime),
        lte: new Date(query.params.endTime),
      };
    }

    const { list, total } = await this.noticeRepo.findPageWithFilter(where, query.skip, query.take);

    return Result.page(toDtoList(NoticeResponseDto, list), total, query.pageNum, query.pageSize);
  }

  async findOne(noticeId: number) {
    const data = await this.noticeRepo.findById(noticeId);
    BusinessException.throwIfNull(data, '通知不存在', ResponseCode.DATA_NOT_FOUND);
    return Result.ok(toDto(NoticeResponseDto, data));
  }

  async update(updateNoticeDto: UpdateNoticeDto) {
    const result = await this.noticeRepo.updateMany(
      { noticeId: updateNoticeDto.noticeId, delFlag: '0' } as any,
      updateNoticeDto,
    );
    BusinessException.throwIf(result.count === 0, '通知不存在', ResponseCode.DATA_NOT_FOUND);
    return Result.ok();
  }

  @Transactional()
  async remove(noticeIds: number[]) {
    const data = await this.noticeRepo.softDeleteBatch(noticeIds);
    return Result.ok(data);
  }
}
