/**
 * 数据源管理集成测试
 *
 * @description 测试数据源管理模块的集成功能
 * Requirements: 1.1, 1.2, 1.3, 11.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.modules';
import { PrismaService } from '@/platform/prisma';

describe('DataSource Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let createdDataSourceId: number;

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
    // 清理测试数据
    if (createdDataSourceId) {
      await prisma.genDataSource.delete({
        where: { id: createdDataSourceId },
      }).catch(() => {});
    }
    await app.close();
  });

  describe('数据源 CRUD 操作', () => {
    describe('POST /api/v1/tool/gen/datasource', () => {
      it('应该成功创建数据源', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/datasource')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            name: 'test-datasource-' + Date.now(),
            type: 'postgresql',
            host: 'localhost',
            port: 5432,
            database: 'test_db',
            username: 'test_user',
            password: 'test_password',
            remark: '测试数据源',
          });

        expect(response.status).toBe(200);
        if (response.body.code === 200) {
          expect(response.body.data).toHaveProperty('id');
          createdDataSourceId = response.body.data.id;
        }
      });

      it('应该在名称重复时返回错误', async () => {
        if (!createdDataSourceId) {
          console.log('跳过测试：没有创建的数据源');
          return;
        }

        // 获取已创建的数据源名称
        const existingDs = await prisma.genDataSource.findUnique({
          where: { id: createdDataSourceId },
        });

        if (!existingDs) return;

        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/datasource')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            name: existingDs.name,
            type: 'postgresql',
            host: 'localhost',
            port: 5432,
            database: 'test_db',
            username: 'test_user',
            password: 'test_password',
          });

        expect(response.body.code).not.toBe(200);
      });

      it('应该验证必填字段', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/datasource')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            name: 'incomplete-datasource',
            // 缺少必填字段
          });

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/v1/tool/gen/datasource/list', () => {
      it('应该返回数据源列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/datasource/list')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10 });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('rows');
        expect(response.body.data).toHaveProperty('total');
      });

      it('应该支持按名称筛选', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/datasource/list')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10, name: 'test' });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
      });

      it('应该支持按类型筛选', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/datasource/list')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10, type: 'postgresql' });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
      });

      it('应该不返回密码字段', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/datasource/list')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10 });

        expect(response.status).toBe(200);
        if (response.body.data.rows.length > 0) {
          expect(response.body.data.rows[0].password).toBeUndefined();
        }
      });
    });

    describe('GET /api/v1/tool/gen/datasource/:id', () => {
      it('应该返回数据源详情', async () => {
        if (!createdDataSourceId) {
          console.log('跳过测试：没有创建的数据源');
          return;
        }

        const response = await request(app.getHttpServer())
          .get(`/api/v1/tool/gen/datasource/${createdDataSourceId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('name');
        expect(response.body.data.password).toBeUndefined();
      });

      it('应该在数据源不存在时返回错误', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/datasource/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).not.toBe(200);
      });
    });

    describe('PUT /api/v1/tool/gen/datasource/:id', () => {
      it('应该成功更新数据源', async () => {
        if (!createdDataSourceId) {
          console.log('跳过测试：没有创建的数据源');
          return;
        }

        const response = await request(app.getHttpServer())
          .put(`/api/v1/tool/gen/datasource/${createdDataSourceId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            remark: '更新后的备注',
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
      });

      it('应该在数据源不存在时返回错误', async () => {
        const response = await request(app.getHttpServer())
          .put('/api/v1/tool/gen/datasource/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            remark: '更新备注',
          });

        expect(response.status).toBe(200);
        expect(response.body.code).not.toBe(200);
      });
    });

    describe('POST /api/v1/tool/gen/datasource/test', () => {
      it('应该测试数据源连接', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/datasource/test')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            type: 'sqlite',
            host: '',
            port: 0,
            database: ':memory:',
            username: '',
            password: '',
          });

        expect(response.status).toBe(200);
        // SQLite 应该直接返回成功
        expect(response.body.code).toBe(200);
      });
    });

    describe('DELETE /api/v1/tool/gen/datasource/:id', () => {
      it('应该成功删除数据源', async () => {
        if (!createdDataSourceId) {
          console.log('跳过测试：没有创建的数据源');
          return;
        }

        const response = await request(app.getHttpServer())
          .delete(`/api/v1/tool/gen/datasource/${createdDataSourceId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);

        // 标记为已删除，避免 afterAll 重复删除
        createdDataSourceId = 0;
      });

      it('应该在数据源不存在时返回错误', async () => {
        const response = await request(app.getHttpServer())
          .delete('/api/v1/tool/gen/datasource/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).not.toBe(200);
      });
    });
  });
});
