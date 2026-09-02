import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from 'src/shared/response';
import { DelFlagEnum } from 'src/shared/enums/index';
import { toDtoList } from 'src/shared/utils/index';
import {
  CreateNotifyTemplateDto,
  ListNotifyTemplateDto,
  NotifyTemplateResponseDto,
  UpdateNotifyTemplateDto,
} from './dto/index';
import { NotifyTemplateRepository } from './notify-template.repository';
import {
  InjectTransactionHost,
  PrismaTransactionHost,
  Transactional,
} from 'src/core/http/decorators/transactional.decorator';

@Injectable()
export class NotifyTemplateService {
  constructor(
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly notifyTemplateRepo: NotifyTemplateRepository,
  ) {}

  private get prisma() {
    return this.txHost.tx;
  }

  /**
   * 创建站内信模板
   */
  async create(createDto: CreateNotifyTemplateDto) {
    // 检查模板编码是否已存在
    const exists = await this.notifyTemplateRepo.existsByCode(createDto.code);
    if (exists) {
      throw new BadRequestException('模板编码已存在');
    }

    await this.notifyTemplateRepo.create(createDto);
    return Result.ok();
  }

  /**
   * 分页查询站内信模板列表
   */
  async findAll(query: ListNotifyTemplateDto) {
    const where: Prisma.SysNotifyTemplateWhereInput = {
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

    const { list, total } = await this.notifyTemplateRepo.findPageWithFilter(where, query.skip, query.take);

    return Result.ok({
      rows: toDtoList(NotifyTemplateResponseDto, list),
      total,
    });
  }

  /**
   * 根据ID查询站内信模板详情
   */
  async findOne(id: number) {
    const data = await this.notifyTemplateRepo.findById(id);
    if (!data) {
      throw new BadRequestException('站内信模板不存在');
    }

    return Result.ok(data);
  }

  /**
   * 更新站内信模板
   */
  async update(updateDto: UpdateNotifyTemplateDto) {
    const { id, ...data } = updateDto;

    // 检查模板是否存在
    const template = await this.notifyTemplateRepo.findById(id);
    if (!template) {
      throw new BadRequestException('站内信模板不存在');
    }

    // 如果修改了编码，检查新编码是否已存在
    if (data.code && data.code !== template.code) {
      const exists = await this.notifyTemplateRepo.existsByCode(data.code, id);
      if (exists) {
        throw new BadRequestException('模板编码已存在');
      }
    }

    await this.notifyTemplateRepo.update(id, data);
    return Result.ok();
  }

  /**
   * 删除站内信模板
   */
  @Transactional()
  async remove(ids: number[]) {
    const data = await this.notifyTemplateRepo.softDeleteBatch(ids);
    return Result.ok(data);
  }

  /**
   * 获取所有启用的模板（用于下拉选择）
   */
  async getSelectList() {
    const list = await this.notifyTemplateRepo.findAllEnabled();
    return Result.ok(list);
  }

  /**
   * 根据编码获取模板（内部使用）
   */
  async getTemplateByCode(code: string) {
    return this.notifyTemplateRepo.findEnabledByCode(code);
  }

  /**
   * 解析模板变量
   * 将模板内容中的变量占位符替换为实际值
   *
   * @param content 模板内容，如 "您有一条新的通知：${content}"
   * @param params 变量值映射，如 { content: '系统升级通知' }
   * @returns 解析后的内容，如 "您有一条新的通知：系统升级通知"
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
