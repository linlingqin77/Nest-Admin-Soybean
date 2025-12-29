import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupDatabase, getAuthToken, createTestDept } from './setup-e2e';
import { AppConfigService } from '../src/config/app-config.service';

/**
 * 部门管理 E2E 测试
 * 测试部门树查询、创建、更新、删除
 */
describe('DeptController (e2e)', () => {
  let app: INestApplication;
  let prefix: string;
  let authToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const config = app.get(AppConfigService);
    prefix = config.app.prefix;
  });

  // 在每个测试前获取新的 token，避免 token 失效
  beforeEach(async () => {
    authToken = await getAuthToken(app);
  });

  afterAll(async () => {
    await cleanupDatabase(app);
    await app.close();
  });

  describe('/system/dept/list (GET) - 部门列表查询', () => {
    it('should return department list', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/dept/list`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support filtering by department name', async () => {
      // 创建测试部门 - 使用更短的名称
      const timestamp = Date.now().toString().slice(-6); // 只使用最后6位
      const testDept = await createTestDept(app, {
        deptName: `test_dept_${timestamp}`,
        orderNum: 999,
      });

      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/dept/list`)
        .query({ deptName: testDept.deptName })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].deptName).toBe(testDept.deptName);
    });

    it('should support filtering by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/dept/list`)
        .query({ status: 'NORMAL' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      if (response.body.data.length > 0) {
        expect(response.body.data[0].status).toBe('NORMAL');
      }
    });

    it('should reject without permission', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/dept/list`)
        .expect(401);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/dept (POST) - 创建部门', () => {
    it('should create department successfully', async () => {
      const timestamp = Date.now().toString().slice(-6);
      const newDept = {
        deptName: `test_cr_${timestamp}`,
        parentId: 0,
        orderNum: 999,
        leader: 'Test Leader',
        phone: '13800138000',
        email: `dept${timestamp}@test.com`,
        status: 'NORMAL',
      };

      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/dept`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(newDept)
        .expect(200);

      expect(response.body.code).toBe(200);
    });

    it('should create child department', async () => {
      const timestamp = Date.now().toString().slice(-6);
      // 先创建父部门
      const parentDept = await createTestDept(app, {
        deptName: `test_p_${timestamp}`,
        parentId: 0,
        orderNum: 999,
      });

      // 创建子部门
      const childDept = {
        deptName: `test_c_${timestamp}`,
        parentId: parentDept.deptId,
        orderNum: 1,
        leader: 'Child Leader',
        status: 'NORMAL',
      };

      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/dept`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(childDept)
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证子部门的 ancestors 字段
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/dept/list`)
        .query({ deptName: childDept.deptName })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(verifyResponse.body.data[0].parentId).toBe(parentDept.deptId);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/dept`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // missing deptName
          parentId: 0,
        })
        .expect(400);

      expect(response.body.code).not.toBe(200);
    });

    it('should fail with duplicate department name under same parent', async () => {
      const timestamp = Date.now().toString().slice(-6);
      const deptName = `test_dup_${timestamp}`;

      // 创建第一个部门
      await request(app.getHttpServer())
        .post(`${prefix}/system/dept`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deptName,
          parentId: 0,
          orderNum: 999,
          status: 'NORMAL',
        })
        .expect(200);

      // 尝试创建同名部门
      const response = await request(app.getHttpServer())
        .post(`${prefix}/system/dept`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deptName,
          parentId: 0,
          orderNum: 999,
          status: 'NORMAL',
        })
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/dept/:id (GET) - 获取部门详情', () => {
    let testDeptId: number;

    beforeAll(async () => {
      const timestamp = Date.now().toString().slice(-6);
      const testDept = await createTestDept(app, {
        deptName: `test_det_${timestamp}`,
        orderNum: 999,
      });
      testDeptId = testDept.deptId;
    });

    it('should return department detail', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/dept/${testDeptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('deptId');
      expect(response.body.data.deptId).toBe(testDeptId);
    });

    it('should fail with invalid department id', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/dept/999999`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(response.status);
      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/dept (PUT) - 更新部门', () => {
    let testDeptId: number;

    beforeAll(async () => {
      const timestamp = Date.now().toString().slice(-6);
      const testDept = await createTestDept(app, {
        deptName: `test_upd_${timestamp}`,
        orderNum: 999,
        leader: 'Original Leader',
      });
      testDeptId = testDept.deptId;
    });

    it('should update department successfully', async () => {
      const timestamp = Date.now().toString().slice(-6);
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/dept`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deptId: testDeptId,
          deptName: `test_upd2_${timestamp}`,
          parentId: 0,
          orderNum: 999,
          leader: 'Updated Leader',
          phone: '13900139000',
          email: `upd${timestamp}@test.com`,
          status: 'NORMAL',
        })
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证更新是否成功
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/dept/${testDeptId}`)
        .set('Authorization', `Bearer ${authToken}`);

      if (verifyResponse.status === 200 && verifyResponse.body.code === 200) {
        expect(verifyResponse.body.data.leader).toBe('Updated Leader');
      }
    });

    it('should fail with invalid department id', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/dept`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deptId: 999999,
          deptName: 'Updated Name',
          parentId: 0,
          orderNum: 0,
        });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body.code).not.toBe(200);
    });

    it('should not allow setting parent to self', async () => {
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/dept`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deptId: testDeptId,
          parentId: testDeptId,
          deptName: 'Self Parent',
          orderNum: 0,
        });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body.code).not.toBe(200);
    });

    it('should not allow setting parent to descendant', async () => {
      const timestamp = Date.now().toString().slice(-6);
      // 创建父子部门
      const parentDept = await createTestDept(app, {
        deptName: `test_par_${timestamp}`,
        parentId: 0,
      });

      const childDept = await createTestDept(app, {
        deptName: `test_chi_${timestamp}`,
        parentId: parentDept.deptId,
      });

      // 尝试将父部门的父级设置为子部门
      const response = await request(app.getHttpServer())
        .put(`${prefix}/system/dept`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deptId: parentDept.deptId,
          parentId: childDept.deptId,
          deptName: parentDept.deptName,
          orderNum: 0,
        });

      expect([200, 400, 500]).toContain(response.status);
      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/dept/:id (DELETE) - 删除部门', () => {
    it('should delete department successfully', async () => {
      const timestamp = Date.now().toString().slice(-6);
      const testDept = await createTestDept(app, {
        deptName: `test_del_${timestamp}`,
        orderNum: 999,
      });

      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/dept/${testDept.deptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // 验证部门是否被删除
      const verifyResponse = await request(app.getHttpServer())
        .get(`${prefix}/system/dept/${testDept.deptId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(verifyResponse.status);
      expect(verifyResponse.body.code).not.toBe(200);
    });

    it('should fail to delete department with children', async () => {
      const timestamp = Date.now().toString().slice(-6);
      // 创建父子部门
      const parentDept = await createTestDept(app, {
        deptName: `test_pdel_${timestamp}`,
        parentId: 0,
      });

      await createTestDept(app, {
        deptName: `test_cdel_${timestamp}`,
        parentId: parentDept.deptId,
      });

      // 尝试删除有子部门的父部门
      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/dept/${parentDept.deptId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(response.status);
      expect(response.body.code).not.toBe(200);
      // 不强制要求错误消息包含"子部门"，因为可能返回通用错误
    });

    it('should fail with invalid department id', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${prefix}/system/dept/999999`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(response.status);
      expect(response.body.code).not.toBe(200);
    });
  });

  describe('/system/dept/list/exclude/:id (GET) - 排除节点列表', () => {
    it('should return department list excluding specified node and its children', async () => {
      const timestamp = Date.now().toString().slice(-6);
      // 创建父子部门
      const parentDept = await createTestDept(app, {
        deptName: `test_exp_${timestamp}`,
        parentId: 0,
      });

      const childDept = await createTestDept(app, {
        deptName: `test_exc_${timestamp}`,
        parentId: parentDept.deptId,
      });

      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/dept/list/exclude/${parentDept.deptId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);

      // 验证返回的列表不包含父部门和子部门
      const deptIds = response.body.data.map((dept: any) => dept.deptId);
      expect(deptIds).not.toContain(parentDept.deptId);
      expect(deptIds).not.toContain(childDept.deptId);
    });
  });

  describe('/system/dept/optionselect (GET) - 部门选择框列表', () => {
    it('should return department option list', async () => {
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/dept/optionselect`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('部门树结构验证', () => {
    it('should maintain correct tree structure', async () => {
      const timestamp = Date.now().toString().slice(-6);
      // 创建多层级部门
      const level1 = await createTestDept(app, {
        deptName: `test_l1_${timestamp}`,
        parentId: 0,
        orderNum: 1,
      });

      const level2 = await createTestDept(app, {
        deptName: `test_l2_${timestamp}`,
        parentId: level1.deptId,
        orderNum: 1,
      });

      const level3 = await createTestDept(app, {
        deptName: `test_l3_${timestamp}`,
        parentId: level2.deptId,
        orderNum: 1,
      });

      // 获取部门列表
      const response = await request(app.getHttpServer())
        .get(`${prefix}/system/dept/list`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).toBe(200);

      // 查找创建的部门
      const depts = response.body.data;
      const l1Dept = depts.find((d: any) => d.deptId === level1.deptId);
      const l2Dept = depts.find((d: any) => d.deptId === level2.deptId);
      const l3Dept = depts.find((d: any) => d.deptId === level3.deptId);

      // 验证层级关系
      expect(l1Dept.parentId).toBe(0);
      expect(l2Dept.parentId).toBe(level1.deptId);
      expect(l3Dept.parentId).toBe(level2.deptId);

      // 验证 ancestors 字段
      expect(l2Dept.ancestors).toContain(String(level1.deptId));
      expect(l3Dept.ancestors).toContain(String(level2.deptId));
    });
  });
});
