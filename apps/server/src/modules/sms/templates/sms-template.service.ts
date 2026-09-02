import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from 'src/shared/response';
import { DelFlagEnum } from 'src/shared/enums/index';
import { toDtoList } from 'src/shared/utils/index';
import { CreateSmsTemplateDto, ListSmsTemplateDto, SmsTemplateResponseDto, UpdateSmsTemplateDto } from './dto/index';
import { SmsTemplateRepository } from './sms-template.repository';
import { SmsChannelRepository } from '../channels/sms-channel.repository';
import {
  InjectTransactionHost,
  PrismaTransactionHost,
  Transactional,
} from 'src/core/http/decorators/transactional.decorator';

@Injectable()
export class SmsTemplateService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly smsTemplateRepo: SmsTemplateRepository,
    private readonly smsChannelRepo: SmsChannelRepository,
  ) {}

  private get prisma() {
    return this.txHost.tx;
  }

  /**
   * 创建短信模板
   */
  async create(createDto: CreateSmsTemplateDto) {
    // 检查模板编码是否已存在
    const exists = await this.smsTemplateRepo.existsByCode(createDto.code);
    if (exists) {
      throw new BadRequestException('模板编码已存在');
    }

    // 检查渠道是否存在
    const channel = await this.smsChannelRepo.findById(createDto.channelId);
    if (!channel) {
      throw new BadRequestException('短信渠道不存在');
    }

    await this.smsTemplateRepo.create(createDto);
    return Result.ok();
  }

  /**
   * 分页查询短信模板列表
   */
  async findAll(query: ListSmsTemplateDto) {
    const where: Prisma.SysSmsTemplateWhereInput = {
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

    if (query.channelId) {
      where.channelId = query.channelId;
    }

    if (query.type) {
      where.type = query.type;
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

    const { list, total } = await this.smsTemplateRepo.findPageWithFilter(where, query.skip, query.take);

    // 转换数据格式
    const rows = list.map((item) => ({
      ...item,
      channelCode: item.channel?.code,
      channelName: item.channel?.name,
      channel: undefined,
    }));

    return Result.ok({
      rows: toDtoList(SmsTemplateResponseDto, rows),
      total,
    });
  }

  /**
   * 根据ID查询短信模板详情
   */
  async findOne(id: number) {
    const data = await this.smsTemplateRepo.findById(id);
    if (!data) {
      throw new BadRequestException('短信模板不存在');
    }

    return Result.ok(data);
  }

  /**
   * 更新短信模板
   */
  async update(updateDto: UpdateSmsTemplateDto) {
    const { id, ...data } = updateDto;

    // 检查模板是否存在
    const template = await this.smsTemplateRepo.findById(id);
    if (!template) {
      throw new BadRequestException('短信模板不存在');
    }

    // 如果修改了编码，检查新编码是否已存在
    if (data.code && data.code !== template.code) {
      const exists = await this.smsTemplateRepo.existsByCode(data.code, id);
      if (exists) {
        throw new BadRequestException('模板编码已存在');
      }
    }

    // 如果修改了渠道，检查渠道是否存在
    if (data.channelId && data.channelId !== template.channelId) {
      const channel = await this.smsChannelRepo.findById(data.channelId);
      if (!channel) {
        throw new BadRequestException('短信渠道不存在');
      }
    }

    await this.smsTemplateRepo.update(id, data);
    return Result.ok();
  }

  /**
   * 删除短信模板
   */
  @Transactional()
  async remove(ids: number[]) {
    const data = await this.smsTemplateRepo.softDeleteBatch(ids);
    return Result.ok(data);
  }

  /**
   * 根据编码获取模板（内部使用）
   */
  async getTemplateByCode(code: string) {
    return this.smsTemplateRepo.findEnabledByCode(code);
  }

  /**
   * 解析模板变量
   * 将模板内容中的变量占位符替换为实际值
   *
   * @param content 模板内容，如 "您的验证码是${code}，有效期${time}分钟。"
   * @param params 变量值映射，如 { code: '123456', time: '5' }
   * @returns 解析后的内容，如 "您的验证码是123456，有效期5分钟。"
   */
  parseTemplateContent(content: string, params: Record<string, string>): string {
    if (!content) {
      return '';
    }

    if (!params || Object.keys(params).length === 0) {
      return content;
    }

    // 使用正则表达式匹配 ${variableName} 格式的占位符
    return content.replace(/\$\{(\w+)\}/g, (match, key) => {
      // 如果参数中存在该key，则替换；否则保留原占位符
      return params.hasOwnProperty(key) ? params[key] : match;
    });
  }

  /**
   * 提取模板中的变量名
   *
   * @param content 模板内容
   * @returns 变量名数组
   */
  extractTemplateParams(content: string): string[] {
    if (!content) {
      return [];
    }

    const matches = content.match(/\$\{(\w+)\}/g);
    if (!matches) {
      return [];
    }

    // 提取变量名并去重
    const params = matches.map((match) => match.replace(/\$\{|\}/g, ''));
    return [...new Set(params)];
  }

  /**
   * 验证模板参数是否完整
   *
   * @param content 模板内容
   * @param params 提供的参数
   * @returns 缺失的参数名数组
   */
  validateTemplateParams(content: string, params: Record<string, string>): string[] {
    const requiredParams = this.extractTemplateParams(content);
    const providedParams = Object.keys(params || {});

    return requiredParams.filter((param) => !providedParams.includes(param));
  }
}
