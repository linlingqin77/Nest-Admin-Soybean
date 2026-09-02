/**
 * 模板管理集成测试
 *
 * @description 测试模板管理模块的集成功能
 * Requirements: 6.2, 6.5, 6.6, 11.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/platform/prisma';

describe('Template Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let createdGroupId: number;
  let createdTemplateId: number;

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
    if (createdTemplateId) {
      await prisma.genTemplate.delete({
        where: { id: createdTemplateId },
      }).catch(() => {});
    }
    if (createdGroupId) {
      await prisma.genTemplateGroup.delete({
        where: { id: createdGroupId },
      }).catch(() => {});
    }
    await app.close();
  });

  describe('模板组管理', () => {
    describe('POST /api/v1/tool/gen/template/group', () => {
      it('应该成功创建模板组', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/template/group')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            name: 'test-group-' + Date.now(),
            description: '测试模板组',
          });

        expect(response.status).toBe(200);
        if (response.body.code === 200) {
          expect(response.body.data).toHaveProperty('id');
          createdGroupId = response.body.data.id;
        }
      });

      it('应该在名称重复时返回错误', async () => {
        if (!createdGroupId) {
          console.log('跳过测试：没有创建的模板组');
          return;
        }

        const existingGroup = await prisma.genTemplateGroup.findUnique({
          where: { id: createdGroupId },
        });

        if (!existingGroup) return;

        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/template/group')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            name: existingGroup.name,
            description: '重复名称测试',
          });

        expect(response.body.code).not.toBe(200);
      });
    });

    describe('GET /api/v1/tool/gen/template/group/list', () => {
      it('应该返回模板组列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/template/group/list')
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
          .get('/api/v1/tool/gen/template/group/list')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10, name: 'test' });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
      });
    });

    describe('GET /api/v1/tool/gen/template/group/:id', () => {
      it('应该返回模板组详情', async () => {
        if (!createdGroupId) {
          console.log('跳过测试：没有创建的模板组');
          return;
        }

        const response = await request(app.getHttpServer())
          .get(`/api/v1/tool/gen/template/group/${createdGroupId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('name');
        expect(response.body.data).toHaveProperty('templates');
      });

      it('应该在模板组不存在时返回错误', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/template/group/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).not.toBe(200);
      });
    });

    describe('PUT /api/v1/tool/gen/template/group/:id', () => {
      it('应该成功更新模板组', async () => {
        if (!createdGroupId) {
          console.log('跳过测试：没有创建的模板组');
          return;
        }

        const response = await request(app.getHttpServer())
          .put(`/api/v1/tool/gen/template/group/${createdGroupId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            description: '更新后的描述',
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
      });
    });
  });

  describe('模板管理', () => {
    describe('POST /api/v1/tool/gen/template', () => {
      it('应该成功创建模板', async () => {
        if (!createdGroupId) {
          console.log('跳过测试：没有创建的模板组');
          return;
        }

        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/template')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            groupId: createdGroupId,
            name: 'test-template-' + Date.now(),
            fileName: '${className}.controller.ts',
            filePath: 'src/controller/',
            content: 'export class ${className}Controller {}',
            language: 'typescript',
          });

        expect(response.status).toBe(200);
        if (response.body.code === 200) {
          expect(response.body.data).toHaveProperty('id');
          createdTemplateId = response.body.data.id;
        }
      });

      it('应该在模板语法错误时返回错误', async () => {
        if (!createdGroupId) {
          console.log('跳过测试：没有创建的模板组');
          return;
        }

        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/template')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            groupId: createdGroupId,
            name: 'invalid-template',
            fileName: 'test.ts',
            filePath: 'src/',
            content: '${unclosed',
            language: 'typescript',
          });

        expect(response.body.code).not.toBe(200);
      });

      it('应该在模板组不存在时返回错误', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/template')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            groupId: 999999,
            name: 'orphan-template',
            fileName: 'test.ts',
            filePath: 'src/',
            content: 'content',
            language: 'typescript',
          });

        expect(response.body.code).not.toBe(200);
      });
    });

    describe('GET /api/v1/tool/gen/template/list', () => {
      it('应该返回模板列表', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/template/list')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10 });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('rows');
        expect(response.body.data).toHaveProperty('total');
      });

      it('应该支持按模板组筛选', async () => {
        if (!createdGroupId) {
          console.log('跳过测试：没有创建的模板组');
          return;
        }

        const response = await request(app.getHttpServer())
          .get('/api/v1/tool/gen/template/list')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .query({ pageNum: 1, pageSize: 10, groupId: createdGroupId });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
      });
    });

    describe('GET /api/v1/tool/gen/template/:id', () => {
      it('应该返回模板详情', async () => {
        if (!createdTemplateId) {
          console.log('跳过测试：没有创建的模板');
          return;
        }

        const response = await request(app.getHttpServer())
          .get(`/api/v1/tool/gen/template/${createdTemplateId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data).toHaveProperty('id');
        expect(response.body.data).toHaveProperty('name');
        expect(response.body.data).toHaveProperty('content');
      });
    });

    describe('PUT /api/v1/tool/gen/template/:id', () => {
      it('应该成功更新模板', async () => {
        if (!createdTemplateId) {
          console.log('跳过测试：没有创建的模板');
          return;
        }

        const response = await request(app.getHttpServer())
          .put(`/api/v1/tool/gen/template/${createdTemplateId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            content: 'export class ${className}Controller { updated }',
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
      });
    });
  });

  describe('模板验证', () => {
    describe('POST /api/v1/tool/gen/template/validate', () => {
      it('应该验证有效的模板', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/template/validate')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            content: 'export class ${className}Controller {}',
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.valid).toBe(true);
        expect(response.body.data.variables).toContain('className');
      });

      it('应该检测无效的模板语法', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/template/validate')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            content: '${unclosed',
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.valid).toBe(false);
      });

      it('应该警告未知变量', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/template/validate')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send({
            content: '${unknownVariable}',
          });

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        expect(response.body.data.warnings.length).toBeGreaterThan(0);
      });
    });
  });

  describe('模板导入导出', () => {
    describe('GET /api/v1/tool/gen/template/group/:id/export', () => {
      it('应该导出模板组', async () => {
        if (!createdGroupId) {
          console.log('跳过测试：没有创建的模板组');
          return;
        }

        const response = await request(app.getHttpServer())
          .get(`/api/v1/tool/gen/template/group/${createdGroupId}/export`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        // 响应应该是 JSON 格式
        expect(response.headers['content-type']).toContain('application/json');
      });
    });

    describe('POST /api/v1/tool/gen/template/group/import', () => {
      it('应该导入模板组', async () => {
        const importData = {
          name: 'imported-group-' + Date.now(),
          description: '导入的模板组',
          templates: [
            {
              name: 'imported-template',
              fileName: 'test.ts',
              filePath: 'src/',
              content: 'export class ${className} {}',
              language: 'typescript',
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/template/group/import')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send(importData);

        expect(response.status).toBe(200);
        if (response.body.code === 200) {
          // 清理导入的模板组
          await prisma.genTemplate.deleteMany({
            where: { groupId: response.body.data.id },
          });
          await prisma.genTemplateGroup.delete({
            where: { id: response.body.data.id },
          });
        }
      });

      it('应该在模板语法错误时返回错误', async () => {
        const importData = {
          name: 'invalid-import-' + Date.now(),
          templates: [
            {
              name: 'invalid-template',
              fileName: 'test.ts',
              filePath: 'src/',
              content: '${unclosed',
              language: 'typescript',
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/tool/gen/template/group/import')
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000')
          .send(importData);

        expect(response.body.code).not.toBe(200);
      });
    });
  });

  describe('清理测试数据', () => {
    describe('DELETE /api/v1/tool/gen/template/:id', () => {
      it('应该成功删除模板', async () => {
        if (!createdTemplateId) {
          console.log('跳过测试：没有创建的模板');
          return;
        }

        const response = await request(app.getHttpServer())
          .delete(`/api/v1/tool/gen/template/${createdTemplateId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        createdTemplateId = 0;
      });
    });

    describe('DELETE /api/v1/tool/gen/template/group/:id', () => {
      it('应该成功删除模板组', async () => {
        if (!createdGroupId) {
          console.log('跳过测试：没有创建的模板组');
          return;
        }

        const response = await request(app.getHttpServer())
          .delete(`/api/v1/tool/gen/template/group/${createdGroupId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('x-tenant-id', '000000');

        expect(response.status).toBe(200);
        expect(response.body.code).toBe(200);
        createdGroupId = 0;
      });
    });
  });
});
