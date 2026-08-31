/**
 * 模板控制器单元测试
 *
 * @description 测试 TemplateController 的所有接口
 * Requirements: 6.2, 6.5, 6.6, 11.1, 15.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TemplateController } from '@/modules/tools/template/template.controller';
import { TemplateService } from '@/modules/tools/template/template.service';
import { Result } from '@/shared/response';
import { Response } from 'express';
import { Reflector } from '@nestjs/core';

// Mock guards
jest.mock('@/core/http/guards/multi-throttle.guard', () => ({
  MultiThrottleGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

// Mock OperlogInterceptor
jest.mock('@/core/http/interceptors/operlog.interceptor', () => ({
  OperlogInterceptor: jest.fn().mockImplementation(() => ({
    intercept: jest.fn().mockImplementation((context, next) => next.handle()),
  })),
}));

describe('TemplateController', () => {
  let controller: TemplateController;
  let mockTemplateService: any;
  let mockResponse: Partial<Response>;

  const mockUser = { userName: 'admin', userId: 1 };

  beforeEach(async () => {
    mockTemplateService = {
      createGroup: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroup: jest.fn(),
      findAllGroups: jest.fn(),
      findOneGroup: jest.fn(),
      getDefaultGroup: jest.fn(),
      exportGroup: jest.fn(),
      exportGroupAsJson: jest.fn(),
      importGroup: jest.fn(),
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      deleteTemplate: jest.fn(),
      findAllTemplates: jest.fn(),
      findOneTemplate: jest.fn(),
      validateTemplate: jest.fn(),
    };

    mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const modules: TestingModule = await Test.createTestingModule({
      controllers: [TemplateController],
      providers: [
        {
          provide: TemplateService,
          useValue: mockTemplateService,
        },
        Reflector,
      ],
    }).compile();

    controller = modules.get<TemplateController>(TemplateController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== 模板组管理测试 ====================

  describe('createGroup - 创建模板组', () => {
    it('应该成功创建模板组', async () => {
      const dto = { name: 'test-group', description: '测试模板组' };
      const expectedResult = Result.ok({ id: 1, ...dto }, '创建成功');
      mockTemplateService.createGroup.mockResolvedValue(expectedResult);

      const result = await controller.createGroup(dto as any, mockUser as any);

      expect(mockTemplateService.createGroup).toHaveBeenCalledWith(dto, mockUser.userName);
      expect(result).toEqual(expectedResult);
    });

    it('应该在名称重复时返回错误', async () => {
      const dto = { name: 'existing-group' };
      const expectedResult = Result.fail(409, '模板组名称已存在');
      mockTemplateService.createGroup.mockResolvedValue(expectedResult);

      const result = await controller.createGroup(dto as any, mockUser as any);

      expect(result.code).toBe(409);
    });
  });

  describe('updateGroup - 更新模板组', () => {
    it('应该成功更新模板组', async () => {
      const id = 1;
      const dto = { name: 'updated-group', description: '更新后的描述' };
      const expectedResult = Result.ok({ id, ...dto }, '更新成功');
      mockTemplateService.updateGroup.mockResolvedValue(expectedResult);

      const result = await controller.updateGroup(id, dto as any, mockUser as any);

      expect(mockTemplateService.updateGroup).toHaveBeenCalledWith(id, dto, mockUser.userName);
      expect(result).toEqual(expectedResult);
    });

    it('应该在模板组不存在时返回错误', async () => {
      const id = 999;
      const dto = { name: 'updated-group' };
      const expectedResult = Result.fail(404, '模板组不存在');
      mockTemplateService.updateGroup.mockResolvedValue(expectedResult);

      const result = await controller.updateGroup(id, dto as any, mockUser as any);

      expect(result.code).toBe(404);
    });

    it('应该在无权修改系统级模板组时返回错误', async () => {
      const id = 1;
      const dto = { name: 'updated-group' };
      const expectedResult = Result.fail(403, '无权修改系统级模板组');
      mockTemplateService.updateGroup.mockResolvedValue(expectedResult);

      const result = await controller.updateGroup(id, dto as any, mockUser as any);

      expect(result.code).toBe(403);
    });
  });

  describe('deleteGroup - 删除模板组', () => {
    it('应该成功删除模板组', async () => {
      const id = 1;
      const expectedResult = Result.ok(null, '删除成功');
      mockTemplateService.deleteGroup.mockResolvedValue(expectedResult);

      const result = await controller.deleteGroup(id, mockUser as any);

      expect(mockTemplateService.deleteGroup).toHaveBeenCalledWith(id, mockUser.userName);
      expect(result).toEqual(expectedResult);
    });

    it('应该在系统级模板组时返回错误', async () => {
      const id = 1;
      const expectedResult = Result.fail(403, '系统级模板组不允许删除');
      mockTemplateService.deleteGroup.mockResolvedValue(expectedResult);

      const result = await controller.deleteGroup(id, mockUser as any);

      expect(result.code).toBe(403);
    });

    it('应该在模板组被使用时返回错误', async () => {
      const id = 1;
      const expectedResult = Result.fail(409, '该模板组已被使用，无法删除');
      mockTemplateService.deleteGroup.mockResolvedValue(expectedResult);

      const result = await controller.deleteGroup(id, mockUser as any);

      expect(result.code).toBe(409);
    });
  });

  describe('listGroups - 查询模板组列表', () => {
    it('应该返回分页的模板组列表', async () => {
      const query = { pageNum: 1, pageSize: 10 };
      const expectedResult = Result.page(
        [{ id: 1, name: 'group1', templates: [] }],
        1,
        1,
        10,
      );
      mockTemplateService.findAllGroups.mockResolvedValue(expectedResult);

      const result = await controller.listGroups(query as any);

      expect(mockTemplateService.findAllGroups).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });

    it('应该支持按名称筛选', async () => {
      const query = { pageNum: 1, pageSize: 10, name: 'test' };
      mockTemplateService.findAllGroups.mockResolvedValue(Result.page([], 0, 1, 10));

      await controller.listGroups(query as any);

      expect(mockTemplateService.findAllGroups).toHaveBeenCalledWith(query);
    });
  });

  describe('findOneGroup - 查询模板组详情', () => {
    it('应该返回模板组详情', async () => {
      const id = 1;
      const expectedResult = Result.ok({
        id: 1,
        name: 'test-group',
        templates: [{ id: 1, name: 'template1' }],
      });
      mockTemplateService.findOneGroup.mockResolvedValue(expectedResult);

      const result = await controller.findOneGroup(id);

      expect(mockTemplateService.findOneGroup).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });

    it('应该在模板组不存在时返回错误', async () => {
      const id = 999;
      const expectedResult = Result.fail(404, '模板组不存在');
      mockTemplateService.findOneGroup.mockResolvedValue(expectedResult);

      const result = await controller.findOneGroup(id);

      expect(result.code).toBe(404);
    });
  });

  describe('getDefaultGroup - 获取默认模板组', () => {
    it('应该返回默认模板组', async () => {
      const expectedResult = Result.ok({
        id: 1,
        name: 'default-group',
        isDefault: true,
        templates: [],
      });
      mockTemplateService.getDefaultGroup.mockResolvedValue(expectedResult);

      const result = await controller.getDefaultGroup();

      expect(mockTemplateService.getDefaultGroup).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('应该在没有默认模板组时返回错误', async () => {
      const expectedResult = Result.fail(404, '未找到默认模板组');
      mockTemplateService.getDefaultGroup.mockResolvedValue(expectedResult);

      const result = await controller.getDefaultGroup();

      expect(result.code).toBe(404);
    });
  });

  describe('exportGroup - 导出模板组', () => {
    it('应该成功导出模板组为 JSON', async () => {
      const id = 1;
      const exportData = JSON.stringify({
        name: 'test-group',
        templates: [{ name: 'template1', content: '...' }],
      });
      mockTemplateService.exportGroupAsJson.mockResolvedValue(Result.ok(exportData));
      mockTemplateService.findOneGroup.mockResolvedValue(Result.ok({ name: 'test-group' }));

      await controller.exportGroup(id, mockResponse as Response);

      expect(mockTemplateService.exportGroupAsJson).toHaveBeenCalledWith(id);
      expect(mockResponse.setHeader).toHaveBeenCalled();
      expect(mockResponse.send).toHaveBeenCalledWith(exportData);
    });

    it('应该在模板组不存在时返回错误', async () => {
      const id = 999;
      mockTemplateService.exportGroupAsJson.mockResolvedValue(Result.fail(404, '模板组不存在'));

      await controller.exportGroup(id, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('importGroup - 导入模板组', () => {
    it('应该成功导入模板组', async () => {
      const dto = {
        name: 'imported-group',
        templates: [{ name: 'template1', fileName: 'test.ts', filePath: 'src/', content: '...' }],
      };
      const expectedResult = Result.ok({ id: 1, ...dto }, '导入成功');
      mockTemplateService.importGroup.mockResolvedValue(expectedResult);

      const result = await controller.importGroup(dto as any, mockUser as any);

      expect(mockTemplateService.importGroup).toHaveBeenCalledWith(dto, mockUser.userName);
      expect(result).toEqual(expectedResult);
    });

    it('应该在模板语法错误时返回错误', async () => {
      const dto = {
        name: 'imported-group',
        templates: [{ name: 'template1', content: '${unclosed' }],
      };
      const expectedResult = Result.fail(400, '模板 "template1" 语法错误');
      mockTemplateService.importGroup.mockResolvedValue(expectedResult);

      const result = await controller.importGroup(dto as any, mockUser as any);

      expect(result.code).toBe(400);
    });
  });

  // ==================== 模板管理测试 ====================

  describe('createTemplate - 创建模板', () => {
    it('应该成功创建模板', async () => {
      const dto = {
        groupId: 1,
        name: 'test-template',
        fileName: '${className}.controller.ts',
        filePath: 'src/controller/',
        content: 'export class ${className}Controller {}',
        language: 'typescript',
      };
      const expectedResult = Result.ok({ id: 1, ...dto }, '创建成功');
      mockTemplateService.createTemplate.mockResolvedValue(expectedResult);

      const result = await controller.createTemplate(dto as any, mockUser as any);

      expect(mockTemplateService.createTemplate).toHaveBeenCalledWith(dto, mockUser.userName);
      expect(result).toEqual(expectedResult);
    });

    it('应该在模板组不存在时返回错误', async () => {
      const dto = { groupId: 999, name: 'test-template' };
      const expectedResult = Result.fail(404, '模板组不存在');
      mockTemplateService.createTemplate.mockResolvedValue(expectedResult);

      const result = await controller.createTemplate(dto as any, mockUser as any);

      expect(result.code).toBe(404);
    });

    it('应该在模板语法错误时返回错误', async () => {
      const dto = { groupId: 1, name: 'test-template', content: '${unclosed' };
      const expectedResult = Result.fail(400, '模板语法错误：存在未闭合的变量表达式');
      mockTemplateService.createTemplate.mockResolvedValue(expectedResult);

      const result = await controller.createTemplate(dto as any, mockUser as any);

      expect(result.code).toBe(400);
    });
  });

  describe('updateTemplate - 更新模板', () => {
    it('应该成功更新模板', async () => {
      const id = 1;
      const dto = { name: 'updated-template', content: 'updated content' };
      const expectedResult = Result.ok({ id, ...dto }, '更新成功');
      mockTemplateService.updateTemplate.mockResolvedValue(expectedResult);

      const result = await controller.updateTemplate(id, dto as any, mockUser as any);

      expect(mockTemplateService.updateTemplate).toHaveBeenCalledWith(id, dto, mockUser.userName);
      expect(result).toEqual(expectedResult);
    });

    it('应该在模板不存在时返回错误', async () => {
      const id = 999;
      const dto = { name: 'updated-template' };
      const expectedResult = Result.fail(404, '模板不存在');
      mockTemplateService.updateTemplate.mockResolvedValue(expectedResult);

      const result = await controller.updateTemplate(id, dto as any, mockUser as any);

      expect(result.code).toBe(404);
    });
  });

  describe('deleteTemplate - 删除模板', () => {
    it('应该成功删除模板', async () => {
      const id = 1;
      const expectedResult = Result.ok(null, '删除成功');
      mockTemplateService.deleteTemplate.mockResolvedValue(expectedResult);

      const result = await controller.deleteTemplate(id, mockUser as any);

      expect(mockTemplateService.deleteTemplate).toHaveBeenCalledWith(id, mockUser.userName);
      expect(result).toEqual(expectedResult);
    });

    it('应该在系统级模板时返回错误', async () => {
      const id = 1;
      const expectedResult = Result.fail(403, '系统级模板不允许删除');
      mockTemplateService.deleteTemplate.mockResolvedValue(expectedResult);

      const result = await controller.deleteTemplate(id, mockUser as any);

      expect(result.code).toBe(403);
    });
  });

  describe('listTemplates - 查询模板列表', () => {
    it('应该返回分页的模板列表', async () => {
      const query = { pageNum: 1, pageSize: 10 };
      const expectedResult = Result.page(
        [{ id: 1, name: 'template1', language: 'typescript' }],
        1,
        1,
        10,
      );
      mockTemplateService.findAllTemplates.mockResolvedValue(expectedResult);

      const result = await controller.listTemplates(query as any);

      expect(mockTemplateService.findAllTemplates).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });

    it('应该支持按模板组筛选', async () => {
      const query = { pageNum: 1, pageSize: 10, groupId: 1 };
      mockTemplateService.findAllTemplates.mockResolvedValue(Result.page([], 0, 1, 10));

      await controller.listTemplates(query as any);

      expect(mockTemplateService.findAllTemplates).toHaveBeenCalledWith(query);
    });
  });

  describe('findOneTemplate - 查询模板详情', () => {
    it('应该返回模板详情', async () => {
      const id = 1;
      const expectedResult = Result.ok({
        id: 1,
        name: 'test-template',
        content: 'template content',
      });
      mockTemplateService.findOneTemplate.mockResolvedValue(expectedResult);

      const result = await controller.findOneTemplate(id);

      expect(mockTemplateService.findOneTemplate).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedResult);
    });

    it('应该在模板不存在时返回错误', async () => {
      const id = 999;
      const expectedResult = Result.fail(404, '模板不存在');
      mockTemplateService.findOneTemplate.mockResolvedValue(expectedResult);

      const result = await controller.findOneTemplate(id);

      expect(result.code).toBe(404);
    });
  });

  // ==================== 模板验证测试 ====================

  describe('validateTemplate - 验证模板语法', () => {
    it('应该返回验证成功结果', async () => {
      const dto = { content: 'export class ${className}Controller {}' };
      const expectedResult = Result.ok({
        valid: true,
        variables: ['className'],
        warnings: [],
      });
      mockTemplateService.validateTemplate.mockResolvedValue(expectedResult);

      const result = await controller.validateTemplate(dto as any);

      expect(mockTemplateService.validateTemplate).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });

    it('应该返回验证失败结果', async () => {
      const dto = { content: '${unclosed' };
      const expectedResult = Result.ok({
        valid: false,
        variables: [],
        warnings: [],
      });
      mockTemplateService.validateTemplate.mockResolvedValue(expectedResult);

      const result = await controller.validateTemplate(dto as any);

      expect(result.data.valid).toBe(false);
    });

    it('应该返回未知变量警告', async () => {
      const dto = { content: '${unknownVar}' };
      const expectedResult = Result.ok({
        valid: true,
        variables: ['unknownVar'],
        warnings: ['发现未知变量: unknownVar。这些变量可能不会被替换。'],
      });
      mockTemplateService.validateTemplate.mockResolvedValue(expectedResult);

      const result = await controller.validateTemplate(dto as any);

      expect(result.data.warnings).toHaveLength(1);
    });
  });
});
