/**
 * 代码生成模板索引
 *
 * 导出所有代码生成模板和工具
 */

import { StaticLogger } from 'src/shared/utils';

// NestJS 模板
import { entityTem } from './nestjs/entity';
import { dtoTem } from './nestjs/dto';
import { controllerTem } from './nestjs/controller';
import { moduleTem } from './nestjs/module';
import { serviceTem } from './nestjs/service';

// Vue3 模板
import { apiTempalte, apiTemplate } from './vue/api.js';
import { indexVue } from './vue/indexVue.vue';
import { dialogVue } from './vue/dialogVue.vue';
import { searchVue } from './vue/searchVue.vue';

// SQL 模板
import { menuDeleteSqlTemplate, menuSqlTemplate } from './sql/menu.sql';
import { fullPermissionSqlTemplate, permissionDeleteSqlTemplate, permissionSqlTemplate } from './sql/permission.sql';

// 工具函数
export * from './utils';

// 模板映射
const templates = {
  // NestJS 模板
  'tool/template/nestjs/entity.ts.vm': entityTem,
  'tool/template/nestjs/dto.ts.vm': dtoTem,
  'tool/template/nestjs/controller.ts.vm': controllerTem,
  'tool/template/nestjs/service.ts.vm': serviceTem,
  'tool/template/nestjs/modules.ts.vm': moduleTem,
  // Vue3 模板
  'tool/template/vue/api.ts.vm': apiTemplate,
  'tool/template/vue/api.js.vm': apiTempalte, // 向后兼容
  'tool/template/vue/index.vue.vm': indexVue,
  'tool/template/vue/indexVue.vue.vm': indexVue, // 向后兼容
  'tool/template/vue/dialog.vue.vm': dialogVue,
  'tool/template/vue/dialogVue.vue.vm': dialogVue, // 向后兼容
  'tool/template/vue/search.vue.vm': searchVue,
  // SQL 模板
  'tool/template/sql/menu.sql.vm': menuSqlTemplate,
  'tool/template/sql/menu-delete.sql.vm': menuDeleteSqlTemplate,
  'tool/template/sql/permission.sql.vm': permissionSqlTemplate,
  'tool/template/sql/permission-delete.sql.vm': permissionDeleteSqlTemplate,
  'tool/template/sql/full-permission.sql.vm': fullPermissionSqlTemplate,
};

export interface TemplateOptions {
  /** 业务名称 (PascalCase) */
  BusinessName: string;
  /** 业务名称 (camelCase) */
  businessName: string;
  /** 模块名称 */
  moduleName: string;
  /** 功能名称 (中文) */
  functionName: string;
  /** 主键字段名 */
  primaryKey: string;
  /** 表注释 */
  tableComment?: string;
  /** 类名 */
  className?: string;
  /** 是否支持多租户 */
  tenantAware?: boolean;
  /** 列配置 */
  columns: Array<{
    javaField: string;
    javaType: string;
    columnComment: string;
    columnType: string;
    isPk: string;
    isInsert: string;
    isEdit: string;
    isList: string;
    isQuery: string;
    isRequired: string;
    queryType: string;
    htmlType: string;
    dictType?: string;
  }>;
  /** 父菜单ID (SQL模板) */
  parentMenuId?: number;
  /** 菜单图标 (SQL模板) */
  menuIcon?: string;
  /** 排序号 (SQL模板) */
  orderNum?: number;
  /** 租户ID (SQL模板) */
  tenantId?: string;
  /** 菜单ID (权限SQL模板) */
  menuId?: number;
  /** 角色ID列表 (权限SQL模板) */
  roleIds?: number[];
}

/**
 * 生成所有模板代码
 */
export const index = (options: TemplateOptions): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [path, templateFunc] of Object.entries(templates)) {
    try {
      result[path] = templateFunc(options as any);
    } catch (error) {
      StaticLogger.error(
        `Error generating template ${path}: ${error}`,
        error instanceof Error ? error.stack : undefined,
        'TemplateGenerator',
      );
      result[path] = `// Error generating template: ${error}`;
    }
  }
  return result;
};

/**
 * 获取指定模板的代码
 */
export const getTemplate = (templatePath: string, options: TemplateOptions): string => {
  const templateFunc = (templates as Record<string, (options: TemplateOptions) => string>)[templatePath];
  if (!templateFunc) {
    throw new Error(`Template not found: ${templatePath}`);
  }
  return templateFunc(options);
};

/**
 * 获取所有可用模板路径
 */
export const getTemplatePaths = (): string[] => {
  return Object.keys(templates);
};

// 导出单个模板函数
export {
  // NestJS
  entityTem,
  dtoTem,
  controllerTem,
  moduleTem,
  serviceTem,
  // Vue3
  apiTemplate,
  apiTempalte,
  indexVue,
  dialogVue,
  searchVue,
  // SQL
  menuSqlTemplate,
  menuDeleteSqlTemplate,
  permissionSqlTemplate,
  permissionDeleteSqlTemplate,
  fullPermissionSqlTemplate,
};

// Export template service, controller and DTOs
export * from './template.service';
export * from './template.controller';
export * from './dto';
