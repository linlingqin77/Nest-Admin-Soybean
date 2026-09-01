import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/platform/prisma';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions/business.exception';
import { TenantContext } from 'src/core/tenancy/context/tenant.context';
import { DelFlagEnum, StatusEnum } from 'src/shared/enums';
import { Prisma, GenTemplateGroup, GenTemplate } from '@prisma/client';
import {
  CreateTemplateGroupDto,
  UpdateTemplateGroupDto,
  ListTemplateGroupRequestDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  ListTemplateRequestDto,
  ValidateTemplateDto,
  ImportTemplateGroupDto,
  ExportTemplateGroupDto,
  TemplateLanguage,
  TemplateContextDto,
} from './dto';

/**
 * 模板变量正则表达式
 * 匹配 ${variableName} 格式的变量
 */
const TEMPLATE_VARIABLE_REGEX = /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

/**
 * 支持的模板变量列表
 */
const SUPPORTED_VARIABLES = [
  'tableName',
  'className',
  'businessName',
  'moduleName',
  'functionName',
  'author',
  'datetime',
  'tenantAware',
  'primaryKey',
  'columns',
  'pkColumn',
  'pkJavaField',
  'pkJavaType',
  'packageName',
  'tableComment',
];

/**
 * 模板管理服务
 *
 * @description 提供模板组和模板的 CRUD 操作、模板渲染、语法验证、导入导出等功能
 * Requirements: 6.2, 6.4, 6.5, 6.6
 */
@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== 模板组管理 ====================

  /**
   * 创建模板组
   * Requirements: 6.2
   */
  async createGroup(dto: CreateTemplateGroupDto, username: string): Promise<Result<GenTemplateGroup>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    // 检查名称是否已存在
    const existing = await this.prisma.genTemplateGroup.findFirst({
      where: {
        OR: [
          { tenantId, name: dto.name },
          { tenantId: null, name: dto.name },
        ],
        delFlag: '0',
      },
    });

    BusinessException.throwIf(!!existing, '模板组名称已存在', ResponseCode.DATA_ALREADY_EXISTS);

    try {
      // 如果设置为默认，先取消其他默认模板组
      if (dto.isDefault) {
        await this.prisma.genTemplateGroup.updateMany({
          where: {
            OR: [{ tenantId }, { tenantId: null }],
            isDefault: true,
            delFlag: '0',
          },
          data: { isDefault: false },
        });
      }

      const group = await this.prisma.genTemplateGroup.create({
        data: {
          tenantId,
          name: dto.name,
          description: dto.description,
          isDefault: dto.isDefault ?? false,
          status: StatusEnum.NORMAL,
          delFlag: '0',
          createBy: username,
          updateBy: username,
        },
      });

      this.logger.log(`模板组创建成功: ${group.name} (ID: ${group.id})`);
      return Result.ok(group, '创建成功');
    } catch (error) {
      this.logger.error(`模板组创建失败: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : String(error));
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '创建模板组失败');
    }
  }

  /**
   * 更新模板组
   * Requirements: 6.2
   */
  async updateGroup(id: number, dto: UpdateTemplateGroupDto, username: string): Promise<Result<GenTemplateGroup>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    // 检查模板组是否存在
    const existing = await this.prisma.genTemplateGroup.findFirst({
      where: {
        id,
        OR: [{ tenantId }, { tenantId: null }],
        delFlag: '0',
      },
    });

    if (!existing) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '模板组不存在');
    }

    // 系统级模板组（tenantId 为 null）不允许租户修改
    if (existing.tenantId === null && tenantId !== TenantContext.SUPER_TENANT_ID) {
      throw new BusinessException(ResponseCode.PERMISSION_DENIED, '无权修改系统级模板组');
    }

    // 如果更新名称，检查名称是否已被其他模板组使用
    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.prisma.genTemplateGroup.findFirst({
        where: {
          OR: [{ tenantId }, { tenantId: null }],
          name: dto.name,
          id: { not: id },
          delFlag: '0',
        },
      });

      if (nameExists) {
        throw new BusinessException(ResponseCode.DATA_ALREADY_EXISTS, '模板组名称已存在');
      }
    }

    try {
      // 如果设置为默认，先取消其他默认模板组
      if (dto.isDefault) {
        await this.prisma.genTemplateGroup.updateMany({
          where: {
            OR: [{ tenantId }, { tenantId: null }],
            isDefault: true,
            id: { not: id },
            delFlag: '0',
          },
          data: { isDefault: false },
        });
      }

      const group = await this.prisma.genTemplateGroup.update({
        where: { id },
        data: {
          ...dto,
          updateBy: username,
          updateTime: new Date(),
        },
      });

      this.logger.log(`模板组更新成功: ${group.name} (ID: ${group.id})`);
      return Result.ok(group, '更新成功');
    } catch (error) {
      this.logger.error(`模板组更新失败: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : String(error));
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '更新模板组失败');
    }
  }

  /**
   * 删除模板组（软删除）
   * Requirements: 6.2
   */
  async deleteGroup(id: number, username: string): Promise<Result<void>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const existing = await this.prisma.genTemplateGroup.findFirst({
      where: {
        id,
        OR: [{ tenantId }, { tenantId: null }],
        delFlag: '0',
      },
    });

    if (!existing) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '模板组不存在');
    }

    // 系统级模板组不允许删除
    if (existing.tenantId === null) {
      throw new BusinessException(ResponseCode.PERMISSION_DENIED, '系统级模板组不允许删除');
    }

    // 检查是否有关联的表配置
    const relatedTables = await this.prisma.genTable.count({
      where: {
        templateGroupId: id,
        delFlag: '0',
      },
    });

    if (relatedTables > 0) {
      throw new BusinessException(ResponseCode.DATA_IN_USE, '该模板组已被使用，无法删除');
    }

    try {
      // 软删除模板组及其模板
      await this.prisma.$transaction([
        this.prisma.genTemplate.updateMany({
          where: { groupId: id },
          data: {
            delFlag: '1',
            updateBy: username,
            updateTime: new Date(),
          },
        }),
        this.prisma.genTemplateGroup.update({
          where: { id },
          data: {
            delFlag: '1',
            updateBy: username,
            updateTime: new Date(),
          },
        }),
      ]);

      this.logger.log(`模板组删除成功: ${existing.name} (ID: ${id})`);
      return Result.ok(null, '删除成功');
    } catch (error) {
      this.logger.error(`模板组删除失败: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : String(error));
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '删除模板组失败');
    }
  }

  /**
   * 查询模板组列表
   * Requirements: 6.2
   */
  async findAllGroups(query: ListTemplateGroupRequestDto): Promise<Result> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const where: Prisma.GenTemplateGroupWhereInput = {
      delFlag: '0',
    };

    // 租户隔离：查询当前租户的模板组和系统级模板组
    if (query.systemOnly) {
      where.tenantId = null;
    } else {
      where.OR = [{ tenantId }, { tenantId: null }];
    }

    if (query.name) {
      where.name = { contains: query.name };
    }

    if (query.status) {
      where.status = query.status;
    }

    const [rows, total] = await Promise.all([
      this.prisma.genTemplateGroup.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.getOrderBy('createTime'),
        include: {
          templates: {
            where: { delFlag: '0' },
            orderBy: { sort: 'asc' },
          },
        },
      }),
      this.prisma.genTemplateGroup.count({ where }),
    ]);

    return Result.page(rows, total, query.pageNum, query.pageSize);
  }

  /**
   * 查询单个模板组
   * Requirements: 6.2
   */
  async findOneGroup(id: number): Promise<Result<GenTemplateGroup & { templates: GenTemplate[] }>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const group = await this.prisma.genTemplateGroup.findFirst({
      where: {
        id,
        OR: [{ tenantId }, { tenantId: null }],
        delFlag: '0',
      },
      include: {
        templates: {
          where: { delFlag: '0' },
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!group) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '模板组不存在');
    }

    return Result.ok(group);
  }

  /**
   * 获取默认模板组
   * Requirements: 6.2
   */
  async getDefaultGroup(): Promise<Result<GenTemplateGroup & { templates: GenTemplate[] }>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const group = await this.prisma.genTemplateGroup.findFirst({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
        isDefault: true,
        status: StatusEnum.NORMAL,
        delFlag: '0',
      },
      include: {
        templates: {
          where: {
            status: StatusEnum.NORMAL,
            delFlag: '0',
          },
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!group) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '未找到默认模板组');
    }

    return Result.ok(group);
  }

  // ==================== 模板管理 ====================

  /**
   * 创建模板
   * Requirements: 6.2
   */
  async createTemplate(dto: CreateTemplateDto, username: string): Promise<Result<GenTemplate>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    // 检查模板组是否存在
    const group = await this.prisma.genTemplateGroup.findFirst({
      where: {
        id: dto.groupId,
        OR: [{ tenantId }, { tenantId: null }],
        delFlag: '0',
      },
    });

    if (!group) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '模板组不存在');
    }

    // 系统级模板组不允许租户添加模板
    if (group.tenantId === null && tenantId !== TenantContext.SUPER_TENANT_ID) {
      throw new BusinessException(ResponseCode.PERMISSION_DENIED, '无权向系统级模板组添加模板');
    }

    // 验证模板语法
    const validateResult = this.validateTemplateSyntax(dto.content);
    if (!validateResult.valid) {
      throw new BusinessException(ResponseCode.PARAM_INVALID, validateResult.message);
    }

    try {
      const template = await this.prisma.genTemplate.create({
        data: {
          groupId: dto.groupId,
          name: dto.name,
          fileName: dto.fileName,
          filePath: dto.filePath,
          content: dto.content,
          language: dto.language,
          sort: dto.sort ?? 0,
          status: StatusEnum.NORMAL,
          delFlag: '0',
          createBy: username,
          updateBy: username,
        },
      });

      this.logger.log(`模板创建成功: ${template.name} (ID: ${template.id})`);
      return Result.ok(template, '创建成功');
    } catch (error) {
      this.logger.error(`模板创建失败: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : String(error));
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '创建模板失败');
    }
  }

  /**
   * 更新模板
   * Requirements: 6.2
   */
  async updateTemplate(id: number, dto: UpdateTemplateDto, username: string): Promise<Result<GenTemplate>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    // 检查模板是否存在
    const existing = await this.prisma.genTemplate.findFirst({
      where: {
        id,
        delFlag: '0',
      },
      include: {
        group: true,
      },
    });

    if (!existing) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '模板不存在');
    }

    // 系统级模板组的模板不允许租户修改
    if (existing.group.tenantId === null && tenantId !== TenantContext.SUPER_TENANT_ID) {
      throw new BusinessException(ResponseCode.PERMISSION_DENIED, '无权修改系统级模板');
    }

    // 如果更新内容，验证模板语法
    if (dto.content) {
      const validateResult = this.validateTemplateSyntax(dto.content);
      if (!validateResult.valid) {
        throw new BusinessException(ResponseCode.PARAM_INVALID, validateResult.message);
      }
    }

    try {
      const template = await this.prisma.genTemplate.update({
        where: { id },
        data: {
          ...dto,
          updateBy: username,
          updateTime: new Date(),
        },
      });

      this.logger.log(`模板更新成功: ${template.name} (ID: ${template.id})`);
      return Result.ok(template, '更新成功');
    } catch (error) {
      this.logger.error(`模板更新失败: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : String(error));
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '更新模板失败');
    }
  }

  /**
   * 删除模板（软删除）
   * Requirements: 6.2
   */
  async deleteTemplate(id: number, username: string): Promise<Result<void>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const existing = await this.prisma.genTemplate.findFirst({
      where: {
        id,
        delFlag: '0',
      },
      include: {
        group: true,
      },
    });

    if (!existing) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '模板不存在');
    }

    // 系统级模板组的模板不允许删除
    if (existing.group.tenantId === null) {
      throw new BusinessException(ResponseCode.PERMISSION_DENIED, '系统级模板不允许删除');
    }

    try {
      await this.prisma.genTemplate.update({
        where: { id },
        data: {
          delFlag: '1',
          updateBy: username,
          updateTime: new Date(),
        },
      });

      this.logger.log(`模板删除成功: ${existing.name} (ID: ${id})`);
      return Result.ok(null, '删除成功');
    } catch (error) {
      this.logger.error(`模板删除失败: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : String(error));
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '删除模板失败');
    }
  }

  /**
   * 查询模板列表
   * Requirements: 6.2
   */
  async findAllTemplates(query: ListTemplateRequestDto): Promise<Result> {
    const where: Prisma.GenTemplateWhereInput = {
      delFlag: '0',
    };

    if (query.groupId) {
      where.groupId = query.groupId;
    }

    if (query.name) {
      where.name = { contains: query.name };
    }

    if (query.language) {
      where.language = query.language;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [rows, total] = await Promise.all([
      this.prisma.genTemplate.findMany({
        where,
        skip: query.skip,
        take: query.take,
        orderBy: query.getOrderBy('sort'),
      }),
      this.prisma.genTemplate.count({ where }),
    ]);

    return Result.page(rows, total, query.pageNum, query.pageSize);
  }

  /**
   * 查询单个模板
   * Requirements: 6.2
   */
  async findOneTemplate(id: number): Promise<Result<GenTemplate>> {
    const template = await this.prisma.genTemplate.findFirst({
      where: {
        id,
        delFlag: '0',
      },
    });

    if (!template) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '模板不存在');
    }

    return Result.ok(template);
  }

  // ==================== 模板渲染 ====================

  /**
   * 渲染模板
   * Requirements: 6.4
   *
   * @param templateContent 模板内容
   * @param context 渲染上下文
   * @returns 渲染后的内容
   */
  render(templateContent: string, context: TemplateContextDto | Record<string, any>): string {
    let result = templateContent;

    // 替换所有变量
    result = result.replace(TEMPLATE_VARIABLE_REGEX, (match, variableName) => {
      const value = (context as Record<string, unknown>)[variableName];

      if (value === undefined || value === null) {
        // 未定义的变量保持原样
        return match;
      }

      // 处理不同类型的值
      if (typeof value === 'object') {
        if (Array.isArray(value)) {
          // 数组类型，返回 JSON 字符串
          return JSON.stringify(value);
        }
        // 对象类型，返回 JSON 字符串
        return JSON.stringify(value);
      }

      return String(value);
    });

    return result;
  }

  /**
   * 渲染文件名
   * Requirements: 6.4
   */
  renderFileName(fileNameTemplate: string, context: TemplateContextDto | Record<string, any>): string {
    return this.render(fileNameTemplate, context);
  }

  /**
   * 渲染文件路径
   * Requirements: 6.4
   */
  renderFilePath(filePathTemplate: string, context: TemplateContextDto | Record<string, any>): string {
    return this.render(filePathTemplate, context);
  }

  /**
   * 检查渲染结果是否包含未替换的变量
   * Requirements: 6.4
   */
  hasUnresolvedVariables(content: string): boolean {
    return TEMPLATE_VARIABLE_REGEX.test(content);
  }

  /**
   * 获取模板中的所有变量
   * Requirements: 6.4
   */
  extractVariables(templateContent: string): string[] {
    const variables: string[] = [];
    let match: RegExpExecArray | null;

    // 重置正则表达式的 lastIndex
    const regex = new RegExp(TEMPLATE_VARIABLE_REGEX.source, 'g');

    while ((match = regex.exec(templateContent)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  // ==================== 模板语法验证 ====================

  /**
   * 验证模板语法
   * Requirements: 6.5
   */
  validateTemplate(dto: ValidateTemplateDto): Result<{ valid: boolean; variables: string[]; warnings: string[] }> {
    const result = this.validateTemplateSyntax(dto.content);
    return Result.ok(result);
  }

  /**
   * 验证模板语法（内部方法）
   * Requirements: 6.5
   */
  validateTemplateSyntax(content: string): {
    valid: boolean;
    message?: string;
    variables: string[];
    warnings: string[];
  } {
    const variables = this.extractVariables(content);
    const warnings: string[] = [];

    // 检查是否有未知变量
    const unknownVariables = variables.filter((v) => !SUPPORTED_VARIABLES.includes(v));
    if (unknownVariables.length > 0) {
      warnings.push(`发现未知变量: ${unknownVariables.join(', ')}。这些变量可能不会被替换。`);
    }

    // 检查是否有不完整的变量语法
    const incompletePattern = /\$\{[^}]*$/gm;
    if (incompletePattern.test(content)) {
      return {
        valid: false,
        message: '模板语法错误：存在未闭合的变量表达式',
        variables,
        warnings,
      };
    }

    // 检查是否有嵌套的变量（不支持）
    const nestedPattern = /\$\{[^}]*\$\{/g;
    if (nestedPattern.test(content)) {
      return {
        valid: false,
        message: '模板语法错误：不支持嵌套变量',
        variables,
        warnings,
      };
    }

    return {
      valid: true,
      variables,
      warnings,
    };
  }

  // ==================== 模板导入导出 ====================

  /**
   * 导出模板组
   * Requirements: 6.6
   */
  async exportGroup(id: number): Promise<Result<ExportTemplateGroupDto>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    const group = await this.prisma.genTemplateGroup.findFirst({
      where: {
        id,
        OR: [{ tenantId }, { tenantId: null }],
        delFlag: '0',
      },
      include: {
        templates: {
          where: { delFlag: '0' },
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!group) {
      throw new BusinessException(ResponseCode.DATA_NOT_FOUND, '模板组不存在');
    }

    const exportData: ExportTemplateGroupDto = {
      name: group.name,
      description: group.description || undefined,
      exportTime: new Date().toISOString(),
      version: '1.0.0',
      templates: group.templates.map((t) => ({
        name: t.name,
        fileName: t.fileName,
        filePath: t.filePath,
        content: t.content,
        language: t.language as TemplateLanguage,
        sort: t.sort,
      })),
    };

    return Result.ok(exportData);
  }

  /**
   * 导入模板组
   * Requirements: 6.6
   */
  async importGroup(dto: ImportTemplateGroupDto, username: string): Promise<Result<GenTemplateGroup>> {
    const tenantId = TenantContext.getTenantId() || TenantContext.SUPER_TENANT_ID;

    // 检查名称是否已存在
    const existing = await this.prisma.genTemplateGroup.findFirst({
      where: {
        OR: [
          { tenantId, name: dto.name },
          { tenantId: null, name: dto.name },
        ],
        delFlag: '0',
      },
    });

    if (existing) {
      throw new BusinessException(ResponseCode.DATA_ALREADY_EXISTS, '模板组名称已存在');
    }

    // 验证所有模板的语法
    for (const template of dto.templates) {
      const validateResult = this.validateTemplateSyntax(template.content);
      if (!validateResult.valid) {
        throw new BusinessException(ResponseCode.PARAM_INVALID, `模板 "${template.name}" 语法错误: ${validateResult.message}`);
      }
    }

    try {
      // 使用事务创建模板组和模板
      const group = await this.prisma.$transaction(async (tx) => {
        // 创建模板组
        const newGroup = await tx.genTemplateGroup.create({
          data: {
            tenantId,
            name: dto.name,
            description: dto.description,
            isDefault: false,
            status: StatusEnum.NORMAL,
            delFlag: '0',
            createBy: username,
            updateBy: username,
          },
        });

        // 创建模板
        await tx.genTemplate.createMany({
          data: dto.templates.map((t, index) => ({
            groupId: newGroup.id,
            name: t.name,
            fileName: t.fileName,
            filePath: t.filePath,
            content: t.content,
            language: t.language,
            sort: t.sort ?? index,
            status: StatusEnum.NORMAL,
            delFlag: '0',
            createBy: username,
            updateBy: username,
          })),
        });

        return newGroup;
      });

      this.logger.log(`模板组导入成功: ${group.name} (ID: ${group.id}), 包含 ${dto.templates.length} 个模板`);
      return Result.ok(group, '导入成功');
    } catch (error) {
      this.logger.error(`模板组导入失败: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : String(error));
      throw new BusinessException(ResponseCode.OPERATION_FAILED, '导入模板组失败');
    }
  }

  /**
   * 导出模板组为 JSON 字符串
   * Requirements: 6.6
   */
  async exportGroupAsJson(id: number): Promise<Result<string>> {
    const exportResult = await this.exportGroup(id);
    if (!exportResult.isSuccess()) {
      throw new BusinessException(exportResult.code, exportResult.msg);
    }

    return Result.ok(JSON.stringify(exportResult.data, null, 2));
  }

  /**
   * 从 JSON 字符串导入模板组
   * Requirements: 6.6
   */
  async importGroupFromJson(jsonString: string, username: string): Promise<Result<GenTemplateGroup>> {
    try {
      const dto = JSON.parse(jsonString) as ImportTemplateGroupDto;

      // 基本验证
      if (!dto.name || !dto.templates || !Array.isArray(dto.templates)) {
        throw new BusinessException(ResponseCode.PARAM_INVALID, 'JSON 格式无效：缺少必要字段');
      }

      return this.importGroup(dto, username);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BusinessException(ResponseCode.PARAM_INVALID, 'JSON 格式无效：解析失败');
      }
      throw error;
    }
  }
}
