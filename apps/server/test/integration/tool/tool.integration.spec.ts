/**
 * 代码生成器集成测试
 *
 * @description 测试代码生成器模块的集成功能
 * Requirements: 11.1, 15.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.modules';
import { PrismaService } from '@/platform/prisma';

describe('Tool Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // 获取认证 token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-tenant-id', '000000')
      .send({
        username: 'admin',
        password: 'admin123',
      });

    authToken = loginResponse.body.data?.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('代码生成表管理', () => {
    describe('GET /api/v1/tool/gen/list', () => {
      it('应该返回已导入的表列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/list')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10 });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('rows');
        expect(response.body.data).toHaveProperty('total');
        expect(response.body.data).toHaveProperty('pageNum');
        expect(response.body.data).toHaveProperty('pageSize');
      });

      it('应该支持按表名筛选', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/list')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10, tableNames: 'sys' });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
      });

      it('应该在未认证时返回 401', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/list')
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10 });

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/v1/tool/gen/db/list', () => {
      it('应该返回数据库中未导入的表列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/db/list')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10 });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('list');
        expect(response.body.data).toHaveProperty('total');
      });
    });

    describe('GET /api/v1/tool/gen/getDataNames', () => {
      it('应该返回数据源名称列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/getDataNames')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });
  });

  describe('代码预览', () => {
    let testTableId: number;

    beforeAll(async () => {
      // 查找一个已存在的表用于测试
      const table = await prisma.genTable.findFirst({
        where: { delFlag: '0' },
      });
      if (table) {
        testTableId = table.tableId;
      }
    });

    describe('GET /api/v1/tool/gen/preview/:id', () => {
      it('应该返回代码预览内容', async () => {
        if (!testTableId) {
          console.log('跳过测试：没有可用的测试表');
          return;
        }

        const response = await request(app.getHttpServer())
          .get(`/api/v1/tool/gen/preview/${testTableId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('files');
        expect(response.body.data).toHaveProperty('fileTree');
        expect(response.body.data).toHaveProperty('totalFiles');
        expect(response.body.data).toHaveProperty('totalLines');
        expect(response.body.data).toHaveProperty('totalSize');
      });

      it('应该在表不存在时返回错误', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/preview/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).not.toBe(200);
      });
    });

    describe('GET /api/v1/tool/gen/:id', () => {
      it('应该返回表详细信息', async () => {
        if (!testTableId) {
          console.log('跳过测试：没有可用的测试表');
          return;
        }

        const response = await request(app.getHttpServer())
          .get(`/api/v1/tool/gen/${testTableId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('info');
        if (response.body.data.info) {
          expect(response.body.data.info).toHaveProperty('tableId');
          expect(response.body.data.info).toHaveProperty('tableName');
          expect(response.body.data.info).toHaveProperty('columns');
        }
      });
    });
  });
});
