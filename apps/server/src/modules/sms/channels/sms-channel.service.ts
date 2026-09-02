import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from 'src/shared/response';
import { DelFlagEnum } from 'src/shared/enums/index';
import { toDtoList } from 'src/shared/utils/index';
import { CreateSmsChannelDto, ListSmsChannelDto, SmsChannelResponseDto, UpdateSmsChannelDto } from './dto/index';
import { SmsChannelRepository } from './sms-channel.repository';
import {
  InjectTransactionHost,
  PrismaTransactionHost,
  Transactional,
} from 'src/core/http/decorators/transactional.decorator';

@Injectable()
export class SmsChannelService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly smsChannelRepo: SmsChannelRepository,
  ) {}

  private get prisma() {
    return this.txHost.tx;
  }

  /**
   * 创建短信渠道
   */
  async create(createDto: CreateSmsChannelDto) {
    // 检查渠道编码是否已存在
    const exists = await this.smsChannelRepo.existsByCode(createDto.code);
    if (exists) {
      throw new BadRequestException('渠道编码已存在');
    }

    await this.smsChannelRepo.create(createDto);
    return Result.ok();
  }

  /**
   * 分页查询短信渠道列表
   */
  async findAll(query: ListSmsChannelDto) {
    const where: Prisma.SysSmsChannelWhereInput = {
      delFlag: '0',
    };

    if (query.name) {
      where.name = {
        contains: query.name,
      };
    }

    if (query.code) {
      where.code = {
        contains: query.code,
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.params?.beginTime && query.params?.endTime) {
      where.createTime = {
        gte: new Date(query.params.beginTime),
        lte: new Date(query.params.endTime),
      };
    }

    const { list, total } = await this.smsChannelRepo.findPageWithFilter(where, query.skip, query.take);

    // 隐藏敏感信息
    const safeList = list.map((item) => ({
      ...item,
      apiSecret: '******',
    }));

    return Result.ok({
      rows: toDtoList(SmsChannelResponseDto, safeList),
      total,
    });
  }

  /**
   * 根据ID查询短信渠道详情
   */
  async findOne(id: number) {
    const data = await this.smsChannelRepo.findById(id);
    if (!data) {
      throw new BadRequestException('短信渠道不存在');
    }

    // 隐藏敏感信息
    const safeData = {
      ...data,
      apiSecret: '******',
    };

    return Result.ok(safeData);
  }

  /**
   * 更新短信渠道
   */
  async update(updateDto: UpdateSmsChannelDto) {
    const { id, ...data } = updateDto;

    // 检查渠道是否存在
    const channel = await this.smsChannelRepo.findById(id);
    if (!channel) {
      throw new BadRequestException('短信渠道不存在');
    }

    // 如果修改了编码，检查新编码是否已存在
    if (data.code && data.code !== channel.code) {
      const exists = await this.smsChannelRepo.existsByCode(data.code, id);
      if (exists) {
        throw new BadRequestException('渠道编码已存在');
      }
    }

    // 如果apiSecret是******，则不更新
    if (data.apiSecret === '******') {
      delete data.apiSecret;
    }

    await this.smsChannelRepo.update(id, data);
    return Result.ok();
  }

  /**
   * 删除短信渠道
   */
  @Transactional()
  async remove(ids: number[]) {
    const data = await this.smsChannelRepo.softDeleteBatch(ids);
    return Result.ok(data);
  }

  /**
   * 获取所有启用的渠道（用于下拉选择）
   */
  async getEnabledChannels() {
    const list = await this.smsChannelRepo.findAllEnabled();
    return Result.ok(
      list.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        signature: item.signature,
      })),
    );
  }

  /**
   * 根据编码获取渠道（内部使用，包含完整信息）
   */
  async getChannelByCode(code: string) {
    return this.smsChannelRepo.findEnabledByCode(code);
  }
}
