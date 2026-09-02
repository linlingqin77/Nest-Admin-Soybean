/**
 * 错误码文档生成器单元测试
 */
import {
  ErrorCodeCategory,
  generateErrorCodeJson,
  generateErrorCodeMarkdown,
  getAllErrorCodes,
  getErrorCodesByCategory,
} from '@/shared/response/error-codes.doc';
import { ResponseCode } from '@/shared/response';

describe('ErrorCodesDoc', () => {
  describe('getAllErrorCodes', () => {
    it('should return all error codes sorted by code', () => {
      const codes = getAllErrorCodes();

      expect(codes.length).toBeGreaterThan(0);
      // 验证排序
      for (let i = 1; i < codes.length; i++) {
        expect(codes[i].code).toBeGreaterThanOrEqual(codes[i - 1].code);
      }
    });

    it('should include SUCCESS code', () => {
      const codes = getAllErrorCodes();
      const successCode = codes.find((c) => c.code === ResponseCode.SUCCESS);

      expect(successCode).toBeDefined();
      expect(successCode?.message).toBe('操作成功');
      expect(successCode?.category).toBe(ErrorCodeCategory.SUCCESS);
    });

    it('should include all required fields for each code', () => {
      const codes = getAllErrorCodes();

      for (const code of codes) {
        expect(code.code).toBeDefined();
        expect(typeof code.code).toBe('number');
        expect(code.message).toBeDefined();
        expect(typeof code.message).toBe('string');
        expect(code.category).toBeDefined();
        expect(Object.values(ErrorCodeCategory)).toContain(code.category);
      }
    });
  });

  describe('getErrorCodesByCategory', () => {
    it('should return codes grouped by category', () => {
      const codesByCategory = getErrorCodesByCategory();

      // 验证所有分类都存在
      expect(codesByCategory[ErrorCodeCategory.SUCCESS]).toBeDefined();
      expect(codesByCategory[ErrorCodeCategory.CLIENT_ERROR]).toBeDefined();
      expect(codesByCategory[ErrorCodeCategory.SERVER_ERROR]).toBeDefined();
      expect(codesByCategory[ErrorCodeCategory.BUSINESS_ERROR]).toBeDefined();
      expect(codesByCategory[ErrorCodeCategory.AUTH_ERROR]).toBeDefined();
      expect(codesByCategory[ErrorCodeCategory.USER_ERROR]).toBeDefined();
      expect(codesByCategory[ErrorCodeCategory.TENANT_ERROR]).toBeDefined();
      expect(codesByCategory[ErrorCodeCategory.FILE_ERROR]).toBeDefined();
      expect(codesByCategory[ErrorCodeCategory.EXTERNAL_ERROR]).toBeDefined();
    });

    it('should have SUCCESS code in SUCCESS category', () => {
      const codesByCategory = getErrorCodesByCategory();
      const successCodes = codesByCategory[ErrorCodeCategory.SUCCESS];

      expect(successCodes.some((c) => c.code === ResponseCode.SUCCESS)).toBe(true);
    });

    it('should have 401 in CLIENT_ERROR category', () => {
      const codesByCategory = getErrorCodesByCategory();
      const clientErrors = codesByCategory[ErrorCodeCategory.CLIENT_ERROR];

      expect(clientErrors.some((c) => c.code === ResponseCode.UNAUTHORIZED)).toBe(true);
    });

    it('should have 2006 in AUTH_ERROR category', () => {
      const codesByCategory = getErrorCodesByCategory();
      const authErrors = codesByCategory[ErrorCodeCategory.AUTH_ERROR];

      expect(authErrors.some((c) => c.code === ResponseCode.PASSWORD_ERROR)).toBe(true);
    });
  });

  describe('generateErrorCodeMarkdown', () => {
    it('should generate valid markdown', () => {
      const markdown = generateErrorCodeMarkdown();

      expect(markdown).toContain('# API 错误码文档');
      expect(markdown).toContain('## 响应格式');
      expect(markdown).toContain('| 错误码 | 错误消息 | 说明 | 解决方案 |');
      expect(markdown).toContain('| 200 | 操作成功 |');
    });

    it('should include all categories', () => {
      const markdown = generateErrorCodeMarkdown();

      expect(markdown).toContain('## 成功');
      expect(markdown).toContain('## 客户端错误');
      expect(markdown).toContain('## 服务端错误');
      expect(markdown).toContain('## 通用业务错误');
      expect(markdown).toContain('## 认证授权错误');
    });
  });

  describe('generateErrorCodeJson', () => {
    it('should generate valid JSON structure', () => {
      const json = generateErrorCodeJson() as any;

      expect(json.title).toBe('API 错误码文档');
      expect(json.description).toBeDefined();
      expect(json.responseFormat).toBeDefined();
      expect(json.categories).toBeDefined();
    });

    it('should include response format description', () => {
      const json = generateErrorCodeJson() as any;

      expect(json.responseFormat.code).toBeDefined();
      expect(json.responseFormat.msg).toBeDefined();
      expect(json.responseFormat.data).toBeDefined();
      expect(json.responseFormat.requestId).toBeDefined();
      expect(json.responseFormat.timestamp).toBeDefined();
    });

    it('should include all categories in JSON', () => {
      const json = generateErrorCodeJson() as any;

      expect(json.categories[ErrorCodeCategory.SUCCESS]).toBeDefined();
      expect(json.categories[ErrorCodeCategory.CLIENT_ERROR]).toBeDefined();
      expect(json.categories[ErrorCodeCategory.AUTH_ERROR]).toBeDefined();
    });
  });
});
