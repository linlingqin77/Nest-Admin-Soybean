import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from 'src/shared/response';
import { DelFlagEnum } from 'src/shared/enums/index';
import { toDtoList } from 'src/shared/utils/index';
import {
  CreateMailTemplateDto,
  UpdateMailTemplateDto,
  ListMailTemplateDto,
  MailTemplateResponseDto,
} from './dto/index';
import { MailTemplateRepository } from './mail-template.repository';
import { MailAccountRepository } from '../accounts/mail-account.repository';
import { InjectTransactionHost, Transactional, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';

@Injectable()
export class MailTemplateService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly mailTemplateRepo: MailTemplateRepository,
    private readonly mailAccountRepo: MailAccountRepository,
  ) {}

  private get prisma() {
    return this.txHost.tx;
  }

  /**
   * 创建邮件模板
   */
  async create(createDto: CreateMailTemplateDto) {
    // 检查模板编码是否已存在
    const exists = await this.mailTemplateRepo.existsByCode(createDto.code);
    if (exists) {
      throw new BadRequestException('模板编码已存在');
    }

    // 检查账号是否存在
    const account = await this.mailAccountRepo.findById(createDto.accountId);
    if (!account) {
      throw new BadRequestException('邮箱账号不存在');
    }

    await this.mailTemplateRepo.create(createDto);
    return Result.ok();
  }

  /**
   * 分页查询邮件模板列表
   */
  async findAll(query: ListMailTemplateDto) {
    const where: Prisma.SysMailTemplateWhereInput = {
      delFlag: DelFlagEnum.NORMAL,
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

    if (query.accountId) {
      where.accountId = query.accountId;
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

    const { list, total } = await this.mailTemplateRepo.findPageWithFilter(where, query.skip, query.take);

    // 转换数据格式
    const rows = list.map((item) => ({
      ...item,
      accountMail: item.account?.mail,
      account: undefined,
    }));

    return Result.ok({
      rows: toDtoList(MailTemplateResponseDto, rows),
      total,
    });
  }

  /**
   * 根据ID查询邮件模板详情
   */
  async findOne(id: number) {
    const data = await this.mailTemplateRepo.findById(id);
    if (!data) {
      throw new BadRequestException('邮件模板不存在');
    }

    return Result.ok(data);
  }

  /**
   * 更新邮件模板
   */
  async update(updateDto: UpdateMailTemplateDto) {
    const { id, ...data } = updateDto;

    // 检查模板是否存在
    const template = await this.mailTemplateRepo.findById(id);
    if (!template) {
      throw new BadRequestException('邮件模板不存在');
    }

    // 如果修改了编码，检查新编码是否已存在
    if (data.code && data.code !== template.code) {
      const exists = await this.mailTemplateRepo.existsByCode(data.code, id);
      if (exists) {
        throw new BadRequestException('模板编码已存在');
      }
    }

    // 如果修改了账号，检查账号是否存在
    if (data.accountId && data.accountId !== template.accountId) {
      const account = await this.mailAccountRepo.findById(data.accountId);
      if (!account) {
        throw new BadRequestException('邮箱账号不存在');
      }
    }

    await this.mailTemplateRepo.update(id, data);
    return Result.ok();
  }

  /**
   * 删除邮件模板
   */
  @Transactional()
  async remove(ids: number[]) {
    const data = await this.mailTemplateRepo.softDeleteBatch(ids);
    return Result.ok(data);
  }

  /**
   * 根据编码获取模板（内部使用）
   */
  async getTemplateByCode(code: string) {
    return this.mailTemplateRepo.findEnabledByCode(code);
  }

  /**
   * 解析模板变量
   * 将模板内容中的变量占位符替换为实际值
   *
   * @param content 模板内容，如 "<p>您的验证码是${code}，有效期${time}分钟。</p>"
   * @param params 变量值映射，如 { code: '123456', time: '5' }
   * @returns 解析后的内容，如 "<p>您的验证码是123456，有效期5分钟。</p>"
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
   * 解析邮件标题中的变量
   *
   * @param title 邮件标题
   * @param params 变量值映射
   * @returns 解析后的标题
   */
  parseTemplateTitle(title: string, params: Record<string, string>): string {
    return this.parseTemplateContent(title, params);
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
