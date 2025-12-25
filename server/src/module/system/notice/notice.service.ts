import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from 'src/common/response';
import { DelFlagEnum } from 'src/common/enum/index';
import { FormatDateFields } from 'src/common/utils/index';
import { CreateNoticeDto, UpdateNoticeDto, ListNoticeDto } from './dto/index';
import { PrismaService } from 'src/prisma/prisma.service';
import { NoticeRepository } from './notice.repository';
import { Transactional } from 'src/common/decorators/transactional.decorator';

@Injectable()
export class NoticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly noticeRepo: NoticeRepository,
  ) {}
  async create(createNoticeDto: CreateNoticeDto) {
    await this.noticeRepo.create(createNoticeDto);
    return Result.ok();
  }

  async findAll(query: ListNoticeDto) {
    const where: Prisma.SysNoticeWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
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

    return Result.ok({
      rows: FormatDateFields(list),
      total,
    });
  }

  async findOne(noticeId: number) {
    const data = await this.noticeRepo.findById(noticeId);
    return Result.ok(data);
  }

  async update(updateNoticeDto: UpdateNoticeDto) {
    await this.noticeRepo.update(updateNoticeDto.noticeId, updateNoticeDto);
    return Result.ok();
  }

  @Transactional()
  async remove(noticeIds: number[]) {
    const data = await this.noticeRepo.softDeleteBatch(noticeIds);
    return Result.ok(data);
  }
}
