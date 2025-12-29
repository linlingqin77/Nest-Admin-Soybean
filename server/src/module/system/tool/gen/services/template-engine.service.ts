import { Injectable, Logger } from '@nestjs/common';
import * as ejs from 'ejs';
import * as path from 'path';
import * as fs from 'fs-extra';
import { GenTable, GenTableColumn } from '@prisma/client';
import { TemplateContext, GenOptions, GeneratedFile, GenTableWithColumns } from '../interfaces';
import { capitalize, camelCase } from 'lodash';
import { GenConstants } from 'src/common/constant/gen.constant';

/**
 * 模板类型定义
 */
export interface TemplateDefinition {
  name: string;
  templatePath: string;
  outputPath: (ctx: TemplateContext) => string;
  fileType: 'backend' | 'frontend' | 'sql';
  condition?: (ctx: TemplateContext) => boolean;
}

/**
 * 模板引擎服务
 * 使用 EJS 模板引擎生成代码
 */
@Injectable()
export class TemplateEngineService {
  private readonly logger = new Logger(TemplateEngineService.name);
  private readonly templateDir: string;
  private templateCache: Map<string, ejs.TemplateFunction> = new Map();

  constructor() {
    this.templateDir = path.join(__dirname, '..', 'templates');
  }

  /**
   * 渲染单个模板
   * @param templatePath 模板路径（相对于 templates 目录）
   * @param context 模板上下文
   */
  async render(templatePath: string, context: TemplateContext): Promise<string> {
    try {
      const fullPath = path.join(this.templateDir, templatePath);
      
      // 检查缓存
      let templateFn = this.templateCache.get(fullPath);
      
      if (!templateFn) {
        // 检查模板文件是否存在
        if (!(await fs.pathExists(fullPath))) {
          throw new Error(`模板文件不存在: ${fullPath}`);
        }
        
        const templateContent = await fs.readFile(fullPath, 'utf-8');
        templateFn = ejs.compile(templateContent, {
          filename: fullPath,
          async: false,
        });
        this.templateCache.set(fullPath, templateFn);
      }

      // 添加辅助函数到上下文
      const enhancedContext = this.enhanceContext(context);
      
      return templateFn(enhancedContext);
    } catch (error) {
      this.logger.error(`渲染模板失败: ${templatePath}`, error);
      throw error;
    }
  }

  /**
   * 渲染所有模板
   * @param table 表信息
   * @param columns 列信息
   * @param options 生成选项
   */
  async renderAll(
    table: GenTable,
    columns: GenTableColumn[],
    options?: GenOptions,
  ): Promise<GeneratedFile[]> {
    const context = this.buildContext(table, columns, options);
    const templates = this.getTemplateDefinitions(context);
    const files: GeneratedFile[] = [];

    for (const template of templates) {
      // 检查条件
      if (template.condition && !template.condition(context)) {
        continue;
      }

      try {
        const content = await this.render(template.templatePath, context);
        files.push({
          fileName: path.basename(template.outputPath(context)),
          filePath: template.outputPath(context),
          content,
          fileType: template.fileType,
        });
      } catch (error) {
        this.logger.error(`渲染模板 ${template.name} 失败`, error);
        // 继续处理其他模板
      }
    }

    return files;
  }

  /**
   * 构建模板上下文
   */
  buildContext(
    table: GenTable,
    columns: GenTableColumn[],
    options?: GenOptions,
  ): TemplateContext {
    const pkColumn = columns.find(col => col.isPk === 'YES') || null;
    const genOptions = this.parseOptions(table.options, options);

    return {
      // 表信息
      table,
      tableName: table.tableName,
      tableComment: table.tableComment || table.tableName,
      className: table.className,
      classNameLower: camelCase(table.className),

      // 模块信息
      moduleName: table.moduleName,
      businessName: table.businessName,
      BusinessName: capitalize(table.businessName),
      functionName: table.functionName || table.tableComment || table.tableName,
      functionAuthor: table.functionAuthor || 'admin',

      // 路径信息
      packageName: table.packageName,
      apiPath: `/${table.moduleName}/${table.businessName}`,

      // 字段信息
      columns,
      pkColumn,
      primaryKey: pkColumn?.javaField || null,
      listColumns: columns.filter(col => col.isList === 'YES'),
      formColumns: columns.filter(col => col.isInsert === 'YES' || col.isEdit === 'YES'),
      queryColumns: columns.filter(col => col.isQuery === 'YES'),
      insertColumns: columns.filter(col => col.isInsert === 'YES'),
      editColumns: columns.filter(col => col.isEdit === 'YES'),

      // 辅助信息
      datetime: new Date().toISOString().split('T')[0],
      hasDict: columns.some(col => col.dictType && col.dictType.length > 0),
      dictTypes: [...new Set(columns.filter(col => col.dictType).map(col => col.dictType!))],

      // 企业级功能配置
      options: genOptions,
    };
  }


  /**
   * 构建主子表上下文
   */
  buildSubTableContext(
    table: GenTable,
    columns: GenTableColumn[],
    subTable: GenTableWithColumns,
    options?: GenOptions,
  ): TemplateContext {
    const context = this.buildContext(table, columns, options);
    
    // 添加子表信息
    context.subTable = subTable;
    
    // 查找子表外键列
    if (table.subTableFkName) {
      context.subTableFkColumn = subTable.columns.find(
        col => col.columnName === table.subTableFkName
      );
    }

    return context;
  }

  /**
   * 解析配置选项
   */
  private parseOptions(tableOptions: string | null, additionalOptions?: GenOptions): GenOptions {
    let options: GenOptions = {};
    
    if (tableOptions) {
      try {
        options = JSON.parse(tableOptions);
      } catch {
        this.logger.warn('解析表配置选项失败');
      }
    }

    return { ...options, ...additionalOptions };
  }

  /**
   * 增强上下文，添加辅助函数
   */
  private enhanceContext(context: TemplateContext): TemplateContext & Record<string, any> {
    return {
      ...context,
      // 字符串处理函数
      capitalize,
      camelCase,
      upperFirst: capitalize,
      lowerFirst: (str: string) => str.charAt(0).toLowerCase() + str.slice(1),
      kebabCase: (str: string) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
      snakeCase: (str: string) => str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase(),
      
      // 类型映射函数
      getTsType: this.getTsType.bind(this),
      getFormComponent: this.getFormComponent.bind(this),
      getQueryOperator: this.getQueryOperator.bind(this),
      
      // 判断函数
      isStringType: (col: GenTableColumn) => col.javaType === GenConstants.TYPE_STRING,
      isNumberType: (col: GenTableColumn) => col.javaType === GenConstants.TYPE_NUMBER,
      isDateType: (col: GenTableColumn) => col.javaType === GenConstants.TYPE_DATE,
      isBooleanType: (col: GenTableColumn) => col.javaType === 'Boolean',
      
      // 常量
      GenConstants,
    };
  }

  /**
   * 获取 TypeScript 类型
   */
  private getTsType(column: GenTableColumn): string {
    switch (column.javaType) {
      case GenConstants.TYPE_NUMBER:
        return 'number';
      case GenConstants.TYPE_DATE:
        return 'string';
      case 'Boolean':
        return 'boolean';
      default:
        return 'string';
    }
  }

  /**
   * 获取表单组件类型
   */
  private getFormComponent(column: GenTableColumn): string {
    const htmlType = column.htmlType;
    
    switch (htmlType) {
      case GenConstants.HTML_INPUT:
        return 'NInput';
      case GenConstants.HTML_TEXTAREA:
        return 'NInput type="textarea"';
      case GenConstants.HTML_SELECT:
        return 'NSelect';
      case GenConstants.HTML_RADIO:
        return 'NRadioGroup';
      case GenConstants.HTML_CHECKBOX:
        return 'NCheckboxGroup';
      case GenConstants.HTML_DATETIME:
        return 'NDatePicker type="datetime"';
      case GenConstants.HTML_DATE:
        return 'NDatePicker type="date"';
      case GenConstants.HTML_IMAGE_UPLOAD:
        return 'ImageUpload';
      case GenConstants.HTML_FILE_UPLOAD:
        return 'FileUpload';
      case GenConstants.HTML_EDITOR:
        return 'Editor';
      case GenConstants.HTML_NUMBER:
        return 'NInputNumber';
      case GenConstants.HTML_SWITCH:
        return 'NSwitch';
      default:
        return 'NInput';
    }
  }

  /**
   * 获取查询操作符
   */
  private getQueryOperator(column: GenTableColumn): string {
    switch (column.queryType) {
      case GenConstants.QUERY_EQ:
        return 'equals';
      case GenConstants.QUERY_NE:
        return 'not';
      case GenConstants.QUERY_GT:
        return 'gt';
      case GenConstants.QUERY_GTE:
        return 'gte';
      case GenConstants.QUERY_LT:
        return 'lt';
      case GenConstants.QUERY_LTE:
        return 'lte';
      case GenConstants.QUERY_LIKE:
        return 'contains';
      case GenConstants.QUERY_BETWEEN:
        return 'between';
      default:
        return 'equals';
    }
  }

  /**
   * 获取模板定义列表
   */
  private getTemplateDefinitions(context: TemplateContext): TemplateDefinition[] {
    const { tplCategory } = context.table;
    const templates: TemplateDefinition[] = [];

    // 基础 CRUD 模板
    templates.push(
      // 后端模板
      {
        name: 'module',
        templatePath: 'backend/module.ejs',
        outputPath: (ctx) => `nestjs/${ctx.BusinessName}/${ctx.businessName}.module.ts`,
        fileType: 'backend',
      },
      {
        name: 'controller',
        templatePath: 'backend/controller.ejs',
        outputPath: (ctx) => `nestjs/${ctx.BusinessName}/${ctx.businessName}.controller.ts`,
        fileType: 'backend',
      },
      {
        name: 'service',
        templatePath: 'backend/service.ejs',
        outputPath: (ctx) => `nestjs/${ctx.BusinessName}/${ctx.businessName}.service.ts`,
        fileType: 'backend',
      },
      {
        name: 'dto',
        templatePath: 'backend/dto.ejs',
        outputPath: (ctx) => `nestjs/${ctx.BusinessName}/dto/${ctx.businessName}.dto.ts`,
        fileType: 'backend',
      },
      {
        name: 'entity',
        templatePath: 'backend/entity.ejs',
        outputPath: (ctx) => `nestjs/${ctx.BusinessName}/entities/${ctx.businessName}.entity.ts`,
        fileType: 'backend',
      },
      // 前端模板
      {
        name: 'vue-index',
        templatePath: 'frontend/index.vue.ejs',
        outputPath: (ctx) => `vue/${ctx.BusinessName}/${ctx.businessName}/index.vue`,
        fileType: 'frontend',
      },
      {
        name: 'vue-drawer',
        templatePath: 'frontend/modules/drawer.vue.ejs',
        outputPath: (ctx) => `vue/${ctx.BusinessName}/${ctx.businessName}/modules/drawer.vue`,
        fileType: 'frontend',
      },
      {
        name: 'vue-search',
        templatePath: 'frontend/modules/search.vue.ejs',
        outputPath: (ctx) => `vue/${ctx.BusinessName}/${ctx.businessName}/modules/search.vue`,
        fileType: 'frontend',
      },
      {
        name: 'api',
        templatePath: 'frontend/api.ts.ejs',
        outputPath: (ctx) => `vue/${ctx.BusinessName}/api/${ctx.businessName}.ts`,
        fileType: 'frontend',
      },
      {
        name: 'types',
        templatePath: 'frontend/types.ts.ejs',
        outputPath: (ctx) => `vue/${ctx.BusinessName}/types/${ctx.businessName}.d.ts`,
        fileType: 'frontend',
      },
    );

    // 树表模板
    if (tplCategory === 'tree') {
      templates.push(
        {
          name: 'tree-service',
          templatePath: 'backend/tree/service.ejs',
          outputPath: (ctx) => `nestjs/${ctx.BusinessName}/${ctx.businessName}.service.ts`,
          fileType: 'backend',
        },
        {
          name: 'tree-vue-index',
          templatePath: 'frontend/tree/index.vue.ejs',
          outputPath: (ctx) => `vue/${ctx.BusinessName}/${ctx.businessName}/index.vue`,
          fileType: 'frontend',
        },
      );
    }

    // 主子表模板
    if (tplCategory === 'sub') {
      templates.push(
        {
          name: 'sub-service',
          templatePath: 'backend/sub/service.ejs',
          outputPath: (ctx) => `nestjs/${ctx.BusinessName}/${ctx.businessName}.service.ts`,
          fileType: 'backend',
        },
        {
          name: 'sub-vue-index',
          templatePath: 'frontend/sub/index.vue.ejs',
          outputPath: (ctx) => `vue/${ctx.BusinessName}/${ctx.businessName}/index.vue`,
          fileType: 'frontend',
        },
        {
          name: 'sub-table',
          templatePath: 'frontend/sub/sub-table.vue.ejs',
          outputPath: (ctx) => `vue/${ctx.BusinessName}/${ctx.businessName}/modules/sub-table.vue`,
          fileType: 'frontend',
        },
      );
    }

    // 菜单 SQL
    templates.push({
      name: 'menu-sql',
      templatePath: 'sql/menu.sql.ejs',
      outputPath: (ctx) => `sql/${ctx.businessName}_menu.sql`,
      fileType: 'sql',
    });

    // 企业级功能模板 - 高级搜索
    if (context.options.enableAdvancedSearch) {
      templates.push({
        name: 'advanced-search',
        templatePath: 'frontend/modules/advanced-search.vue.ejs',
        outputPath: (ctx) => `vue/${ctx.BusinessName}/${ctx.businessName}/modules/advanced-search.vue`,
        fileType: 'frontend',
      });
    }

    // 企业级功能模板 - 列配置
    if (context.options.enableColumnToggle) {
      templates.push({
        name: 'column-setting',
        templatePath: 'frontend/modules/column-setting.vue.ejs',
        outputPath: (ctx) => `vue/${ctx.BusinessName}/${ctx.businessName}/modules/column-setting.vue`,
        fileType: 'frontend',
      });
    }

    // 企业级功能模板 - 行内编辑
    if (context.options.enableInlineEdit) {
      templates.push({
        name: 'inline-edit',
        templatePath: 'frontend/modules/inline-edit.vue.ejs',
        outputPath: (ctx) => `vue/${ctx.BusinessName}/${ctx.businessName}/modules/inline-edit.vue`,
        fileType: 'frontend',
      });
    }

    // 企业级功能模板 - 批量编辑
    if (context.options.enableBatchEdit) {
      templates.push({
        name: 'batch-edit',
        templatePath: 'frontend/modules/batch-edit.vue.ejs',
        outputPath: (ctx) => `vue/${ctx.BusinessName}/${ctx.businessName}/modules/batch-edit.vue`,
        fileType: 'frontend',
      });
    }

    // 企业级功能模板 - 导入弹窗
    if (context.options.enableImport) {
      templates.push({
        name: 'import-modal',
        templatePath: 'frontend/modules/import-modal.vue.ejs',
        outputPath: (ctx) => `vue/${ctx.BusinessName}/${ctx.businessName}/modules/import-modal.vue`,
        fileType: 'frontend',
      });
    }

    // 企业级功能模板 - 单元测试
    if (context.options.enableUnitTest) {
      templates.push(
        {
          name: 'unit-test-service',
          templatePath: 'backend/test/service.spec.ejs',
          outputPath: (ctx) => `nestjs/${ctx.BusinessName}/test/${ctx.businessName}.service.spec.ts`,
          fileType: 'backend',
        },
        {
          name: 'unit-test-controller',
          templatePath: 'backend/test/controller.spec.ejs',
          outputPath: (ctx) => `nestjs/${ctx.BusinessName}/test/${ctx.businessName}.controller.spec.ts`,
          fileType: 'backend',
        },
        {
          name: 'test-factory',
          templatePath: 'backend/test/factory.ejs',
          outputPath: (ctx) => `nestjs/${ctx.BusinessName}/test/factory.ts`,
          fileType: 'backend',
        },
      );
    }

    // 企业级功能模板 - E2E 测试
    if (context.options.enableE2ETest) {
      templates.push({
        name: 'e2e-test',
        templatePath: 'backend/test/e2e.spec.ejs',
        outputPath: (ctx) => `nestjs/${ctx.BusinessName}/test/${ctx.businessName}.e2e-spec.ts`,
        fileType: 'backend',
      });
    }

    return templates;
  }

  /**
   * 清除模板缓存
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * 预编译所有模板
   */
  async precompileTemplates(): Promise<void> {
    const templateFiles = await this.getAllTemplateFiles();
    
    for (const file of templateFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const templateFn = ejs.compile(content, {
          filename: file,
          async: false,
        });
        this.templateCache.set(file, templateFn);
      } catch (error) {
        this.logger.warn(`预编译模板失败: ${file}`, error);
      }
    }
    
    this.logger.log(`预编译完成，共 ${this.templateCache.size} 个模板`);
  }

  /**
   * 获取所有模板文件
   */
  private async getAllTemplateFiles(): Promise<string[]> {
    const files: string[] = [];
    
    const walkDir = async (dir: string) => {
      if (!(await fs.pathExists(dir))) return;
      
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walkDir(fullPath);
        } else if (entry.name.endsWith('.ejs')) {
          files.push(fullPath);
        }
      }
    };

    await walkDir(this.templateDir);
    return files;
  }
}
