# Requirements Document

## Introduction

本功能为 Nest-Admin-Soybean 系统提供企业级前后端代码生成能力，允许开发者通过数据库表结构自动生成 NestJS 后端代码（Controller、Service、DTO、Module）和 Vue3 + Naive UI 前端代码（页面、API、类型定义）。该功能参考 RuoYi 代码生成器设计，并增加数据权限、导入导出、多租户等企业级功能，旨在提高开发效率，减少重复性编码工作，确保代码风格一致性。

## Glossary

- **Code_Generator**: 代码生成器系统，负责解析数据库表结构并生成前后端代码
- **GenTable**: 代码生成业务表，存储待生成代码的表配置信息
- **GenTableColumn**: 代码生成字段表，存储表字段的详细配置
- **Template_Engine**: 模板引擎，用于渲染代码模板生成最终代码
- **Database_Introspector**: 数据库内省器，用于读取数据库表结构元数据
- **Preview_Service**: 预览服务，用于在生成前预览代码内容
- **Backend_Code**: 后端代码，包括 NestJS 的 Controller、Service、DTO、Module 文件
- **Frontend_Code**: 前端代码，包括 Vue3 页面组件、API 接口、TypeScript 类型定义
- **Data_Scope**: 数据权限，控制用户可访问的数据范围
- **Excel_Service**: Excel 服务，处理数据导入导出功能
- **Tenant_Context**: 租户上下文，提供多租户数据隔离

## Requirements

### Requirement 1: 数据库表导入

**User Story:** As a developer, I want to import database tables into the code generator, so that I can select tables for code generation.

#### Acceptance Criteria

1. WHEN a developer requests the list of database tables, THE Database_Introspector SHALL return all tables from the connected PostgreSQL database excluding system tables
2. WHEN a developer selects tables to import, THE Code_Generator SHALL create GenTable records with extracted table metadata (name, comment, columns)
3. WHEN importing a table, THE Code_Generator SHALL create GenTableColumn records for each column with type mapping (PostgreSQL type to TypeScript/JavaScript type)
4. IF a table has already been imported, THEN THE Code_Generator SHALL prompt for confirmation before overwriting existing configuration
5. WHEN importing columns, THE Code_Generator SHALL automatically detect primary keys, nullable fields, and default values

### Requirement 2: 代码生成配置管理

**User Story:** As a developer, I want to configure code generation options for each table, so that I can customize the generated code structure.

#### Acceptance Criteria

1. THE Code_Generator SHALL allow configuration of: package name, module name, business name, function name, and author
2. WHEN configuring a table, THE Code_Generator SHALL support template category selection (CRUD, tree structure, master-detail)
3. WHEN configuring a table, THE Code_Generator SHALL support web type selection (Vue3 element-plus, Vue3 naive-ui)
4. THE Code_Generator SHALL allow configuration of generation type (ZIP download or custom path)
5. WHEN configuring columns, THE Code_Generator SHALL allow setting: display in list, display in form, query condition, query type, HTML control type, and dictionary type
6. THE Code_Generator SHALL persist all configuration changes to GenTable and GenTableColumn records

### Requirement 3: 后端代码生成

**User Story:** As a developer, I want to generate NestJS backend code from table configuration, so that I can quickly create CRUD APIs.

#### Acceptance Criteria

1. WHEN generating backend code, THE Code_Generator SHALL produce a NestJS Module file with proper imports and providers
2. WHEN generating backend code, THE Code_Generator SHALL produce a Controller file with RESTful endpoints (list, get, create, update, delete)
3. WHEN generating backend code, THE Code_Generator SHALL produce a Service file with business logic methods
4. WHEN generating backend code, THE Code_Generator SHALL produce DTO files (CreateDto, UpdateDto, QueryDto) with class-validator decorators
5. WHEN generating backend code, THE Code_Generator SHALL produce a Prisma repository file for database operations
6. WHEN a column is marked as query condition, THE Code_Generator SHALL include it in QueryDto with appropriate query type (EQ, NE, GT, GE, LT, LE, LIKE, BETWEEN)
7. THE Template_Engine SHALL use the project's existing code style and naming conventions

### Requirement 4: 前端代码生成

**User Story:** As a developer, I want to generate Vue3 + Naive UI frontend code from table configuration, so that I can quickly create management pages.

#### Acceptance Criteria

1. WHEN generating frontend code, THE Code_Generator SHALL produce a Vue3 page component with list view, search form, and CRUD operations
2. WHEN generating frontend code, THE Code_Generator SHALL produce TypeScript type definitions matching the backend DTOs
3. WHEN generating frontend code, THE Code_Generator SHALL produce API service files with axios/alova request methods
4. WHEN a column uses dictionary type, THE Code_Generator SHALL generate code that fetches and displays dictionary values
5. WHEN a column is marked for list display, THE Code_Generator SHALL include it in the table columns configuration
6. WHEN a column is marked for form display, THE Code_Generator SHALL include it in the form with appropriate Naive UI component based on HTML type
7. THE Code_Generator SHALL generate form validation rules based on column constraints (required, length, type)

### Requirement 5: 代码预览

**User Story:** As a developer, I want to preview generated code before downloading, so that I can verify the output meets my requirements.

#### Acceptance Criteria

1. WHEN a developer requests code preview, THE Preview_Service SHALL render all template files and return the content
2. THE Preview_Service SHALL display code with syntax highlighting for TypeScript, Vue, and SQL
3. THE Preview_Service SHALL organize preview by file type (backend, frontend) with tab navigation
4. WHEN previewing, THE Code_Generator SHALL NOT write any files to disk

### Requirement 6: 代码下载与部署

**User Story:** As a developer, I want to download or deploy generated code, so that I can integrate it into my project.

#### Acceptance Criteria

1. WHEN generation type is ZIP, THE Code_Generator SHALL package all generated files into a downloadable ZIP archive
2. WHEN generation type is custom path, THE Code_Generator SHALL write files directly to the specified directory structure
3. IF target files already exist, THEN THE Code_Generator SHALL prompt for confirmation before overwriting
4. THE Code_Generator SHALL maintain proper directory structure matching the project conventions
5. WHEN deploying to custom path, THE Code_Generator SHALL generate a migration file for any new database changes

### Requirement 7: 批量操作

**User Story:** As a developer, I want to perform batch operations on multiple tables, so that I can efficiently manage code generation tasks.

#### Acceptance Criteria

1. THE Code_Generator SHALL support batch import of multiple database tables
2. THE Code_Generator SHALL support batch code generation for multiple tables
3. THE Code_Generator SHALL support batch deletion of GenTable configurations
4. WHEN batch generating, THE Code_Generator SHALL package all generated code into a single ZIP file organized by table

### Requirement 8: 同步表结构

**User Story:** As a developer, I want to synchronize table structure changes, so that my code generation configuration stays up to date with database changes.

#### Acceptance Criteria

1. WHEN a developer requests table sync, THE Database_Introspector SHALL compare current database schema with stored GenTableColumn records
2. WHEN new columns are detected, THE Code_Generator SHALL add corresponding GenTableColumn records with default configuration
3. WHEN columns are removed from database, THE Code_Generator SHALL mark corresponding GenTableColumn records as deleted
4. WHEN column types change, THE Code_Generator SHALL update the type mapping in GenTableColumn
5. THE Code_Generator SHALL preserve custom configuration (display settings, query settings) during sync

### Requirement 9: 模板管理

**User Story:** As a developer, I want to customize code generation templates, so that I can adapt the generated code to specific project requirements.

#### Acceptance Criteria

1. THE Template_Engine SHALL support EJS or Handlebars template syntax for code generation
2. THE Code_Generator SHALL provide default templates for all supported code types
3. THE Code_Generator SHALL allow viewing and understanding template variables and structure
4. WHEN rendering templates, THE Template_Engine SHALL handle special characters and escaping properly

### Requirement 10: 数据权限支持

**User Story:** As a developer, I want generated code to support data permission control, so that users can only access data within their authorized scope.

#### Acceptance Criteria

1. WHEN data scope is enabled, THE Code_Generator SHALL generate @DataScope decorator on list query methods
2. THE Code_Generator SHALL support configuring data scope column (deptId or createBy)
3. WHEN generating service code, THE Code_Generator SHALL include data scope condition in query WHERE clause
4. THE Code_Generator SHALL support five data scope types: ALL, CUSTOM, DEPT, DEPT_AND_CHILD, SELF
5. WHEN data scope is DEPT_AND_CHILD, THE Code_Generator SHALL generate recursive department query logic

### Requirement 11: Excel 导入导出

**User Story:** As a developer, I want generated code to include Excel import/export functionality, so that users can batch manage data through spreadsheets.

#### Acceptance Criteria

1. WHEN export is enabled, THE Code_Generator SHALL generate export endpoint in Controller
2. WHEN export is enabled, THE Code_Generator SHALL generate export button and handler in frontend page
3. WHEN import is enabled, THE Code_Generator SHALL generate import endpoint with file upload handling
4. WHEN import is enabled, THE Code_Generator SHALL generate import modal with template download in frontend
5. THE Code_Generator SHALL support configuring which columns are exportable/importable
6. WHEN exporting, THE Code_Generator SHALL support date formatting and dictionary value conversion
7. WHEN importing, THE Code_Generator SHALL generate data validation and error reporting logic
8. THE Code_Generator SHALL generate import template download endpoint

### Requirement 12: 多租户支持

**User Story:** As a developer, I want generated code to support multi-tenancy, so that data is properly isolated between tenants.

#### Acceptance Criteria

1. WHEN tenant isolation is enabled, THE Code_Generator SHALL inject tenantId in create operations
2. WHEN tenant isolation is enabled, THE Code_Generator SHALL include tenantId filter in all query operations
3. THE Code_Generator SHALL support configuring tenant column name (default: tenantId)
4. THE Code_Generator SHALL generate tenant context retrieval from ClsService

### Requirement 13: 审计日志

**User Story:** As a developer, I want generated code to include operation logging, so that all data changes are tracked for audit purposes.

#### Acceptance Criteria

1. WHEN operation log is enabled, THE Code_Generator SHALL add @Operlog decorator to create, update, delete, export, import endpoints
2. THE Code_Generator SHALL support configuring operation log title
3. THE Code_Generator SHALL generate appropriate BusinessType for each operation (INSERT, UPDATE, DELETE, EXPORT, IMPORT)

### Requirement 14: 高级查询功能

**User Story:** As a developer, I want generated code to support advanced search capabilities, so that users can find data efficiently.

#### Acceptance Criteria

1. WHEN advanced search is enabled, THE Code_Generator SHALL generate expandable search panel in frontend
2. THE Code_Generator SHALL support configuring default sort field and order
3. THE Code_Generator SHALL support IN and NOT_IN query types for multi-select fields
4. THE Code_Generator SHALL generate date range picker for datetime query fields
5. THE Code_Generator SHALL support search form field grouping (basic/advanced)

### Requirement 15: 前端表格增强

**User Story:** As a developer, I want generated frontend tables to have enterprise-grade features, so that users have a better data management experience.

#### Acceptance Criteria

1. WHEN column resize is enabled, THE Code_Generator SHALL generate resizable table columns
2. WHEN column toggle is enabled, THE Code_Generator SHALL generate column visibility settings
3. THE Code_Generator SHALL support configuring column width, alignment, and fixed position
4. THE Code_Generator SHALL support configuring sortable columns
5. WHEN inline edit is enabled, THE Code_Generator SHALL generate editable table cells
6. WHEN batch edit is enabled, THE Code_Generator SHALL generate batch edit functionality

### Requirement 16: 单元测试生成

**User Story:** As a developer, I want generated code to include unit test templates, so that I can ensure code quality from the start.

#### Acceptance Criteria

1. WHEN unit test is enabled, THE Code_Generator SHALL generate service unit test file with Jest
2. THE Code_Generator SHALL generate test cases for create, findAll, findOne, update, remove methods
3. THE Code_Generator SHALL generate mock setup for PrismaService
4. THE Code_Generator SHALL generate test data factories for the entity
