/**
 * 邮件管理模块集成测试
 *
 * @description
 * 测试邮件模块的完整流程，包括：
 * - 邮箱账号 CRUD
 * - 邮件模板 CRUD
 * - 邮件日志查询
 *
 * _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.modules';
import { PrismaService } from 'src/platform/prisma';
import { MailAccountService } from 'src/modules/mails/accounts/mail-account.service';
import { MailTemplateService } from 'src/modules/mails/templates/mail-template.service';
import { MailLogService } from 'src/modules/mails/logs/mail-log.service';
import { StatusEnum } from 'src/shared/enums/index';
import { ListMailAccountDto } from 'src/modules/mails/accounts/dto/index';
import { ListMailTemplateDto } from 'src/modules/mails/templates/dto/index';
import { ListMailLogDto } from 'src/modules/mails/logs/dto/index';

function uniqueId(): string {
  return Math.random().toString(36).substring(2, 8);
}

function createListMailAccountDto(params: Partial<ListMailAccountDto> = {}): ListMailAccountDto {
  const dto = new ListMailAccountDto();
  Object.assign(dto, params);
  return dto;
}

function createListMailTemplateDto(params: Partial<ListMailTemplateDto> = {}): ListMailTemplateDto {
  const dto = new ListMailTemplateDto();
  Object.assign(dto, params);
  return dto;
}

function createListMailLogDto(params: Partial<ListMailLogDto> = {}): ListMailLogDto {
  const dto = new ListMailLogDto();
  Object.assign(dto, params);
  return dto;
}

describe('Mail Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mailAccountService: MailAccountService;
  let mailTemplateService: MailTemplateService;
  let mailLogService: MailLogService;

  const createdAccountIds: number[] = [];
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
    mailAccountService = app.get(MailAccountService);
    mailTemplateService = app.get(MailTemplateService);
    mailLogService = app.get(MailLogService);
  }, 60000);

  afterAll(async () => {
    try {
      // 清理测试数据
      if (createdTemplateIds.length > 0) {
        await prisma.sysMailTemplate.deleteMany({
          where: { id: { in: createdTemplateIds } },
        });
      }
      if (createdAccountIds.length > 0) {
        await prisma.sysMailAccount.deleteMany({
          where: { id: { in: createdAccountIds } },
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    await app.close();
  });

  describe('Mail Account CRUD Operations', () => {
    it('should create and retrieve mail account', async () => {
      const uid = uniqueId();
      const mail = `test_${uid}@example.com`;

      const createResult = await mailAccountService.create({
        mail,
        username: `testuser_${uid}`,
        password: 'test_password_123',
        host: 'smtp.example.com',
        port: 465,
        sslEnable: true,
        status: StatusEnum.NORMAL,
      });

      expect(createResult.code).toBe(200);

      const account = await prisma.sysMailAccount.findFirst({
        where: { mail },
      });

      expect(account).toBeDefined();
      createdAccountIds.push(account!.id);

      const findResult = await mailAccountService.findOne(account!.id);
      expect(findResult.code).toBe(200);
      expect(findResult.data.mail).toBe(mail);
      // 密码应被隐藏
      expect(findResult.data.password).toBe('******');
    });

    it('should list mail accounts with pagination', async () => {
      const result = await mailAccountService.findAll(
        createListMailAccountDto({
          pageNum: 1,
          pageSize: 10,
        }),
      );

      expect(result.code).toBe(200);
      expect(result.data.rows).toBeDefined();
      expect(Array.isArray(result.data.rows)).toBe(true);
      expect(typeof result.data.total).toBe('number');
    });

    it('should filter mail accounts by mail address', async () => {
      const uid = uniqueId();
      const mail = `filter_${uid}@example.com`;

      await mailAccountService.create({
        mail,
        username: `filteruser_${uid}`,
        password: 'filter_password',
        host: 'smtp.filter.com',
        port: 587,
        sslEnable: false,
        status: StatusEnum.NORMAL,
      });

      const account = await prisma.sysMailAccount.findFirst({
        where: { mail },
      });
      if (account) {
        createdAccountIds.push(account.id);
      }

      const result = await mailAccountService.findAll(
        createListMailAccountDto({
          pageNum: 1,
          pageSize: 10,
          mail: 'filter_',
        }),
      );

      expect(result.code).toBe(200);
      expect(result.data.rows.length).toBeGreaterThan(0);
      result.data.rows.forEach((row: any) => {
        expect(row.mail).toContain('filter_');
      });
    });

    it('should update mail account', async () => {
      const uid = uniqueId();
      const mail = `update_${uid}@example.com`;

      await mailAccountService.create({
        mail,
        username: `updateuser_${uid}`,
        password: 'update_password',
        host: 'smtp.update.com',
        port: 465,
        sslEnable: true,
        status: StatusEnum.NORMAL,
      });

      const account = await prisma.sysMailAccount.findFirst({
        where: { mail },
      });
      expect(account).toBeDefined();
      createdAccountIds.push(account!.id);

      const newHost = 'smtp.updated.com';
      const updateResult = await mailAccountService.update({
        id: account!.id,
        host: newHost,
        password: '******', // 不更新密码
      });

      expect(updateResult.code).toBe(200);

      const updatedAccount = await prisma.sysMailAccount.findUnique({
        where: { id: account!.id },
      });
      expect(updatedAccount!.host).toBe(newHost);
    });

    it('should soft delete mail account', async () => {
      const uid = uniqueId();
      const mail = `delete_${uid}@example.com`;

      await mailAccountService.create({
        mail,
        username: `deleteuser_${uid}`,
        password: 'delete_password',
        host: 'smtp.delete.com',
        port: 465,
        sslEnable: true,
        status: StatusEnum.NORMAL,
      });

      const account = await prisma.sysMailAccount.findFirst({
        where: { mail },
      });
      expect(account).toBeDefined();
      createdAccountIds.push(account!.id);

      const deleteResult = await mailAccountService.remove([account!.id]);
      expect(deleteResult.code).toBe(200);

      const deletedAccount = await prisma.sysMailAccount.findUnique({
        where: { id: account!.id },
      });
      expect(deletedAccount!.delFlag).toBe('1');
    });

    it('should get enabled accounts for select', async () => {
      const result = await mailAccountService.getEnabledAccounts();

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach((item: any) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('mail');
        expect(item).toHaveProperty('username');
      });
    });
  });

  describe('Mail Template CRUD Operations', () => {
    let testAccountId: number;

    beforeAll(async () => {
      // 创建测试账号
      const uid = uniqueId();
      await mailAccountService.create({
        mail: `tpl_account_${uid}@example.com`,
        username: `tpluser_${uid}`,
        password: 'tpl_password',
        host: 'smtp.tpl.com',
        port: 465,
        sslEnable: true,
        status: StatusEnum.NORMAL,
      });

      const account = await prisma.sysMailAccount.findFirst({
        where: { mail: `tpl_account_${uid}@example.com` },
      });
      testAccountId = account!.id;
      createdAccountIds.push(testAccountId);
    });

    it('should create and retrieve mail template', async () => {
      const uid = uniqueId();
      const code = `mail_tpl_${uid}`;
      const name = `测试邮件模板_${uid}`;

      const createResult = await mailTemplateService.create({
        accountId: testAccountId,
        code,
        name,
        nickname: '系统通知',
        title: '欢迎注册 - ${username}',
        content: '<h1>欢迎 ${username}</h1><p>您的验证码是 ${code}</p>',
        params: JSON.stringify(['username', 'code']),
        status: StatusEnum.NORMAL,
      });

      expect(createResult.code).toBe(200);

      const template = await prisma.sysMailTemplate.findFirst({
        where: { code },
      });

      expect(template).toBeDefined();
      createdTemplateIds.push(template!.id);

      const findResult = await mailTemplateService.findOne(template!.id);
      expect(findResult.code).toBe(200);
      expect(findResult.data.name).toBe(name);
      // params is stored as JSON string, parse it to check contents
      const params = JSON.parse(findResult.data.params || '[]');
      expect(params).toContain('username');
      expect(params).toContain('code');
    });

    it('should list mail templates with pagination', async () => {
      const result = await mailTemplateService.findAll(
        createListMailTemplateDto({
          pageNum: 1,
          pageSize: 10,
        }),
      );

      expect(result.code).toBe(200);
      expect(result.data.rows).toBeDefined();
      expect(Array.isArray(result.data.rows)).toBe(true);
    });

    it('should filter mail templates by account', async () => {
      const result = await mailTemplateService.findAll(
        createListMailTemplateDto({
          pageNum: 1,
          pageSize: 10,
          accountId: testAccountId,
        }),
      );

      expect(result.code).toBe(200);
      result.data.rows.forEach((row: any) => {
        expect(row.accountId).toBe(testAccountId);
      });
    });

    it('should update mail template', async () => {
      const uid = uniqueId();
      const code = `update_mail_tpl_${uid}`;

      await mailTemplateService.create({
        accountId: testAccountId,
        code,
        name: `更新前邮件模板_${uid}`,
        nickname: '更新前',
        title: '原标题',
        content: '<p>原内容</p>',
        status: StatusEnum.NORMAL,
      });

      const template = await prisma.sysMailTemplate.findFirst({
        where: { code },
      });
      expect(template).toBeDefined();
      createdTemplateIds.push(template!.id);

      const newTitle = '更新后标题 - ${name}';
      const updateResult = await mailTemplateService.update({
        id: template!.id,
        title: newTitle,
      });

      expect(updateResult.code).toBe(200);

      const updatedTemplate = await prisma.sysMailTemplate.findUnique({
        where: { id: template!.id },
      });
      expect(updatedTemplate!.title).toBe(newTitle);
    });
  });

  describe('Mail Log Query Operations', () => {
    it('should list mail logs with pagination', async () => {
      const result = await mailLogService.findAll(
        createListMailLogDto({
          pageNum: 1,
          pageSize: 10,
        }),
      );

      expect(result.code).toBe(200);
      expect(result.data.rows).toBeDefined();
      expect(Array.isArray(result.data.rows)).toBe(true);
      expect(typeof result.data.total).toBe('number');
    });

    it('should filter mail logs by recipient', async () => {
      // 创建测试日志
      await prisma.sysMailLog.create({
        data: {
          toMail: 'recipient@test.com',
          accountId: 1,
          fromMail: 'sender@test.com',
          templateId: 1,
          templateCode: 'test_mail_tpl',
          templateNickname: '测试',
          templateTitle: '测试邮件',
          templateContent: '测试内容',
          sendStatus: 1,
        },
      });

      const result = await mailLogService.findAll(
        createListMailLogDto({
          pageNum: 1,
          pageSize: 10,
          toMail: 'recipient@test.com',
        }),
      );

      expect(result.code).toBe(200);
      result.data.rows.forEach((row: any) => {
        expect(row.toMail).toContain('recipient@test.com');
      });
    });

    it('should filter mail logs by send status', async () => {
      const result = await mailLogService.findAll(
        createListMailLogDto({
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
