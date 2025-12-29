# Implementation Plan: 代码生成器 (Code Generator)

## Overview

本实现计划将代码生成器功能分为多个阶段，从核心基础设施开始，逐步实现数据库内省、模板引擎、代码生成、企业级功能，最后完成前端界面。每个任务都包含具体的实现步骤和对应的需求引用。

## Tasks

- [x] 1. 项目结构和核心接口设置
  - [x] 1.1 创建代码生成模块目录结构
    - 创建 `server/src/module/system/tool/gen/` 目录
    - 创建子目录：`services/`, `dto/`, `vo/`, `templates/`
    - 创建 `gen.module.ts`, `gen.controller.ts`, `gen.service.ts`
    - _Requirements: 3.1_

  - [x] 1.2 定义核心接口和类型
    - 创建 `interfaces/` 目录
    - 定义 `TableMetadata`, `ColumnMetadata`, `GeneratedFile` 接口
    - 定义 `GenTableConfig`, `GenColumnConfig` 类型
    - 定义企业级配置类型 `GenOptions`, `DataScopeType`
    - _Requirements: 2.1, 2.2, 10.4_

  - [x] 1.3 创建 DTO 文件
    - 创建 `ListGenTableDto`, `UpdateGenTableDto`
    - 创建 `ListDbTableDto` 用于数据库表查询
    - 添加 class-validator 装饰器
    - _Requirements: 2.5, 2.6_

- [x] 2. 数据库内省服务
  - [x] 2.1 实现 DatabaseIntrospector 服务
    - 创建 `database-introspector.service.ts`
    - 实现 `listTables()` 方法查询 PostgreSQL 表列表
    - 实现 `getTableInfo()` 方法获取表详细信息
    - 排除系统表（以 `_prisma_` 开头的表）
    - _Requirements: 1.1, 1.2_

  - [x] 2.2 实现列信息提取
    - 查询 `information_schema.columns` 获取列信息
    - 实现 PostgreSQL 类型到 TypeScript 类型的映射
    - 检测主键、自增、可空、默认值
    - _Requirements: 1.3, 1.5_

  - [x] 2.3 实现表结构同步功能
    - 实现 `syncTableStructure()` 方法
    - 比较数据库 schema 与 GenTableColumn 记录
    - 添加新列、标记删除列、更新类型变化
    - 保留自定义配置
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 2.4 编写数据库内省服务单元测试
    - 测试表列表查询
    - 测试类型映射正确性
    - 测试同步逻辑
    - _Requirements: 1.1, 1.3_

- [x] 3. 模板引擎服务
  - [x] 3.1 实现 TemplateEngine 服务
    - 创建 `template-engine.service.ts`
    - 集成 EJS 模板引擎
    - 实现 `render()` 和 `renderAll()` 方法
    - _Requirements: 9.1, 9.4_

  - [x] 3.2 创建后端代码模板
    - 创建 `templates/backend/module.ejs`
    - 创建 `templates/backend/controller.ejs`
    - 创建 `templates/backend/service.ejs`
    - 创建 `templates/backend/dto.ejs`
    - 创建 `templates/backend/entity.ejs`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.3 创建前端代码模板
    - 创建 `templates/frontend/index.vue.ejs` 主页面模板
    - 创建 `templates/frontend/modules/search.vue.ejs` 搜索组件模板
    - 创建 `templates/frontend/modules/drawer.vue.ejs` 编辑抽屉模板
    - 创建 `templates/frontend/api.ts.ejs` API 服务模板
    - 创建 `templates/frontend/types.ts.ejs` 类型定义模板
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 3.4 创建树表和主子表模板
    - 创建 `templates/backend/tree/service.ejs` 树表服务模板
    - 创建 `templates/backend/sub/service.ejs` 主子表服务模板
    - 创建 `templates/frontend/tree/index.vue.ejs` 树表前端模板
    - 创建 `templates/frontend/sub/index.vue.ejs` 主子表前端模板
    - 创建 `templates/frontend/sub/sub-table.vue.ejs` 子表组件模板
    - _Requirements: 2.2_

  - [x] 3.5 创建菜单 SQL 模板
    - 创建 `templates/sql/menu.sql.ejs`
    - 生成菜单插入 SQL
    - _Requirements: 6.5_

- [x] 4. 代码生成核心服务
  - [x] 4.1 实现 GenService 核心方法
    - 创建 `code-generator.service.ts`
    - 实现 `importTable()` 导入表方法
    - 实现 `findAll()` 查询已导入表列表
    - 实现 `findOne()` 获取表详情（含字段）
    - 实现 `update()` 更新配置
    - 实现 `remove()` 删除配置
    - _Requirements: 1.2, 2.6_

  - [x] 4.2 实现代码生成方法
    - 实现 `generate()` 生成代码方法
    - 实现 `preview()` 预览代码方法
    - 实现 `batchGenCode()` 批量生成方法
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 7.2_

  - [x] 4.3 实现 ZIP 打包功能
    - 集成 archiver 库
    - 实现 `batchGenCode()` 方法中的 ZIP 打包
    - 按表名组织目录结构
    - _Requirements: 6.1, 7.4_

  - [x] 4.4 实现文件写入功能
    - 实现 `genCodeToPath()` 方法
    - 检查目标文件是否存在
    - 维护正确的目录结构
    - _Requirements: 6.2, 6.3, 6.4_

  - [x] 4.5 编写代码生成服务单元测试
    - 测试导入表功能
    - 测试代码生成完整性
    - 测试 ZIP 打包
    - _Requirements: 3.1, 6.1_

- [x] 5. Checkpoint - 核心功能验证
  - 确保所有测试通过
  - 验证数据库内省功能
  - 验证模板渲染功能
  - 如有问题请询问用户

- [x] 6. 企业级功能 - 数据权限
  - [x] 6.1 创建数据权限模板扩展
    - 更新 Controller 模板添加 @DataScope 装饰器
    - 更新 Service 模板添加数据权限查询条件
    - 创建 DataScopeHelper 辅助类
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 6.2 实现数据权限配置
    - 在 GenOptions 中添加数据权限配置字段
    - 实现数据权限类型选择（ALL, DEPT, DEPT_AND_CHILD, SELF, CUSTOM）
    - 实现递归部门查询逻辑生成
    - _Requirements: 10.4, 10.5_

- [x] 7. 企业级功能 - Excel 导入导出
  - [x] 7.1 创建导出功能模板
    - 更新 Controller 模板添加导出端点
    - 创建 ExcelService 集成（使用 exceljs）
    - 实现字典值转换、日期格式化
    - _Requirements: 11.1, 11.6_

  - [x] 7.2 创建导入功能模板
    - 更新 Controller 模板添加导入端点
    - 实现文件上传处理
    - 实现数据校验和错误报告
    - 创建导入模板下载端点
    - _Requirements: 11.3, 11.7, 11.8_

  - [x] 7.3 创建前端导入导出组件模板
    - 更新前端页面模板添加导出按钮
    - 创建导入弹窗组件模板
    - 实现模板下载功能
    - _Requirements: 11.2, 11.4_

  - [x] 7.4 实现导入导出字段配置
    - 在 GenColumnConfig 中添加 isExport, isImport 字段
    - 实现导出字段格式化配置
    - 实现导入校验规则配置
    - _Requirements: 11.5_

- [x] 8. 企业级功能 - 多租户和审计日志
  - [x] 8.1 创建多租户模板扩展
    - 更新 Service 模板添加租户 ID 注入
    - 更新查询方法添加租户过滤
    - 实现租户上下文获取
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 8.2 创建审计日志模板扩展
    - 更新 Controller 模板添加 @Operlog 装饰器
    - 配置 BusinessType（INSERT, UPDATE, DELETE, EXPORT, IMPORT）
    - 实现操作日志标题配置
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 9. 企业级功能 - 高级查询和表格增强
  - [x] 9.1 创建高级搜索模板
    - 创建可展开搜索面板组件模板
    - 实现基础/高级字段分组
    - 实现日期范围选择器
    - _Requirements: 14.1, 14.4, 14.5_

  - [x] 9.2 创建表格增强模板
    - 实现列宽调整功能
    - 实现列显示/隐藏切换
    - 实现可排序列配置
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [x] 9.3 创建行内编辑和批量编辑模板
    - 实现行内编辑组件模板
    - 实现批量编辑功能模板
    - _Requirements: 15.5, 15.6_

- [x] 10. 企业级功能 - 单元测试生成
  - [x] 10.1 创建单元测试模板
    - 创建 `templates/backend/test/service.spec.ejs`
    - 创建 `templates/backend/test/controller.spec.ejs`
    - 生成 create, findAll, findOne, update, remove 测试用例
    - 生成 PrismaService mock 设置
    - _Requirements: 16.1, 16.2, 16.3_

  - [x] 10.2 创建测试数据工厂模板
    - 创建 `templates/backend/test/factory.ejs`
    - 生成实体测试数据工厂
    - _Requirements: 16.4_

  - [x] 10.3 创建 E2E 测试模板
    - 创建 `templates/backend/test/e2e.spec.ejs`
    - 生成完整的 E2E 测试用例
    - _Requirements: 16.5_

- [x] 11. Checkpoint - 企业级功能验证
  - 确保所有测试通过
  - 验证数据权限代码生成
  - 验证导入导出代码生成
  - 如有问题请询问用户

- [x] 12. 后端 API 控制器
  - [x] 12.1 实现 GenController 数据库表管理接口
    - 实现 `GET /tool/gen/db/list` 查询数据库表列表
    - 实现 `POST /tool/gen/importTable` 导入表
    - _Requirements: 1.1, 1.2_

  - [x] 12.2 实现 GenController 配置管理接口
    - 实现 `GET /tool/gen/list` 查询已导入表列表
    - 实现 `GET /tool/gen/:tableId` 获取表详情
    - 实现 `PUT /tool/gen` 更新配置
    - 实现 `DELETE /tool/gen/:tableIds` 删除配置
    - _Requirements: 2.1, 2.5, 2.6_

  - [x] 12.3 实现 GenController 代码生成接口
    - 实现 `GET /tool/gen/preview/:tableId` 预览代码
    - 实现 `GET /tool/gen/download/:tableName` 下载代码
    - 实现 `GET /tool/gen/batchGenCode` 批量生成
    - 实现 `GET /tool/gen/genCode/:tableName` 生成到路径
    - _Requirements: 5.1, 6.1, 7.2, 6.2_

  - [x] 12.4 实现 GenController 同步接口
    - 实现 `GET /tool/gen/synchDb/:tableId` 同步表结构
    - _Requirements: 8.1_

  - [x] 12.5 编写 Controller E2E 测试
    - 测试表导入流程
    - 测试代码生成流程
    - 测试同步功能
    - _Requirements: 1.2, 3.1, 8.1_

- [x] 13. 前端类型定义和 API 服务 (已存在，需适配 NestJS 后端)
  - [x] 13.1 前端类型定义已存在
    - `admin-naive-ui/src/typings/api/tool.api.d.ts` 已有 Gen 相关类型
    - 需要适配 NestJS 后端（移除 dataName 等 Java 特有字段）
    - _Requirements: 4.2_

  - [x] 13.2 前端 API 服务已存在
    - `admin-naive-ui/src/service/api/tool/gen.ts` 已有 API 方法
    - 需要适配 NestJS 后端 API 路径和参数
    - _Requirements: 4.3_

- [x] 14. 前端页面 - 主页面 (已存在)
  - [x] 14.1 代码生成主页面已存在
    - `admin-naive-ui/src/views/tool/gen/index.vue` 已实现
    - 需要适配 NestJS 后端（移除 dataName 相关逻辑）
    - _Requirements: 4.1_

  - [x] 14.2 批量操作功能已实现
    - 批量选择、批量删除、批量生成代码已实现
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 15. 前端页面 - 导入表弹窗 (已存在)
  - [x] 15.1 导入表弹窗组件已存在
    - `modules/gen-table-import-drawer.vue` 已实现
    - 需要适配 NestJS 后端
    - _Requirements: 1.2, 7.1_

- [x] 16. 前端页面 - 编辑配置抽屉 (已存在)
  - [x] 16.1 编辑配置抽屉组件已存在
    - `modules/gen-table-operate-drawer.vue` 已实现
    - 包含基本信息、字段信息、生成信息三个 Tab
    - _Requirements: 2.1_

  - [x] 16.2-16.4 配置组件已集成在 operate-drawer 中
    - 基本信息、生成信息、字段信息配置已实现
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 16.5 创建企业级功能配置组件 (已完成)
    - 创建 `modules/enterprise-info.vue`
    - 实现数据权限、导入导出、多租户、审计日志等配置
    - _Requirements: 10.1, 11.5, 12.1, 13.1, 14.1, 15.1_

- [x] 17. 前端页面 - 代码预览弹窗 (已存在)
  - [x] 17.1 代码预览弹窗组件已存在
    - `modules/gen-table-preview-drawer.vue` 已实现
    - 使用 Monaco Editor 显示代码
    - 支持复制代码功能
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 18. 前端页面 - 模板管理 (已完成)
  - [x] 18.1 创建模板管理弹窗组件
    - 创建 `modules/gen-template-modal.vue`
    - 实现模板列表展示
    - 实现模板变量说明
    - 实现模板预览
    - _Requirements: 9.2, 9.3_

- [x] 19. 路由和菜单配置 (已验证)
  - [x] 19.1 验证前端路由配置
    - 路由配置已存在于 router/elegant/routes.ts
    - 页面权限已配置
    - _Requirements: 4.1_

  - [x] 19.2 验证菜单数据
    - 菜单已在 seed.ts 中配置
    - 菜单权限已配置
    - _Requirements: 4.1_

- [x] 20. Checkpoint - 前端功能验证
  - 后端 TypeScript 编译通过
  - 前端组件诊断通过
  - 代码生成完整流程已实现
  - 企业级功能配置组件已完成

- [x] 21. 集成测试和文档
  - [x] 21.1 编写集成测试
    - 测试完整的代码生成流程
    - 测试生成的代码可编译
    - 测试生成的代码符合项目规范
    - _Requirements: 3.7, 4.7_

  - [x] 21.2 编写使用文档
    - 创建 `docs/features/code-generator.md` 使用说明
    - 包含模板变量参考文档
    - 包含企业级功能配置指南
    - _Requirements: 9.3_

- [x] 22. Final Checkpoint - 完整功能验证
  - 确保所有测试通过
  - 验证所有企业级功能
  - 验证代码生成质量
  - 如有问题请询问用户

## Notes

- All tasks are required for the complete implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- 后端使用 TypeScript + NestJS + Prisma
- 前端使用 Vue3 + Naive UI + TypeScript
- 模板引擎使用 EJS
