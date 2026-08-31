/**
 * 模板服务单元测试
 *
 * @description 测试 TemplateService 的所有方法
 * Requirements: 6.2, 6.4, 6.5, 6.6, 11.1
 */
import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from '@/modules/tools/template/template.service';
import { PrismaService } from '@/platform/prisma';
import { TenantContext } from '@/core/tenancy/context/tenant.context';
import { ResponseCode } from '@/shared/response';

describe('TemplateService', () => {
  let service: TemplateService;
  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      genTemplateGroup: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      genTemplate: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      genTable: {
        count: jest.fn(),
      },
      $transaction: jest.fn((callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrismaService);
        }
        return Promise.all(callback);
      }),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = modules.get<TemplateService>(TemplateService);

    // 设置租户上下文
    jest.spyOn(TenantContext, 'getTenantId').mockReturnValue('000000');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== 模板组管理测试 ====================

  describe('createGroup - 创建模板组', () => {
    it('应该成功创建模板组', async () => {
      const dto = { name: 'test-group', description: '测试模板组' };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(null);
      mockPrismaService.genTemplateGroup.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.createGroup(dto as any, 'admin');

      expect(result.code).toBe(200);
      expect(result.msg).toBe('创建成功');
      expect(mockPrismaService.genTemplateGroup.create).toHaveBeenCalled();
    });

    it('应该在名称重复时返回错误', async () => {
      const dto = { name: 'existing-group' };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue({ id: 1, name: 'existing-group' });

      const result = await service.createGroup(dto as any, 'admin');

      expect(result.code).toBe(ResponseCode.DATA_ALREADY_EXISTS);
    });

    it('应该在设置为默认时取消其他默认模板组', async () => {
      const dto = { name: 'new-default', isDefault: true };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(null);
      mockPrismaService.genTemplateGroup.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.genTemplateGroup.create.mockResolvedValue({ id: 1, ...dto });

      await service.createGroup(dto as any, 'admin');

      expect(mockPrismaService.genTemplateGroup.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isDefault: false },
        }),
      );
    });
  });

  describe('updateGroup - 更新模板组', () => {
    it('应该成功更新模板组', async () => {
      const id = 1;
      const dto = { name: 'updated-group' };

      mockPrismaService.genTemplateGroup.findFirst
        .mockResolvedValueOnce({ id: 1, name: 'old-group', tenantId: '000000' })
        .mockResolvedValueOnce(null);
      mockPrismaService.genTemplateGroup.update.mockResolvedValue({ id, ...dto });

      const result = await service.updateGroup(id, dto as any, 'admin');

      expect(result.code).toBe(200);
      expect(result.msg).toBe('更新成功');
    });

    it('应该在模板组不存在时返回错误', async () => {
      const id = 999;
      const dto = { name: 'updated-group' };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(null);

      const result = await service.updateGroup(id, dto as any, 'admin');

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });

    it('应该在无权修改系统级模板组时返回错误', async () => {
      const id = 1;
      const dto = { name: 'updated-group' };

      // 使用非超级租户 ID
      jest.spyOn(TenantContext, 'getTenantId').mockReturnValue('100001');

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue({
        id: 1,
        name: 'system-group',
        tenantId: null, // 系统级
        delFlag: '0',
      });

      const result = await service.updateGroup(id, dto as any, 'admin');

      expect(result.code).toBe(ResponseCode.PERMISSION_DENIED);

      // 恢复为默认租户 ID
      jest.spyOn(TenantContext, 'getTenantId').mockReturnValue('000000');
    });
  });

  describe('deleteGroup - 删除模板组', () => {
    it('应该成功软删除模板组', async () => {
      const id = 1;

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue({
        id: 1,
        name: 'test-group',
        tenantId: '000000',
      });
      mockPrismaService.genTable.count.mockResolvedValue(0);
      mockPrismaService.$transaction.mockResolvedValue([{ count: 2 }, { id: 1 }]);

      const result = await service.deleteGroup(id, 'admin');

      expect(result.code).toBe(200);
      expect(result.msg).toBe('删除成功');
    });

    it('应该在系统级模板组时返回错误', async () => {
      const id = 1;

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue({
        id: 1,
        name: 'system-group',
        tenantId: null,
      });

      const result = await service.deleteGroup(id, 'admin');

      expect(result.code).toBe(ResponseCode.PERMISSION_DENIED);
    });

    it('应该在模板组被使用时返回错误', async () => {
      const id = 1;

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue({
        id: 1,
        name: 'test-group',
        tenantId: '000000',
      });
      mockPrismaService.genTable.count.mockResolvedValue(5);

      const result = await service.deleteGroup(id, 'admin');

      expect(result.code).toBe(ResponseCode.DATA_IN_USE);
    });
  });

  describe('findAllGroups - 查询模板组列表', () => {
    it('应该返回分页的模板组列表', async () => {
      const query = { pageNum: 1, pageSize: 10, skip: 0, take: 10, getOrderBy: () => ({}) };
      const mockGroups = [
        { id: 1, name: 'group1', templates: [] },
        { id: 2, name: 'group2', templates: [] },
      ];

      mockPrismaService.genTemplateGroup.findMany.mockResolvedValue(mockGroups);
      mockPrismaService.genTemplateGroup.count.mockResolvedValue(2);

      const result = await service.findAllGroups(query as any);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(2);
      expect(result.data.total).toBe(2);
    });
  });

  describe('findOneGroup - 查询单个模板组', () => {
    it('应该返回模板组详情', async () => {
      const id = 1;
      const mockGroup = {
        id: 1,
        name: 'test-group',
        templates: [{ id: 1, name: 'template1' }],
      };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(mockGroup);

      const result = await service.findOneGroup(id);

      expect(result.code).toBe(200);
      expect(result.data?.name).toBe('test-group');
    });

    it('应该在模板组不存在时返回错误', async () => {
      const id = 999;

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(null);

      const result = await service.findOneGroup(id);

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });
  });

  describe('getDefaultGroup - 获取默认模板组', () => {
    it('应该返回默认模板组', async () => {
      const mockGroup = {
        id: 1,
        name: 'default-group',
        isDefault: true,
        templates: [],
      };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(mockGroup);

      const result = await service.getDefaultGroup();

      expect(result.code).toBe(200);
      expect(result.data?.isDefault).toBe(true);
    });

    it('应该在没有默认模板组时返回错误', async () => {
      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(null);

      const result = await service.getDefaultGroup();

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });
  });

  // ==================== 模板管理测试 ====================

  describe('createTemplate - 创建模板', () => {
    it('应该成功创建模板', async () => {
      const dto = {
        groupId: 1,
        name: 'test-template',
        fileName: '${className}.ts',
        filePath: 'src/',
        content: 'export class ${className} {}',
        language: 'typescript',
      };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue({
        id: 1,
        name: 'test-group',
        tenantId: '000000',
      });
      mockPrismaService.genTemplate.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.createTemplate(dto as any, 'admin');

      expect(result.code).toBe(200);
      expect(result.msg).toBe('创建成功');
    });

    it('应该在模板组不存在时返回错误', async () => {
      const dto = { groupId: 999, name: 'test-template', content: 'content' };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(null);

      const result = await service.createTemplate(dto as any, 'admin');

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });

    it('应该在模板语法错误时返回错误', async () => {
      const dto = {
        groupId: 1,
        name: 'test-template',
        content: '${unclosed',
      };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue({
        id: 1,
        tenantId: '000000',
      });

      const result = await service.createTemplate(dto as any, 'admin');

      expect(result.code).toBe(ResponseCode.PARAM_INVALID);
    });
  });

  describe('updateTemplate - 更新模板', () => {
    it('应该成功更新模板', async () => {
      const id = 1;
      const dto = { name: 'updated-template', content: 'updated ${className}' };

      mockPrismaService.genTemplate.findFirst.mockResolvedValue({
        id: 1,
        name: 'old-template',
        group: { tenantId: '000000' },
      });
      mockPrismaService.genTemplate.update.mockResolvedValue({ id, ...dto });

      const result = await service.updateTemplate(id, dto as any, 'admin');

      expect(result.code).toBe(200);
      expect(result.msg).toBe('更新成功');
    });

    it('应该在模板不存在时返回错误', async () => {
      const id = 999;
      const dto = { name: 'updated-template' };

      mockPrismaService.genTemplate.findFirst.mockResolvedValue(null);

      const result = await service.updateTemplate(id, dto as any, 'admin');

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });
  });

  describe('deleteTemplate - 删除模板', () => {
    it('应该成功软删除模板', async () => {
      const id = 1;

      mockPrismaService.genTemplate.findFirst.mockResolvedValue({
        id: 1,
        name: 'test-template',
        group: { tenantId: '000000' },
      });
      mockPrismaService.genTemplate.update.mockResolvedValue({ id, delFlag: '2' });

      const result = await service.deleteTemplate(id, 'admin');

      expect(result.code).toBe(200);
      expect(result.msg).toBe('删除成功');
    });

    it('应该在系统级模板时返回错误', async () => {
      const id = 1;

      mockPrismaService.genTemplate.findFirst.mockResolvedValue({
        id: 1,
        name: 'system-template',
        group: { tenantId: null },
      });

      const result = await service.deleteTemplate(id, 'admin');

      expect(result.code).toBe(ResponseCode.PERMISSION_DENIED);
    });
  });

  // ==================== 模板渲染测试 ====================

  describe('render - 渲染模板', () => {
    it('应该正确替换变量', () => {
      const template = 'export class ${className}Controller {}';
      const context = { className: 'User' };

      const result = service.render(template, context);

      expect(result).toBe('export class UserController {}');
    });

    it('应该处理多个变量', () => {
      const template = '// ${author}\nexport class ${className} extends ${baseClass} {}';
      const context = { author: 'admin', className: 'User', baseClass: 'BaseEntity' };

      const result = service.render(template, context);

      expect(result).toBe('// admin\nexport class User extends BaseEntity {}');
    });

    it('应该保留未定义的变量', () => {
      const template = 'export class ${className} { ${undefinedVar} }';
      const context = { className: 'User' };

      const result = service.render(template, context);

      expect(result).toBe('export class User { ${undefinedVar} }');
    });

    it('应该处理数组类型的值', () => {
      const template = 'columns: ${columns}';
      const context = { columns: ['id', 'name', 'email'] };

      const result = service.render(template, context);

      expect(result).toBe('columns: ["id","name","email"]');
    });

    it('应该处理对象类型的值', () => {
      const template = 'platform/config: ${platform/config}';
      const context = { platform/config: { key: 'value' } };

      const result = service.render(template, context);

      expect(result).toBe('platform/config: {"key":"value"}');
    });
  });

  describe('renderFileName - 渲染文件名', () => {
    it('应该正确渲染文件名', () => {
      const fileNameTemplate = '${className}.controller.ts';
      const context = { className: 'User' };

      const result = service.renderFileName(fileNameTemplate, context);

      expect(result).toBe('User.controller.ts');
    });
  });

  describe('renderFilePath - 渲染文件路径', () => {
    it('应该正确渲染文件路径', () => {
      const filePathTemplate = 'src/${moduleName}/controller/';
      const context = { moduleName: 'system' };

      const result = service.renderFilePath(filePathTemplate, context);

      expect(result).toBe('src/system/controller/');
    });
  });

  describe('hasUnresolvedVariables - 检查未替换的变量', () => {
    it('应该检测到未替换的变量', () => {
      const content = 'export class ${className} {}';

      const result = service.hasUnresolvedVariables(content);

      expect(result).toBe(true);
    });

    it('应该在没有变量时返回 false', () => {
      const content = 'export class UserController {}';

      const result = service.hasUnresolvedVariables(content);

      expect(result).toBe(false);
    });
  });

  describe('extractVariables - 提取模板变量', () => {
    it('应该提取所有变量', () => {
      const template = 'export class ${className}Controller { ${methodName}() {} }';

      const result = service.extractVariables(template);

      expect(result).toContain('className');
      expect(result).toContain('methodName');
      expect(result).toHaveLength(2);
    });

    it('应该去重重复的变量', () => {
      const template = '${className} ${className} ${className}';

      const result = service.extractVariables(template);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('className');
    });
  });

  // ==================== 模板验证测试 ====================

  describe('validateTemplate - 验证模板语法', () => {
    it('应该验证有效的模板', () => {
      const dto = { content: 'export class ${className} {}' };

      const result = service.validateTemplate(dto as any);

      expect(result.data.valid).toBe(true);
      expect(result.data.variables).toContain('className');
    });

    it('应该检测未闭合的变量表达式', () => {
      const dto = { content: 'export class ${unclosed' };

      const result = service.validateTemplate(dto as any);

      expect(result.data.valid).toBe(false);
      expect(result.data.message).toContain('未闭合');
    });

    it('应该警告未知变量', () => {
      const dto = { content: '${unknownVariable}' };

      const result = service.validateTemplate(dto as any);

      expect(result.data.valid).toBe(true);
      expect(result.data.warnings).toHaveLength(1);
      expect(result.data.warnings[0]).toContain('未知变量');
    });
  });

  // ==================== 模板导入导出测试 ====================

  describe('exportGroup - 导出模板组', () => {
    it('应该成功导出模板组', async () => {
      const id = 1;
      const mockGroup = {
        id: 1,
        name: 'test-group',
        description: '测试模板组',
        templates: [
          { name: 'template1', fileName: 'test.ts', filePath: 'src/', content: 'content', language: 'typescript', sort: 0 },
        ],
      };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(mockGroup);

      const result = await service.exportGroup(id);

      expect(result.code).toBe(200);
      expect(result.data?.name).toBe('test-group');
      expect(result.data?.templates).toHaveLength(1);
      expect(result.data?.exportTime).toBeDefined();
    });

    it('应该在模板组不存在时返回错误', async () => {
      const id = 999;

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(null);

      const result = await service.exportGroup(id);

      expect(result.code).toBe(ResponseCode.DATA_NOT_FOUND);
    });
  });

  describe('importGroup - 导入模板组', () => {
    it('应该成功导入模板组', async () => {
      const dto = {
        name: 'imported-group',
        description: '导入的模板组',
        templates: [
          { name: 'template1', fileName: 'test.ts', filePath: 'src/', content: '${className}', language: 'typescript' },
        ],
      };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          genTemplateGroup: {
            create: jest.fn().mockResolvedValue({ id: 1, ...dto }),
          },
          genTemplate: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx);
      });

      const result = await service.importGroup(dto as any, 'admin');

      expect(result.code).toBe(200);
      expect(result.msg).toBe('导入成功');
    });

    it('应该在名称重复时返回错误', async () => {
      const dto = { name: 'existing-group', templates: [] };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue({ id: 1, name: 'existing-group' });

      const result = await service.importGroup(dto as any, 'admin');

      expect(result.code).toBe(ResponseCode.DATA_ALREADY_EXISTS);
    });

    it('应该在模板语法错误时返回错误', async () => {
      const dto = {
        name: 'imported-group',
        templates: [
          { name: 'bad-template', content: '${unclosed' },
        ],
      };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(null);

      const result = await service.importGroup(dto as any, 'admin');

      expect(result.code).toBe(ResponseCode.PARAM_INVALID);
    });
  });

  describe('exportGroupAsJson - 导出为 JSON 字符串', () => {
    it('应该返回 JSON 字符串', async () => {
      const id = 1;
      const mockGroup = {
        id: 1,
        name: 'test-group',
        templates: [],
      };

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(mockGroup);

      const result = await service.exportGroupAsJson(id);

      expect(result.code).toBe(200);
      expect(typeof result.data).toBe('string');
      expect(() => JSON.parse(result.data!)).not.toThrow();
    });
  });

  describe('importGroupFromJson - 从 JSON 字符串导入', () => {
    it('应该成功从 JSON 导入', async () => {
      const jsonString = JSON.stringify({
        name: 'imported-group',
        templates: [{ name: 'template1', fileName: 'test.ts', filePath: 'src/', content: 'content', language: 'typescript' }],
      });

      mockPrismaService.genTemplateGroup.findFirst.mockResolvedValue(null);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          genTemplateGroup: {
            create: jest.fn().mockResolvedValue({ id: 1, name: 'imported-group' }),
          },
          genTemplate: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
          },
        };
        return callback(tx);
      });

      const result = await service.importGroupFromJson(jsonString, 'admin');

      expect(result.code).toBe(200);
    });

    it('应该在 JSON 格式无效时返回错误', async () => {
      const invalidJson = 'not valid json';

      const result = await service.importGroupFromJson(invalidJson, 'admin');

      expect(result.code).toBe(ResponseCode.PARAM_INVALID);
    });

    it('应该在缺少必要字段时返回错误', async () => {
      const incompleteJson = JSON.stringify({ description: 'no name or templates' });

      const result = await service.importGroupFromJson(incompleteJson, 'admin');

      expect(result.code).toBe(ResponseCode.PARAM_INVALID);
    });
  });
});
