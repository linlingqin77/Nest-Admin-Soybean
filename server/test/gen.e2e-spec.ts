import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupDatabase, getAuthToken } from './setup-e2e';
import { AppConfigService } from '../src/config/app-config.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * 代码生成 E2E 测试
 * 测试代码生成相关的 API 接口
 */
describe('GenController (e2e)', () => {
  let app: INestApplication;
  let prefix: string;
  let token: string;
  let prisma: PrismaService;
  let importedTableId: number;

  beforeAll(async () => {
    app = await createTestApp();
    const config = app.get(AppConfigService);
    prefix = config.app.prefix;
    prisma = app.get(PrismaService);
    token = await getAuthToken(app);
  });

  afterAll(async () => {
    // 清理测试数据
    await cleanupGenTestData(prisma);
    await cleanupDatabase(app);
    await app.close();
  });

  describe('/tool/gen/db/list (GET) - 查询数据库表列表', () => {
    it('should return database tables list', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/db/list`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.rows)).toBe(true);
    });

    it('should filter tables by name', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/db/list`)
        .query({ tableName: 'sys' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      // All returned tables should contain 'sys' in name
      if (response.body.data.rows.length > 0) {
        response.body.data.rows.forEach((table: any) => {
          expect(table.tableName.toLowerCase()).toContain('sys');
        });
      }
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/db/list`)
        .expect(401);
    });
  });

  describe('/tool/gen/importTable (POST) - 导入表', () => {
    // 使用一个已存在的系统表进行测试
    const testTableName = 'sys_oper_log';

    beforeAll(async () => {
      // 确保测试表未被导入
      await prisma.genTableColumn.deleteMany({
        where: {
          table: { tableName: testTableName },
        },
      });
      await prisma.genTable.deleteMany({
        where: { tableName: testTableName },
      });
    });

    it('should import table successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/tool/gen/importTable`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tableNames: testTableName })
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证表已导入
      const importedTable = await prisma.genTable.findFirst({
        where: { tableName: testTableName },
      });
      expect(importedTable).toBeTruthy();
      importedTableId = importedTable!.tableId;
    });

    it('should fail when table names is empty', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/tool/gen/importTable`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tableNames: '' })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`${prefix}/tool/gen/importTable`)
        .send({ tableNames: 'sys_user' })
        .expect(401);
    });
  });

  describe('/tool/gen/list (GET) - 查询已导入表列表', () => {
    it('should return imported tables list', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/list`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('rows');
      expect(response.body.data).toHaveProperty('total');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/list`)
        .query({ pageNum: 1, pageSize: 5 })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.rows.length).toBeLessThanOrEqual(5);
    });

    it('should filter by table name', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/list`)
        .query({ tableName: 'oper_log' })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('/tool/gen/:tableId (GET) - 查询表详情', () => {
    it('should return table details with columns', async () => {
      if (!importedTableId) {
        console.warn('Skipping test: no imported table');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/${importedTableId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('info');
      expect(response.body.data.info).toHaveProperty('tableName');
      expect(response.body.data.info).toHaveProperty('columns');
      expect(Array.isArray(response.body.data.info.columns)).toBe(true);
    });

    it('should return null for non-existent table', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/999999`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.info).toBeNull();
    });
  });

  describe('/tool/gen (PUT) - 修改代码生成配置', () => {
    it('should update table configuration', async () => {
      if (!importedTableId) {
        console.warn('Skipping test: no imported table');
        return;
      }

      const response = await request(app.getHttpServer())
        .put(`${prefix}/tool/gen`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          tableId: importedTableId,
          functionName: '操作日志测试',
          functionAuthor: 'e2e_test',
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证更新
      const updatedTable = await prisma.genTable.findUnique({
        where: { tableId: importedTableId },
      });
      expect(updatedTable?.functionName).toBe('操作日志测试');
      expect(updatedTable?.functionAuthor).toBe('e2e_test');
    });

    it('should update column configuration', async () => {
      if (!importedTableId) {
        console.warn('Skipping test: no imported table');
        return;
      }

      // 获取第一个列
      const columns = await prisma.genTableColumn.findMany({
        where: { tableId: importedTableId },
        take: 1,
      });

      if (columns.length === 0) {
        console.warn('Skipping test: no columns found');
        return;
      }

      const response = await request(app.getHttpServer())
        .put(`${prefix}/tool/gen`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          tableId: importedTableId,
          columns: [
            {
              columnId: columns[0].columnId,
              columnComment: 'E2E测试列注释',
            },
          ],
        })
        .expect(200);

      expect(response.body.code).toBe(200);
    });
  });

  describe('/tool/gen/preview/:tableId (GET) - 预览代码', () => {
    it('should return preview code', async () => {
      if (!importedTableId) {
        console.warn('Skipping test: no imported table');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/preview/${importedTableId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toBeTruthy();
      // 应该包含多个文件的代码
      expect(typeof response.body.data).toBe('object');
    });

    it('should fail for non-existent table', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/preview/999999`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/tool/gen/synchDb/:tableId (GET) - 同步表结构', () => {
    it('should sync table structure', async () => {
      if (!importedTableId) {
        console.warn('Skipping test: no imported table');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/synchDb/${importedTableId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('added');
      expect(response.body.data).toHaveProperty('updated');
      expect(response.body.data).toHaveProperty('deleted');
    });

    it('should fail for non-existent table', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/synchDb/999999`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/tool/gen/download/:tableName (GET) - 下载代码', () => {
    it('should download code as zip', async () => {
      if (!importedTableId) {
        console.warn('Skipping test: no imported table');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/download/sys_oper_log`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 验证返回的是 zip 文件
      expect(response.headers['content-type']).toContain('application/zip');
    });
  });

  describe('/tool/gen/:tableIds (DELETE) - 删除表配置', () => {
    it('should delete table configuration', async () => {
      if (!importedTableId) {
        console.warn('Skipping test: no imported table');
        return;
      }

      const response = await request(app.getHttpServer())
        .delete(`${prefix}/tool/gen/${importedTableId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证已删除
      const deletedTable = await prisma.genTable.findUnique({
        where: { tableId: importedTableId },
      });
      expect(deletedTable).toBeNull();
    });

    it('should delete multiple tables', async () => {
      // 先导入一个表用于测试
      await request(app.getHttpServer())
        .post(`${prefix}/tool/gen/importTable`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tableNames: 'sys_logininfor' });

      const table = await prisma.genTable.findFirst({
        where: { tableName: 'sys_logininfor' },
      });

      if (table) {
        const response = await request(app.getHttpServer())
          .delete(`${prefix}/tool/gen/${table.tableId}`)
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body.code).toBe(200);
      }
    });
  });

  describe('完整代码生成流程测试', () => {
    const testTableName = 'sys_config';
    let testTableId: number;

    afterAll(async () => {
      // 清理测试数据
      if (testTableId) {
        await prisma.genTableColumn.deleteMany({
          where: { tableId: testTableId },
        });
        await prisma.genTable.deleteMany({
          where: { tableId: testTableId },
        });
      }
    });

    it('should complete full code generation flow', async () => {
      // 1. 确保表未被导入
      await prisma.genTableColumn.deleteMany({
        where: { table: { tableName: testTableName } },
      });
      await prisma.genTable.deleteMany({
        where: { tableName: testTableName },
      });

      // 2. 查询数据库表
      const dbListResponse = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/db/list`)
        .query({ tableName: testTableName })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(dbListResponse.body.code).toBe(200);

      // 3. 导入表
      const importResponse = await request(app.getHttpServer())
        .post(`${prefix}/tool/gen/importTable`)
        .set('Authorization', `Bearer ${token}`)
        .send({ tableNames: testTableName })
        .expect(200);

      expect(importResponse.body.code).toBe(200);

      // 4. 获取导入的表
      const table = await prisma.genTable.findFirst({
        where: { tableName: testTableName },
      });
      expect(table).toBeTruthy();
      testTableId = table!.tableId;

      // 5. 查询表详情
      const detailResponse = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/${testTableId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(detailResponse.body.code).toBe(200);
      expect(detailResponse.body.data.info.columns.length).toBeGreaterThan(0);

      // 6. 修改配置
      const updateResponse = await request(app.getHttpServer())
        .put(`${prefix}/tool/gen`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          tableId: testTableId,
          functionName: '系统配置E2E测试',
          tplCategory: 'crud',
        })
        .expect(200);

      expect(updateResponse.body.code).toBe(200);

      // 7. 预览代码
      const previewResponse = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/preview/${testTableId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(previewResponse.body.code).toBe(200);
      expect(Object.keys(previewResponse.body.data).length).toBeGreaterThan(0);

      // 8. 同步表结构
      const syncResponse = await request(app.getHttpServer())
        .get(`${prefix}/tool/gen/synchDb/${testTableId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(syncResponse.body.code).toBe(200);

      // 9. 删除配置
      const deleteResponse = await request(app.getHttpServer())
        .delete(`${prefix}/tool/gen/${testTableId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(deleteResponse.body.code).toBe(200);
      testTableId = 0; // 标记已删除
    });
  });
});

/**
 * 清理代码生成测试数据
 */
async function cleanupGenTestData(prisma: PrismaService) {
  try {
    // 删除测试导入的表配置
    const testTables = ['sys_oper_log', 'sys_logininfor', 'sys_config'];
    
    for (const tableName of testTables) {
      await prisma.genTableColumn.deleteMany({
        where: { table: { tableName } },
      });
      await prisma.genTable.deleteMany({
        where: { tableName },
      });
    }
  } catch (error) {
    console.error('清理代码生成测试数据失败:', error);
  }
}
