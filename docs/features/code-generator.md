# 代码生成器使用指南

## 概述

代码生成器是一个基于数据库表结构自动生成前后端代码的工具，参考 RuoYi 代码生成器设计，支持 NestJS + Vue3 + Naive UI 技术栈。

## 功能特性

### 核心功能

- **数据库表管理**：查询数据库表列表，导入表到代码生成配置
- **代码生成配置**：配置表信息、字段信息、生成选项
- **代码预览**：预览生成的所有代码文件
- **代码生成**：生成代码并下载 ZIP 或写入指定路径
- **同步表结构**：检测数据库表结构变化并同步

### 支持的模板类型

| 模板类型 | 说明 | 适用场景 |
|---------|------|---------|
| crud | 单表操作 | 简单的增删改查 |
| tree | 树表操作 | 具有层级关系的数据 |
| sub | 主子表操作 | 一对多关联关系 |

### 企业级功能

- **数据权限**：自动集成 @DataScope 装饰器
- **Excel 导入导出**：自动生成导入导出功能
- **多租户支持**：自动注入租户 ID
- **审计日志**：自动记录操作日志
- **高级查询**：可展开搜索面板
- **表格增强**：列配置、行内编辑、批量编辑
- **单元测试**：自动生成测试用例

## 使用步骤

### 1. 导入表

1. 进入「系统工具 > 代码生成」页面
2. 点击「导入」按钮
3. 选择要导入的数据库表
4. 点击确认导入

### 2. 配置生成选项

1. 在表列表中点击「编辑」按钮
2. 配置基本信息：
   - 表名称、表描述
   - 实体类名称
   - 作者
3. 配置字段信息：
   - 字段描述
   - TypeScript 类型
   - 是否插入/编辑/列表/查询
   - 查询方式
   - 显示类型
   - 字典类型
4. 配置生成信息：
   - 生成模板（crud/tree/sub）
   - 生成包路径
   - 模块名、业务名、功能名
   - 上级菜单
   - 生成方式（ZIP/自定义路径）
5. 配置企业级功能（可选）：
   - 数据权限
   - 导入导出
   - 多租户
   - 审计日志
   - 高级查询
   - 表格增强
   - 单元测试

### 3. 预览代码

1. 点击「预览」按钮
2. 查看生成的代码文件
3. 支持复制代码

### 4. 生成代码

1. 点击「生成代码」按钮
2. 下载 ZIP 压缩包或生成到指定路径
3. 将生成的代码复制到项目中

## 生成的文件结构

### 后端代码

```
nestjs/{BusinessName}/
├── {businessName}.module.ts      # NestJS 模块
├── {businessName}.controller.ts  # 控制器
├── {businessName}.service.ts     # 服务
├── dto/
│   └── {businessName}.dto.ts     # DTO
├── entities/
│   └── {businessName}.entity.ts  # 实体
└── test/                         # 测试（可选）
    ├── {businessName}.service.spec.ts
    ├── {businessName}.controller.spec.ts
    ├── {businessName}.e2e-spec.ts
    └── factory.ts
```

### 前端代码

```
vue/{BusinessName}/{businessName}/
├── index.vue                     # 主页面
├── modules/
│   ├── search.vue               # 搜索组件
│   ├── drawer.vue               # 编辑抽屉
│   ├── advanced-search.vue      # 高级搜索（可选）
│   ├── column-setting.vue       # 列配置（可选）
│   ├── inline-edit.vue          # 行内编辑（可选）
│   ├── batch-edit.vue           # 批量编辑（可选）
│   └── import-modal.vue         # 导入弹窗（可选）
├── api/
│   └── {businessName}.ts        # API 服务
└── types/
    └── {businessName}.d.ts      # 类型定义
```

### SQL 文件

```
sql/
└── {businessName}_menu.sql      # 菜单 SQL
```

## 模板变量参考

### 表信息

| 变量名 | 类型 | 说明 |
|-------|------|------|
| tableName | string | 表名称 |
| tableComment | string | 表描述 |
| className | string | 实体类名称（PascalCase） |
| classNameLower | string | 实体类名称（camelCase） |

### 模块信息

| 变量名 | 类型 | 说明 |
|-------|------|------|
| moduleName | string | 模块名称 |
| businessName | string | 业务名称 |
| BusinessName | string | 业务名称（首字母大写） |
| functionName | string | 功能名称 |
| functionAuthor | string | 作者名称 |

### 字段信息

| 变量名 | 类型 | 说明 |
|-------|------|------|
| columns | GenTableColumn[] | 所有字段列表 |
| pkColumn | GenTableColumn | 主键字段 |
| primaryKey | string | 主键字段名 |
| listColumns | GenTableColumn[] | 列表显示字段 |
| formColumns | GenTableColumn[] | 表单字段 |
| queryColumns | GenTableColumn[] | 查询字段 |

### 企业级功能

| 变量名 | 类型 | 说明 |
|-------|------|------|
| options.enableDataScope | boolean | 是否启用数据权限 |
| options.enableExport | boolean | 是否启用导出 |
| options.enableImport | boolean | 是否启用导入 |
| options.enableTenant | boolean | 是否启用多租户 |
| options.enableOperlog | boolean | 是否启用操作日志 |
| options.enableUnitTest | boolean | 是否生成单元测试 |

## 辅助函数

| 函数名 | 说明 |
|-------|------|
| capitalize(str) | 首字母大写 |
| camelCase(str) | 转换为驼峰命名 |
| kebabCase(str) | 转换为短横线命名 |
| snakeCase(str) | 转换为下划线命名 |
| getTsType(column) | 获取字段的 TypeScript 类型 |
| getFormComponent(column) | 获取字段对应的表单组件 |

## 注意事项

1. 生成代码前请确保数据库表结构已创建
2. 生成的代码需要根据实际业务需求进行调整
3. 主子表模式需要配置关联子表名和外键名
4. 树表模式需要配置树编码、父编码、名称字段
5. 企业级功能需要项目已集成相应的基础设施
