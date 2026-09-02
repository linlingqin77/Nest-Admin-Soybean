/**
 * 短信管理模块集成测试
 *
 * @description
 * 测试短信模块的完整流程，包括：
 * - 短信渠道 CRUD
 * - 短信模板 CRUD
 * - 短信日志查询
 *
 * _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/platform/prisma';
import { SmsChannelService } from 'src/modules/sms/channels/sms-channel.service';
import { SmsTemplateService } from 'src/modules/sms/templates/sms-template.service';
import { SmsLogService } from 'src/modules/sms/logs/sms-log.service';
import { StatusEnum } from 'src/shared/enums/index';
import { ListSmsChannelDto } from 'src/modules/sms/channels/dto/index';
import { ListSmsTemplateDto } from 'src/modules/sms/templates/dto/index';
import { ListSmsLogDto } from 'src/modules/sms/logs/dto/index';

function uniqueId(): string {
  return Math.random().toString(36).substring(2, 8);
}

function createListSmsChannelDto(params: Partial<ListSmsChannelDto> = {}): ListSmsChannelDto {
  const dto = new ListSmsChannelDto();
  Object.assign(dto, params);
  return dto;
}

function createListSmsTemplateDto(params: Partial<ListSmsTemplateDto> = {}): ListSmsTemplateDto {
  const dto = new ListSmsTemplateDto();
  Object.assign(dto, params);
  return dto;
}

function createListSmsLogDto(params: Partial<ListSmsLogDto> = {}): ListSmsLogDto {
  const dto = new ListSmsLogDto();
  Object.assign(dto, params);
  return dto;
}

describe('SMS Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let smsChannelService: SmsChannelService;
  let smsTemplateService: SmsTemplateService;
  let smsLogService: SmsLogService;

  const createdChannelIds: number[] = [];
  const createdTemplateIds: number[] = [];

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
    smsChannelService = app.get(SmsChannelService);
    smsTemplateService = app.get(SmsTemplateService);
    smsLogService = app.get(SmsLogService);
  }, 60000);

  afterAll(async () => {
    try {
      // 清理测试数据
      if (createdTemplateIds.length > 0) {
        await prisma.sysSmsTemplate.deleteMany({
          where: { id: { in: createdTemplateIds } },
        });
      }
      if (createdChannelIds.length > 0) {
        await prisma.sysSmsChannel.deleteMany({
          where: { id: { in: createdChannelIds } },
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await app.close();
  });

  describe('SMS Channel CRUD Operations', () => {
    it('should create and retrieve SMS channel', async () => {
      const uid = uniqueId();
      const code = `test_${uid}`;
      const name = `测试渠道_${uid}`;

      const createResult = await smsChannelService.create({
        code,
        name,
        signature: '测试签名',
        apiKey: 'test_api_key',
        apiSecret: 'test_api_secret',
        status: StatusEnum.NORMAL,
      });

      expect(createResult.code).toBe(200);

      const channel = await prisma.sysSmsChannel.findFirst({
        where: { code },
      });

      expect(channel).toBeDefined();
      createdChannelIds.push(channel!.id);

      const findResult = await smsChannelService.findOne(channel!.id);
      expect(findResult.code).toBe(200);
      expect(findResult.data.name).toBe(name);
      // 敏感信息应被隐藏
      expect(findResult.data.apiSecret).toBe('******');
    });

    it('should list SMS channels with pagination', async () => {
      const result = await smsChannelService.findAll(
        createListSmsChannelDto({
          pageNum: 1,
          pageSize: 10,
        }),
      );

      expect(result.code).toBe(200);
      expect(result.data.rows).toBeDefined();
      expect(Array.isArray(result.data.rows)).toBe(true);
      expect(typeof result.data.total).toBe('number');
    });

    it('should filter SMS channels by name', async () => {
      const uid = uniqueId();
      const code = `filter_${uid}`;
      const name = `筛选渠道_${uid}`;

      await smsChannelService.create({
        code,
        name,
        signature: '筛选签名',
        apiKey: 'filter_api_key',
        apiSecret: 'filter_api_secret',
        status: StatusEnum.NORMAL,
      });

      const channel = await prisma.sysSmsChannel.findFirst({
        where: { code },
      });
      if (channel) {
        createdChannelIds.push(channel.id);
      }

      const result = await smsChannelService.findAll(
        createListSmsChannelDto({
          pageNum: 1,
          pageSize: 10,
          name: '筛选渠道',
        }),
      );

      expect(result.code).toBe(200);
      expect(result.data.rows.length).toBeGreaterThan(0);
      result.data.rows.forEach((row: any) => {
        expect(row.name).toContain('筛选渠道');
      });
    });

    it('should update SMS channel', async () => {
      const uid = uniqueId();
      const code = `update_${uid}`;

      await smsChannelService.create({
        code,
        name: `更新前_${uid}`,
        signature: '更新签名',
        apiKey: 'update_api_key',
        apiSecret: 'update_api_secret',
        status: StatusEnum.NORMAL,
      });

      const channel = await prisma.sysSmsChannel.findFirst({
        where: { code },
      });
      expect(channel).toBeDefined();
      createdChannelIds.push(channel!.id);

      const newName = `更新后_${uid}`;
      const updateResult = await smsChannelService.update({
        id: channel!.id,
        name: newName,
        apiSecret: '******', // 不更新密钥
      });

      expect(updateResult.code).toBe(200);

      const updatedChannel = await prisma.sysSmsChannel.findUnique({
        where: { id: channel!.id },
      });
      expect(updatedChannel!.name).toBe(newName);
      // 密钥应保持不变
      expect(updatedChannel!.apiSecret).toBe('update_api_secret');
    });

    it('should soft delete SMS channel', async () => {
      const uid = uniqueId();
      const code = `delete_${uid}`;

      await smsChannelService.create({
        code,
        name: `删除测试_${uid}`,
        signature: '删除签名',
        apiKey: 'delete_api_key',
        apiSecret: 'delete_api_secret',
        status: StatusEnum.NORMAL,
      });

      const channel = await prisma.sysSmsChannel.findFirst({
        where: { code },
      });
      expect(channel).toBeDefined();
      createdChannelIds.push(channel!.id);

      const deleteResult = await smsChannelService.remove([channel!.id]);
      expect(deleteResult.code).toBe(200);

      const deletedChannel = await prisma.sysSmsChannel.findUnique({
        where: { id: channel!.id },
      });
      expect(deletedChannel!.delFlag).toBe('1');
    });

    it('should get enabled channels for select', async () => {
      const result = await smsChannelService.getEnabledChannels();

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach((item: any) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('code');
        expect(item).toHaveProperty('name');
      });
    });
  });

  describe('SMS Template CRUD Operations', () => {
    let testChannelId: number;

    beforeAll(async () => {
      // 创建测试渠道
      const uid = uniqueId();
      await smsChannelService.create({
        code: `tpl_channel_${uid}`,
        name: `模板测试渠道_${uid}`,
        signature: '模板签名',
        apiKey: 'tpl_api_key',
        apiSecret: 'tpl_api_secret',
        status: StatusEnum.NORMAL,
      });

      const channel = await prisma.sysSmsChannel.findFirst({
        where: { code: `tpl_channel_${uid}` },
      });
      testChannelId = channel!.id;
      createdChannelIds.push(testChannelId);
    });

    it('should create and retrieve SMS template', async () => {
      const uid = uniqueId();
      const code = `tpl_${uid}`;
      const name = `测试模板_${uid}`;

      const createResult = await smsTemplateService.create({
        channelId: testChannelId,
        code,
        name,
        content: '您的验证码是${code}，有效期${time}分钟',
        params: JSON.stringify(['code', 'time']),
        apiTemplateId: 'SMS_123456',
        type: 1,
        status: StatusEnum.NORMAL,
      });

      expect(createResult.code).toBe(200);

      const template = await prisma.sysSmsTemplate.findFirst({
        where: { code },
      });

      expect(template).toBeDefined();
      createdTemplateIds.push(template!.id);

      const findResult = await smsTemplateService.findOne(template!.id);
      expect(findResult.code).toBe(200);
      expect(findResult.data.name).toBe(name);
      // params is stored as JSON string, parse it to check contents
      const params = JSON.parse(findResult.data.params || '[]');
      expect(params).toContain('code');
      expect(params).toContain('time');
    });

    it('should list SMS templates with pagination', async () => {
      const result = await smsTemplateService.findAll(
        createListSmsTemplateDto({
          pageNum: 1,
          pageSize: 10,
        }),
      );

      expect(result.code).toBe(200);
      expect(result.data.rows).toBeDefined();
      expect(Array.isArray(result.data.rows)).toBe(true);
    });

    it('should filter SMS templates by channel', async () => {
      const result = await smsTemplateService.findAll(
        createListSmsTemplateDto({
          pageNum: 1,
          pageSize: 10,
          channelId: testChannelId,
        }),
      );

      expect(result.code).toBe(200);
      result.data.rows.forEach((row: any) => {
        expect(row.channelId).toBe(testChannelId);
      });
    });

    it('should update SMS template', async () => {
      const uid = uniqueId();
      const code = `update_tpl_${uid}`;

      await smsTemplateService.create({
        channelId: testChannelId,
        code,
        name: `更新前模板_${uid}`,
        content: '原始内容${var1}',
        apiTemplateId: 'SMS_UPDATE',
        type: 1,
        status: StatusEnum.NORMAL,
      });

      const template = await prisma.sysSmsTemplate.findFirst({
        where: { code },
      });
      expect(template).toBeDefined();
      createdTemplateIds.push(template!.id);

      const newContent = '更新后内容${var2}';
      const updateResult = await smsTemplateService.update({
        id: template!.id,
        content: newContent,
      });

      expect(updateResult.code).toBe(200);

      const updatedTemplate = await prisma.sysSmsTemplate.findUnique({
        where: { id: template!.id },
      });
      expect(updatedTemplate!.content).toBe(newContent);
    });
  });

  describe('SMS Log Query Operations', () => {
    it('should list SMS logs with pagination', async () => {
      const result = await smsLogService.findAll(
        createListSmsLogDto({
          pageNum: 1,
          pageSize: 10,
        }),
      );

      expect(result.code).toBe(200);
      expect(result.data.rows).toBeDefined();
      expect(Array.isArray(result.data.rows)).toBe(true);
      expect(typeof result.data.total).toBe('number');
    });

    it('should filter SMS logs by mobile', async () => {
      // 创建测试日志
      await prisma.sysSmsLog.create({
        data: {
          channelId: 1,
          channelCode: 'test',
          templateId: 1,
          templateCode: 'test_tpl',
          mobile: '13800138000',
          content: '测试短信内容',
          sendStatus: 1,
        },
      });

      const result = await smsLogService.findAll(
        createListSmsLogDto({
          pageNum: 1,
          pageSize: 10,
          mobile: '13800138000',
        }),
      );

      expect(result.code).toBe(200);
      result.data.rows.forEach((row: any) => {
        expect(row.mobile).toContain('13800138000');
      });
    });

    it('should filter SMS logs by send status', async () => {
      const result = await smsLogService.findAll(
        createListSmsLogDto({
          pageNum: 1,
          pageSize: 10,
          sendStatus: 1,
        }),
      );

      expect(result.code).toBe(200);
      result.data.rows.forEach((row: any) => {
        expect(row.sendStatus).toBe(1);
      });
    });
  });
});
