/**
 * 历史记录管理集成测试
 *
 * @description 测试历史记录管理模块的集成功能
 * Requirements: 9.3, 9.5, 11.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/platform/prisma';

describe('History Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testHistoryId: number;

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

    // 创建测试历史记录
    const testHistory = await prisma.genHistory.create({
      data: {
        tenantId: '000000',
        tableId: 1,
        tableName: 'test_table',
        templateGroupId: 1,
        snapshot: JSON.stringify({
          files: [{ name: 'test.ts', path: 'src/test.ts', content: 'test content' }],
          totalFiles: 1,
          totalLines: 1,
          totalSize: 12,
        }),
        generatedBy: 'admin',
        generatedAt: new Date(),
      },
    });
    testHistoryId = testHistory.id;
  });

  afterAll(async () => {
    // 清理测试数据
    if (testHistoryId) {
      await prisma.genHistory.delete({
        where: { id: testHistoryId },
      }).catch(() => {});
    }
    await app.close();
  });

  describe('历史记录查询', () => {
    describe('GET /api/v1/tool/gen/history/list', () => {
      it('应该返回历史记录列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/history/list')
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

      it('应该支持按表ID筛选', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/history/list')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10, tableId: 1 });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
      });

      it('应该支持按表名筛选', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/history/list')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10, tableName: 'test' });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
      });

      it('应该在未认证时返回 401', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/history/list')
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10 });

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/v1/tool/gen/history/:id', () => {
      it('应该返回历史记录详情', async () => {
        if (!testHistoryId) {
          console.log('跳过测试：没有测试历史记录');
          return;
        }

        const response = await request(app.getHttpServer())
          .get(`/api/v1/tool/gen/history/${testHistoryId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('tableName');
        expect(response.body.data).toHaveProperty('snapshotData');
        expect(response.body.data.snapshotData).toHaveProperty('files');
      });

      it('应该在历史记录不存在时返回错误', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/history/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).not.toBe(200);
      });
    });
  });

  describe('历史记录下载', () => {
    describe('GET /api/v1/tool/gen/history/:id/download', () => {
      it('应该下载历史版本代码', async () => {
        if (!testHistoryId) {
          console.log('跳过测试：没有测试历史记录');
          return;
        }

        const response = await request(app.getHttpServer())
          .get(`/api/v1/tool/gen/history/${testHistoryId}/download`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        // 下载成功应该返回 ZIP 文件
        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/zip');
      });

      it('应该在历史记录不存在时返回 404', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/history/999999/download')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(404);
      });
    });
  });

  describe('历史记录删除', () => {
    let deleteTestHistoryId: number;

    beforeAll(async () => {
      // 创建用于删除测试的历史记录
      const history = await prisma.genHistory.create({
        data: {
          tenantId: '000000',
          tableId: 2,
          tableName: 'delete_test_table',
          templateGroupId: 1,
          snapshot: JSON.stringify({ files: [], totalFiles: 0, totalLines: 0, totalSize: 0 }),
          generatedBy: 'admin',
          generatedAt: new Date(),
        },
      });
      deleteTestHistoryId = history.id;
    });

    describe('DELETE /api/v1/tool/gen/history/:id', () => {
      it('应该成功删除历史记录', async () => {
        if (!deleteTestHistoryId) {
          console.log('跳过测试：没有删除测试历史记录');
          return;
        }

        const response = await request(app.getHttpServer())
          .delete(`/api/v1/tool/gen/history/${deleteTestHistoryId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
      });

      it('应该在历史记录不存在时返回错误', async () => {
        const response = await request(app.getHttpServer())
          .delete('/api/v1/tool/gen/history/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).not.toBe(200);
      });
    });
  });

  describe('批量删除历史记录', () => {
    let batchDeleteIds: number[] = [];

    beforeAll(async () => {
      // 创建用于批量删除测试的历史记录
      for (let i = 0; i < 3; i++) {
        const history = await prisma.genHistory.create({
          data: {
            tenantId: '000000',
            tableId: 3,
            tableName: `batch_delete_test_${i}`,
            templateGroupId: 1,
            snapshot: JSON.stringify({ files: [], totalFiles: 0, totalLines: 0, totalSize: 0 }),
            generatedBy: 'admin',
            generatedAt: new Date(),
          },
        });
        batchDeleteIds.push(history.id);
      }
    });

    describe('DELETE /api/v1/tool/gen/history/batch', () => {
      it('应该成功批量删除历史记录', async () => {
        if (batchDeleteIds.length === 0) {
          console.log('跳过测试：没有批量删除测试历史记录');
          return;
        }

        const response = await request(app.getHttpServer())
          .delete('/api/v1/tool/gen/history/batch')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({ historyIds: batchDeleteIds });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toBe(batchDeleteIds.length);
      });

      it('应该处理空数组', async () => {
        const response = await request(app.getHttpServer())
          .delete('/api/v1/tool/gen/history/batch')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({ historyIds: [] });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toBe(0);
      });
    });
  });

  describe('清理过期历史记录', () => {
    describe('POST /api/v1/tool/gen/history/cleanup', () => {
      it('应该使用默认天数清理过期记录', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/history/cleanup')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(typeof response.body.data).toBe('number');
      });

      it('应该使用指定天数清理过期记录', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/history/cleanup')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ days: 7 });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(typeof response.body.data).toBe('number');
      });
    });
  });
});
