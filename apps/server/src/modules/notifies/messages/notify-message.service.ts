import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from 'src/shared/response';
import { toDtoList } from 'src/shared/utils/index';
import {
  SendNotifyMessageDto,
  SendNotifyAllDto,
  ListNotifyMessageDto,
  ListMyNotifyMessageDto,
  NotifyMessageResponseDto,
} from './dto/index';
import { PrismaService } from 'src/platform/prisma';
import { NotifyMessageRepository } from './notify-message.repository';
import { NotifyTemplateService } from '../templates/notify-template.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class NotifyMessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifyMessageRepo: NotifyMessageRepository,
    private readonly notifyTemplateService: NotifyTemplateService,
    private readonly cls: ClsService,
  ) {}

  /**
   * 发送站内信（单发/群发）
   */
  async send(sendDto: SendNotifyMessageDto) {
    const { userIds, templateCode, params = {} } = sendDto;

    // 获取模板
    const template = await this.notifyTemplateService.getTemplateByCode(templateCode);
    if (!template) {
      throw new BadRequestException('站内信模板不存在或已禁用');
    }

    // 验证模板参数
    const missingParams = this.notifyTemplateService.validateTemplateParams(template.content, params);
    if (missingParams.length > 0) {
      throw new BadRequestException(`缺少模板参数: ${missingParams.join(', ')}`);
    }

    // 解析模板内容
    const content = this.notifyTemplateService.parseTemplateContent(template.content, params);

    // 获取租户ID
    const tenantId = this.cls.get('tenantId') || '000000';

    // 批量创建消息
    const messages: Prisma.SysNotifyMessageCreateManyInput[] = userIds.map((userId) => ({
      tenantId,
      userId,
      userType: 1, // 默认用户类型
      templateId: template.id,
      templateCode: template.code,
      templateNickname: template.nickname,
      templateContent: content,
      templateParams: JSON.stringify(params),
      readStatus: false,
    }));

    const count = await this.notifyMessageRepo.createMany(messages);
    return Result.ok({ count });
  }

  /**
   * 发送站内信给所有用户
   */
  async sendAll(sendDto: SendNotifyAllDto) {
    const { templateCode, params = {} } = sendDto;

    // 获取模板
    const template = await this.notifyTemplateService.getTemplateByCode(templateCode);
    if (!template) {
      throw new BadRequestException('站内信模板不存在或已禁用');
    }

    // 验证模板参数
    const missingParams = this.notifyTemplateService.validateTemplateParams(template.content, params);
    if (missingParams.length > 0) {
      throw new BadRequestException(`缺少模板参数: ${missingParams.join(', ')}`);
    }

    // 解析模板内容
    const content = this.notifyTemplateService.parseTemplateContent(template.content, params);

    // 获取租户ID
    const tenantId = this.cls.get('tenantId') || '000000';

    // 获取所有用户ID
    const users = await this.prisma.sysUser.findMany({
      where: { tenantId, delFlag: '0', status: '0' },
      select: { userId: true },
    });

    if (users.length === 0) {
      return Result.ok({ count: 0 });
    }

    // 批量创建消息
    const messages: Prisma.SysNotifyMessageCreateManyInput[] = users.map((user) => ({
      tenantId,
      userId: user.userId,
      userType: 1,
      templateId: template.id,
      templateCode: template.code,
      templateNickname: template.nickname,
      templateContent: content,
      templateParams: JSON.stringify(params),
      readStatus: false,
    }));

    const count = await this.notifyMessageRepo.createMany(messages);
    return Result.ok({ count });
  }

  /**
   * 分页查询站内信消息列表（管理员）
   */
  async findAll(query: ListNotifyMessageDto) {
    const where: Prisma.SysNotifyMessageWhereInput = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.templateCode) {
      where.templateCode = {
        contains: query.templateCode,
      };
    }

    if (query.readStatus !== undefined) {
      where.readStatus = query.readStatus;
    }

    if (query.params?.beginTime && query.params?.endTime) {
      where.createTime = {
        gte: new Date(query.params.beginTime),
        lte: new Date(query.params.endTime),
      };
    }

    const { list, total } = await this.notifyMessageRepo.findPageWithFilter(where, query.skip, query.take);

    // 转换BigInt为字符串
    const rows = list.map((item) => ({
      ...item,
      id: item.id.toString(),
    }));

    return Result.ok({
      rows: toDtoList(NotifyMessageResponseDto, rows),
      total,
    });
  }

  /**
   * 分页查询我的站内信列表
   */
  async findMyMessages(userId: number, query: ListMyNotifyMessageDto) {
    const tenantId = this.cls.get('tenantId') || '000000';

    const where: Prisma.SysNotifyMessageWhereInput = {
      userId,
      tenantId,
    };

    if (query.readStatus !== undefined) {
      where.readStatus = query.readStatus;
    }

    if (query.params?.beginTime && query.params?.endTime) {
      where.createTime = {
        gte: new Date(query.params.beginTime),
        lte: new Date(query.params.endTime),
      };
    }

    const { list, total } = await this.notifyMessageRepo.findPageWithFilter(where, query.skip, query.take);

    // 转换BigInt为字符串
    const rows = list.map((item) => ({
      ...item,
      id: item.id.toString(),
    }));

    return Result.ok({
      rows: toDtoList(NotifyMessageResponseDto, rows),
      total,
    });
  }

  /**
   * 根据ID查询站内信详情
   */
  async findOne(id: bigint) {
    const data = await this.notifyMessageRepo.findById(id);
    if (!data) {
      throw new BadRequestException('站内信不存在');
    }

    return Result.ok({
      ...data,
      id: data.id.toString(),
    });
  }

  /**
   * 获取未读消息数量
   */
  async getUnreadCount(userId: number) {
    const tenantId = this.cls.get('tenantId') || '000000';
    const count = await this.notifyMessageRepo.getUnreadCount(userId, tenantId);
    return Result.ok({ count });
  }

  /**
   * 标记消息为已读
   */
  async markAsRead(id: bigint, userId: number) {
    const message = await this.notifyMessageRepo.findById(id);
    if (!message) {
      throw new BadRequestException('站内信不存在');
    }

    // 验证消息属于当前用户
    if (message.userId !== userId) {
      throw new BadRequestException('无权操作此消息');
    }

    if (message.readStatus) {
      return Result.ok(); // 已经是已读状态
    }

    await this.notifyMessageRepo.markAsRead(id);
    return Result.ok();
  }

  /**
   * 批量标记消息为已读
   */
  async markAsReadBatch(ids: bigint[], userId: number) {
    // 验证所有消息都属于当前用户
    for (const id of ids) {
      const message = await this.notifyMessageRepo.findById(id);
      if (message && message.userId !== userId) {
        throw new BadRequestException('无权操作部分消息');
      }
    }

    const count = await this.notifyMessageRepo.markAsReadBatch(ids);
    return Result.ok({ count });
  }

  /**
   * 标记所有消息为已读
   */
  async markAllAsRead(userId: number) {
    const tenantId = this.cls.get('tenantId') || '000000';
    const count = await this.notifyMessageRepo.markAllAsRead(userId, tenantId);
    return Result.ok({ count });
  }

  /**
   * 删除站内信（软删除）
   */
  async remove(id: bigint, userId: number) {
    const message = await this.notifyMessageRepo.findById(id);
    if (!message) {
      throw new BadRequestException('站内信不存在');
    }

    // 验证消息属于当前用户
    if (message.userId !== userId) {
      throw new BadRequestException('无权操作此消息');
    }

    await this.notifyMessageRepo.softDelete(id);
    return Result.ok();
  }

  /**
   * 批量删除站内信（软删除）
   */
  async removeBatch(ids: bigint[], userId: number) {
    // 验证所有消息都属于当前用户
    for (const id of ids) {
      const message = await this.notifyMessageRepo.findById(id);
      if (message && message.userId !== userId) {
        throw new BadRequestException('无权操作部分消息');
      }
    }

    const count = await this.notifyMessageRepo.softDeleteBatch(ids);
    return Result.ok({ count });
  }

  /**
   * 获取用户最近的消息列表（用于通知铃铛下拉）
   */
  async getRecentMessages(userId: number, limit: number = 10) {
    const tenantId = this.cls.get('tenantId') || '000000';
    const list = await this.notifyMessageRepo.findRecentByUserId(userId, limit, tenantId);

    // 转换BigInt为字符串
    const rows = list.map((item) => ({
      ...item,
      id: item.id.toString(),
    }));

    return Result.ok(toDtoList(NotifyMessageResponseDto, rows));
  }
}
