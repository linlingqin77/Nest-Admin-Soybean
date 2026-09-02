/**
 * 站内信模块集成测试
 *
 * @description
 * 测试站内信模块的完整流程，包括：
 * - 站内信模板 CRUD
 * - 站内信消息发送和查询
 * - 已读标记和删除
 *
 * _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/platform/prisma';
import { NotifyTemplateService } from 'src/modules/notifies/templates/notify-template.service';
import { NotifyMessageService } from 'src/modules/notifies/messages/notify-message.service';
import { StatusEnum } from 'src/shared/enums/index';
import { ListNotifyTemplateDto } from 'src/modules/notifies/templates/dto/index';
import { ListNotifyMessageDto } from 'src/modules/notifies/messages/dto/index';

function uniqueId(): string {
  return Math.random().toString(36).substring(2, 8);
}

function createListNotifyTemplateDto(params: Partial<ListNotifyTemplateDto> = {}): ListNotifyTemplateDto {
  const dto = new ListNotifyTemplateDto();
  Object.assign(dto, params);
  return dto;
}

function createListNotifyMessageDto(params: Partial<ListNotifyMessageDto> = {}): ListNotifyMessageDto {
  const dto = new ListNotifyMessageDto();
  Object.assign(dto, params);
  return dto;
}

describe('Notify Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let notifyTemplateService: NotifyTemplateService;
  let notifyMessageService: NotifyMessageService;

  const createdTemplateIds: number[] = [];
  const createdMessageIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
    notifyTemplateService = app.get(NotifyTemplateService);
    notifyMessageService = app.get(NotifyMessageService);
  }, 60000);

  afterAll(async () => {
    try {
      // 清理测试数据
      if (createdMessageIds.length > 0) {
        await prisma.sysNotifyMessage.deleteMany({
          where: { id: { in: createdMessageIds } },
        });
      }
      if (createdTemplateIds.length > 0) {
        await prisma.sysNotifyTemplate.deleteMany({
          where: { id: { in: createdTemplateIds } },
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await app.close();
  });

  describe('Notify Template CRUD Operations', () => {
    it('should create and retrieve notify template', async () => {
      const uid = uniqueId();
      const code = `notify_tpl_${uid}`;
      const name = `测试站内信模板_${uid}`;

      const createResult = await notifyTemplateService.create({
        code,
        name,
        nickname: '系统通知',
        content: '尊敬的${username}，您有一条新消息：${message}',
        params: JSON.stringify(['username', 'message']),
        type: 1,
        status: StatusEnum.NORMAL,
      });

      expect(createResult.code).toBe(200);

      const template = await prisma.sysNotifyTemplate.findFirst({
        where: { code },
      });

      expect(template).toBeDefined();
      createdTemplateIds.push(template!.id);

      const findResult = await notifyTemplateService.findOne(template!.id);
      expect(findResult.code).toBe(200);
      expect(findResult.data!.name).toBe(name);
      // params is stored as JSON string, parse it to check contents
      const params = JSON.parse(findResult.data!.params || '[]');
      expect(params).toContain('username');
      expect(params).toContain('message');
    });

    it('should list notify templates with pagination', async () => {
      const result = await notifyTemplateService.findAll(
        createListNotifyTemplateDto({
          pageNum: 1,
          pageSize: 10,
        }),
      );

      expect(result.code).toBe(200);
      expect(result.data!.rows).toBeDefined();
      expect(Array.isArray(result.data!.rows)).toBe(true);
      expect(typeof result.data!.total).toBe('number');
    });

    it('should filter notify templates by name', async () => {
      const uid = uniqueId();
      const code = `filter_notify_${uid}`;
      const name = `筛选站内信模板_${uid}`;

      await notifyTemplateService.create({
        code,
        name,
        nickname: '筛选测试',
        content: '筛选内容${var}',
        type: 1,
        status: StatusEnum.NORMAL,
      });

      const template = await prisma.sysNotifyTemplate.findFirst({
        where: { code },
      });
      if (template) {
        createdTemplateIds.push(template.id);
      }

      const result = await notifyTemplateService.findAll(
        createListNotifyTemplateDto({
          pageNum: 1,
          pageSize: 10,
          name: '筛选站内信',
        }),
      );

      expect(result.code).toBe(200);
      expect(result.data!.rows.length).toBeGreaterThan(0);
      result.data!.rows.forEach((row: any) => {
        expect(row.name).toContain('筛选站内信');
      });
    });

    it('should update notify template', async () => {
      const uid = uniqueId();
      const code = `update_notify_${uid}`;

      await notifyTemplateService.create({
        code,
        name: `更新前站内信模板_${uid}`,
        nickname: '更新前',
        content: '原内容${old}',
        type: 1,
        status: StatusEnum.NORMAL,
      });

      const template = await prisma.sysNotifyTemplate.findFirst({
        where: { code },
      });
      expect(template).toBeDefined();
      createdTemplateIds.push(template!.id);

      const newContent = '更新后内容${new}';
      const updateResult = await notifyTemplateService.update({
        id: template!.id,
        content: newContent,
      });

      expect(updateResult.code).toBe(200);

      const updatedTemplate = await prisma.sysNotifyTemplate.findUnique({
        where: { id: template!.id },
      });
      expect(updatedTemplate!.content).toBe(newContent);
    });

    it('should soft delete notify template', async () => {
      const uid = uniqueId();
      const code = `delete_notify_${uid}`;

      await notifyTemplateService.create({
        code,
        name: `删除站内信模板_${uid}`,
        nickname: '删除测试',
        content: '删除内容',
        type: 1,
        status: StatusEnum.NORMAL,
      });

      const template = await prisma.sysNotifyTemplate.findFirst({
        where: { code },
      });
      expect(template).toBeDefined();
      createdTemplateIds.push(template!.id);

      const deleteResult = await notifyTemplateService.remove([template!.id]);
      expect(deleteResult.code).toBe(200);

      const deletedTemplate = await prisma.sysNotifyTemplate.findUnique({
        where: { id: template!.id },
      });
      expect(deletedTemplate!.delFlag).toBe('1');
    });
  });

  describe('Notify Message Operations', () => {
    let testTemplateCode: string;
    let testUserId: number;

    beforeAll(async () => {
      // 创建测试模板
      const uid = uniqueId();
      testTemplateCode = `msg_tpl_${uid}`;

      await notifyTemplateService.create({
        code: testTemplateCode,
        name: `消息测试模板_${uid}`,
        nickname: '消息测试',
        content: '您好${name}，这是一条测试消息',
        type: 1,
        status: StatusEnum.NORMAL,
      });

      const template = await prisma.sysNotifyTemplate.findFirst({
        where: { code: testTemplateCode },
      });
      createdTemplateIds.push(template!.id);

      // 获取测试用户
      const user = await prisma.sysUser.findFirst({
        where: { delFlag: '0' },
      });
      testUserId = user!.userId;
    });

    it('should send notify message to single user', async () => {
      const sendResult = await notifyMessageService.send({
        userIds: [testUserId],
        templateCode: testTemplateCode,
        params: { name: '测试用户' },
      });

      expect(sendResult.code).toBe(200);
      expect(sendResult.data!.count).toBe(1);

      // 查找创建的消息
      const message = await prisma.sysNotifyMessage.findFirst({
        where: {
          userId: testUserId,
          templateCode: testTemplateCode,
        },
        orderBy: { createTime: 'desc' },
      });

      expect(message).toBeDefined();
      createdMessageIds.push(message!.id);
      expect(message!.templateContent).toContain('测试用户');
    });

    it('should list notify messages with pagination', async () => {
      const result = await notifyMessageService.findAll(
        createListNotifyMessageDto({
          pageNum: 1,
          pageSize: 10,
        }),
      );

      expect(result.code).toBe(200);
      expect(result.data!.rows).toBeDefined();
      expect(Array.isArray(result.data!.rows)).toBe(true);
      expect(typeof result.data!.total).toBe('number');
    });

    it('should filter notify messages by user', async () => {
      const result = await notifyMessageService.findAll(
        createListNotifyMessageDto({
          pageNum: 1,
          pageSize: 10,
          userId: testUserId,
        }),
      );

      expect(result.code).toBe(200);
      result.data!.rows.forEach((row: any) => {
        expect(row.userId).toBe(testUserId);
      });
    });

    it('should get unread count', async () => {
      const result = await notifyMessageService.getUnreadCount(testUserId);

      expect(result.code).toBe(200);
      expect(typeof result.data!.count).toBe('number');
    });

    it('should mark message as read', async () => {
      // 创建一条未读消息
      const sendResult = await notifyMessageService.send({
        userIds: [testUserId],
        templateCode: testTemplateCode,
        params: { name: '已读测试' },
      });
      expect(sendResult.code).toBe(200);

      const message = await prisma.sysNotifyMessage.findFirst({
        where: {
          userId: testUserId,
          templateCode: testTemplateCode,
          readStatus: false,
        },
        orderBy: { createTime: 'desc' },
      });
      expect(message).toBeDefined();
      createdMessageIds.push(message!.id);

      // 标记为已读
      const markResult = await notifyMessageService.markAsRead(message!.id, testUserId);
      expect(markResult.code).toBe(200);

      // 验证已读状态
      const updatedMessage = await prisma.sysNotifyMessage.findUnique({
        where: { id: message!.id },
      });
      expect(updatedMessage!.readStatus).toBe(true);
      expect(updatedMessage!.readTime).toBeDefined();
    });

    it('should soft delete message', async () => {
      // 创建一条消息
      const sendResult = await notifyMessageService.send({
        userIds: [testUserId],
        templateCode: testTemplateCode,
        params: { name: '删除测试' },
      });
      expect(sendResult.code).toBe(200);

      const message = await prisma.sysNotifyMessage.findFirst({
        where: {
          userId: testUserId,
          templateCode: testTemplateCode,
        },
        orderBy: { createTime: 'desc' },
      });
      expect(message).toBeDefined();
      createdMessageIds.push(message!.id);

      // 软删除
      const deleteResult = await notifyMessageService.remove(message!.id, testUserId);
      expect(deleteResult.code).toBe(200);

      // 验证软删除状态
      const deletedMessage = await prisma.sysNotifyMessage.findUnique({
        where: { id: message!.id },
      });
      expect(deletedMessage!.delFlag).toBe('1');
    });
  });
});
