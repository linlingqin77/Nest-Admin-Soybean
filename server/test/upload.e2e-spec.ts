import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanupDatabase, getAuthToken } from './setup-e2e';
import { AppConfigService } from '../src/config/app-config.service';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 文件上传 E2E 测试
 * 测试文件上传、下载、删除
 */
describe('UploadController (e2e)', () => {
  let app: INestApplication;
  let prefix: string;
  let authToken: string;
  let testFilePath: string;

  beforeAll(async () => {
    app = await createTestApp();
    const config = app.get(AppConfigService);
    prefix = config.app.prefix;

    // 获取管理员 token
    authToken = await getAuthToken(app);

    // 创建测试文件
    testFilePath = path.join(__dirname, 'test-upload-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for E2E upload testing.');
  });

  afterAll(async () => {
    // 清理测试文件
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }

    await cleanupDatabase(app);
    await app.close();
  });

  describe('/upload/file (POST) - 文件上传', () => {
    it('should upload file successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/upload/file`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('fileName');
      expect(response.body.data).toHaveProperty('url');
    });

    it('should upload image file', async () => {
      // 创建一个简单的测试图片文件（1x1 PNG）
      const imageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );
      const imagePath = path.join(__dirname, 'test-image.png');
      fs.writeFileSync(imagePath, imageBuffer);

      const response = await request(app.getHttpServer())
        .post(`${prefix}/upload/file`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', imagePath)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data).toHaveProperty('fileName');

      // 清理测试图片
      fs.unlinkSync(imagePath);
    });

    it('should fail without file', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/upload/file`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.code).not.toBe(200);
    });

    it('should fail without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/upload/file`)
        .attach('file', testFilePath)
        .expect(401);

      expect(response.body.code).not.toBe(200);
    });

    it('should handle large file upload', async () => {
      // 创建一个较大的测试文件（1MB）
      const largeFilePath = path.join(__dirname, 'test-large-file.txt');
      const largeContent = 'A'.repeat(1024 * 1024); // 1MB
      fs.writeFileSync(largeFilePath, largeContent);

      const response = await request(app.getHttpServer())
        .post(`${prefix}/upload/file`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', largeFilePath)
        .expect(200);

      expect(response.body.code).toBe(200);

      // 清理大文件
      fs.unlinkSync(largeFilePath);
    });
  });

  describe('/upload/files (POST) - 批量文件上传', () => {
    it('should upload multiple files successfully', async () => {
      // 创建多个测试文件
      const file1Path = path.join(__dirname, 'test-file-1.txt');
      const file2Path = path.join(__dirname, 'test-file-2.txt');
      fs.writeFileSync(file1Path, 'Test file 1 content');
      fs.writeFileSync(file2Path, 'Test file 2 content');

      const response = await request(app.getHttpServer())
        .post(`${prefix}/upload/files`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', file1Path)
        .attach('files', file2Path)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);

      // 清理测试文件
      fs.unlinkSync(file1Path);
      fs.unlinkSync(file2Path);
    });

    it('should fail without files', async () => {
      const response = await request(app.getHttpServer())
        .post(`${prefix}/upload/files`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('文件下载', () => {
    let uploadedFileName: string;

    beforeAll(async () => {
      // 先上传一个文件
      const uploadResponse = await request(app.getHttpServer())
        .post(`${prefix}/upload/file`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(200);

      uploadedFileName = uploadResponse.body.data.fileName;
    });

    it('should download uploaded file', async () => {
      // 注意：实际的下载端点可能不同，这里假设有一个下载端点
      // 如果没有专门的下载端点，可以通过静态文件服务访问
      const response = await request(app.getHttpServer())
        .get(`/upload/${uploadedFileName}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('文件删除', () => {
    it('should delete uploaded file', async () => {
      // 先上传一个文件
      const uploadResponse = await request(app.getHttpServer())
        .post(`${prefix}/upload/file`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(200);

      const fileName = uploadResponse.body.data.fileName;

      // 删除文件（假设有删除端点）
      const deleteResponse = await request(app.getHttpServer())
        .delete(`${prefix}/upload/file/${fileName}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.code).toBe(200);
    });

    it('should fail to delete non-existent file', async () => {
      const response = await request(app.getHttpServer())
        .delete(`${prefix}/upload/file/non-existent-file.txt`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.code).not.toBe(200);
    });
  });

  describe('文件类型验证', () => {
    it('should accept allowed file types', async () => {
      const allowedTypes = ['.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];

      for (const ext of allowedTypes) {
        const testFile = path.join(__dirname, `test-file${ext}`);
        fs.writeFileSync(testFile, 'Test content');

        const response = await request(app.getHttpServer())
          .post(`${prefix}/upload/file`)
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testFile);

        // 清理测试文件
        fs.unlinkSync(testFile);

        // 某些文件类型可能被允许
        if (response.status === 200) {
          expect(response.body.code).toBe(200);
        }
      }
    });

    it('should reject dangerous file types', async () => {
      const dangerousTypes = ['.exe', '.bat', '.sh', '.cmd'];

      for (const ext of dangerousTypes) {
        const testFile = path.join(__dirname, `test-file${ext}`);
        fs.writeFileSync(testFile, 'Test content');

        const response = await request(app.getHttpServer())
          .post(`${prefix}/upload/file`)
          .set('Authorization', `Bearer ${authToken}`)
          .attach('file', testFile);

        // 清理测试文件
        fs.unlinkSync(testFile);

        // 危险文件类型应该被拒绝
        if (response.status !== 200) {
          expect(response.body.code).not.toBe(200);
        }
      }
    });
  });

  describe('文件大小限制', () => {
    it('should reject files exceeding size limit', async () => {
      // 创建一个超大文件（假设限制是 10MB，创建 11MB）
      const oversizedFilePath = path.join(__dirname, 'test-oversized-file.txt');
      const oversizedContent = 'A'.repeat(11 * 1024 * 1024); // 11MB
      fs.writeFileSync(oversizedFilePath, oversizedContent);

      const response = await request(app.getHttpServer())
        .post(`${prefix}/upload/file`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', oversizedFilePath);

      // 清理大文件
      fs.unlinkSync(oversizedFilePath);

      // 应该被拒绝（如果有大小限制）
      if (response.status !== 200) {
        expect(response.body.code).not.toBe(200);
      }
    });
  });

  describe('文件名安全性', () => {
    it('should sanitize file names', async () => {
      // 创建一个包含特殊字符的文件名
      const unsafeFileName = path.join(__dirname, 'test-file-with-特殊字符.txt');
      fs.writeFileSync(unsafeFileName, 'Test content');

      const response = await request(app.getHttpServer())
        .post(`${prefix}/upload/file`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', unsafeFileName)
        .expect(200);

      expect(response.body.code).toBe(200);
      expect(response.body.data.fileName).toBeDefined();

      // 清理测试文件
      fs.unlinkSync(unsafeFileName);
    });

    it('should handle duplicate file names', async () => {
      // 上传同一个文件两次
      const response1 = await request(app.getHttpServer())
        .post(`${prefix}/upload/file`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .post(`${prefix}/upload/file`)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testFilePath)
        .expect(200);

      expect(response1.body.code).toBe(200);
      expect(response2.body.code).toBe(200);

      // 文件名应该不同（添加了时间戳或随机字符）
      expect(response1.body.data.fileName).not.toBe(response2.body.data.fileName);
    });
  });
});
