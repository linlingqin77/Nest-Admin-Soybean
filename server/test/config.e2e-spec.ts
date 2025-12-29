import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupDatabase, getAuthToken } from './setup-e2e';
import { AppConfigService } from '../src/config/app-config.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * 配置管理 E2E 测试
 * 测试配置列表查询、更新、缓存刷新
 */
describe('ConfigController (e2e)', () => {
  let app: INestApplication;
  let prefix: string;
  let authToken: string;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    const config = app.get(AppConfigService);
    prefix = config.app.prefix;
    prisma = app.get(PrismaService);

    // 获取管理员 token
    authToken = await getAuthToken(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('/system/config/list (GET) - 配置列表查询', () => {
    it('should return config list', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/config/list`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('list');
      expect(Array.isArray(response.body.data.list)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/config/list`)
        .query({ pageNum: 1, pageSize: 10 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data.list.length).toBeLessThanOrEqual(10);
    });

    it('should support filtering by config name', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/config/list`)
        .query({ configName: '验证码' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (response.body.data.list.length > 0) {
        expect(response.body.data.list[0].configName).toContain('验证码');
      }
    });

    it('should support filtering by config key', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/config/list`)
        .query({ configKey: 'sys.account' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (response.body.data.list.length > 0) {
        expect(response.body.data.list[0].configKey).toContain('sys.account');
      }
    });

    it('should support filtering by config type', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/config/list`)
        .query({ configType: 'Y' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (response.body.data.list.length > 0) {
        expect(response.body.data.list[0].configType).toBe('Y');
      }
    });
  });

  describe('/system/config (POST) - 创建配置', () => {
    it('should create config successfully', async () => {
      const newConfig = {
        configName: `test_e2e_config_${Date.now()}`,
        configKey: `test.e2e.config.${Date.now()}`,
        configValue: 'test_value',
        configType: 'N',
        remark: 'E2E Test Config',
      };

      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newConfig)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should fail with duplicate config key', async () => {
      const configKey = `test.e2e.dup.${Date.now()}`;

      // 创建第一个配置
      await request(app.getHttpServer())
        .post(`${prefix}/system/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          configName: `test_e2e_config1_${Date.now()}`,
          configKey,
          configValue: 'value1',
          configType: 'N',
        })
        .expect(200);

      // 尝试创建相同 key 的配置
      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          configName: `test_e2e_config2_${Date.now()}`,
          configKey,
          configValue: 'value2',
          configType: 'N',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          configName: `test_e2e_invalid_${Date.now()}`,
          // missing configKey and configValue
        })
        .expect(400);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/config/:configId (GET) - 获取配置详情', () => {
    let testConfigId: number;

    beforeAll(async () => {
      const testConfig = await prisma.sysConfig.create({
        data: {
          tenantId: '000000',
          configName: `test_e2e_detail_config_${Date.now()}`,
          configKey: `test.e2e.detail.${Date.now()}`,
          configValue: 'detail_value',
          configType: 'N',
          createBy: 'test',
          updateBy: 'test',
        },
      });
      testConfigId = testConfig.configId;
    });

    it('should return config detail', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/config/${testConfigId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('configId');
      expect(response.body.data.configId).toBe(testConfigId);
    });

    it('should fail with invalid config id', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/config/999999`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/config/configKey/:configKey (GET) - 根据 key 获取配置', () => {
    let testConfigKey: string;

    beforeAll(async () => {
      testConfigKey = `test.e2e.bykey.${Date.now()}`;
      await prisma.sysConfig.create({
        data: {
          tenantId: '000000',
          configName: `test_e2e_bykey_config_${Date.now()}`,
          configKey: testConfigKey,
          configValue: 'bykey_value',
          configType: 'N',
          createBy: 'test',
          updateBy: 'test',
        },
      });
    });

    it('should return config by key', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/config/configKey/${testConfigKey}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('configKey');
      expect(response.body.data.configKey).toBe(testConfigKey);
    });

    it('should fail with non-existent config key', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/config/configKey/non.existent.key`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/config (PUT) - 更新配置', () => {
    let testConfigId: number;

    beforeAll(async () => {
      const testConfig = await prisma.sysConfig.create({
        data: {
          tenantId: '000000',
          configName: `test_e2e_update_config_${Date.now()}`,
          configKey: `test.e2e.update.${Date.now()}`,
          configValue: 'original_value',
          configType: 'N',
          createBy: 'test',
          updateBy: 'test',
        },
      });
      testConfigId = testConfig.configId;
    });

    it('should update config successfully', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          configId: testConfigId,
          configName: `test_e2e_updated_config_${Date.now()}`,
          configValue: 'updated_value',
          remark: 'Updated remark',
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证更新是否成功
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/config/${testConfigId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.data.configValue).toBe('updated_value');
    });

    it('should fail with invalid config id', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          configId: 999999,
          configValue: 'updated_value',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/config/:id (DELETE) - 删除配置', () => {
    it('should delete config successfully', async () => {
      const testConfig = await prisma.sysConfig.create({
        data: {
          tenantId: '000000',
          configName: `test_e2e_delete_config_${Date.now()}`,
          configKey: `test.e2e.delete.${Date.now()}`,
          configValue: 'delete_value',
          configType: 'N',
          createBy: 'test',
          updateBy: 'test',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/config/${testConfig.configId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证配置是否被删除
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/config/${testConfig.configId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.code).not.toBe(200);
    });

    it('should delete multiple configs', async () => {
      const config1 = await prisma.sysConfig.create({
        data: {
          tenantId: '000000',
          configName: `test_e2e_del1_${Date.now()}`,
          configKey: `test.e2e.del1.${Date.now()}`,
          configValue: 'value1',
          configType: 'N',
          createBy: 'test',
          updateBy: 'test',
        },
      });

      const config2 = await prisma.sysConfig.create({
        data: {
          tenantId: '000000',
          configName: `test_e2e_del2_${Date.now()}`,
          configKey: `test.e2e.del2.${Date.now()}`,
          configValue: 'value2',
          configType: 'N',
          createBy: 'test',
          updateBy: 'test',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/config/${config1.configId},${config2.configId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should fail with invalid config id', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/config/999999`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });

    it('should not delete system config (configType=Y)', async () => {
      const systemConfig = await prisma.sysConfig.create({
        data: {
          tenantId: '000000',
          configName: `test_e2e_system_config_${Date.now()}`,
          configKey: `test.e2e.system.${Date.now()}`,
          configValue: 'system_value',
          configType: 'Y', // 系统内置配置
          createBy: 'test',
          updateBy: 'test',
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/config/${systemConfig.configId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
      expect(response.body.msg).toContain('内置');
    });
  });

  describe('/system/config/refreshCache (DELETE) - 刷新配置缓存', () => {
    it('should refresh config cache successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/config/refreshCache`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should reload config after cache refresh', async () => {
      // 创建测试配置
      const testConfig = await prisma.sysConfig.create({
        data: {
          tenantId: '000000',
          configName: `test_e2e_cache_config_${Date.now()}`,
          configKey: `test.e2e.cache.${Date.now()}`,
          configValue: 'cache_value',
          configType: 'N',
          createBy: 'test',
          updateBy: 'test',
        },
      });

      // 刷新缓存
      await request(app.getHttpServer())
        .delete(`${prefix}/system/config/refreshCache`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // 验证配置可以正常获取
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/config/configKey/${testConfig.configKey}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.configValue).toBe('cache_value');
    });
  });

  describe('配置缓存验证', () => {
    it('should cache config values', async () => {
      const testConfigKey = `test.e2e.cached.${Date.now()}`;

      // 创建配置
      await prisma.sysConfig.create({
        data: {
          tenantId: '000000',
          configName: `test_e2e_cached_config_${Date.now()}`,
          configKey: testConfigKey,
          configValue: 'cached_value',
          configType: 'N',
          createBy: 'test',
          updateBy: 'test',
        },
      });

      // 第一次获取（会缓存）
      const response1 = await request(app.getHttpServer())
        .get(`${prefix}/system/config/configKey/${testConfigKey}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response1.body.code).toBe(200);

      // 第二次获取（从缓存读取）
      const response2 = await request(app.getHttpServer())
        .get(`${prefix}/system/config/configKey/${testConfigKey}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response2.body.code).toBe(200);
      expect(response2.body.data.configValue).toBe('cached_value');
    });
  });
});
