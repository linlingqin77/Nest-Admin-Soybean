# Requirements Document

## Introduction

本文档定义了 NestJS SaaS 多租户系统的类型安全与代码规范改造需求。该改造旨在消除代码中的类型安全隐患，统一代码规范，提升项目的可维护性和企业级标准。

## Glossary

- **System**: NestJS SaaS 多租户后端系统
- **Type_Safety_Module**: 类型安全改造模块，负责消除 any 类型并引入严格类型
- **Code_Standard_Module**: 代码规范模块，负责统一命名、目录结构和常量管理
- **Logger_Module**: 日志模块，负责统一日志输出
- **Enum_Type**: Prisma 枚举类型，用于替代字符串类型的状态字段
- **Magic_String**: 魔法字符串，指硬编码在代码中的字符串常量
- **ESLint_Rule**: ESLint 规则，用于强制代码规范

## Requirements

### Requirement 1: 消除 any 类型使用

**User Story:** 作为开发人员，我希望代码中不存在 any 类型，以便获得完整的类型检查和 IDE 智能提示。

#### Acceptance Criteria

1. WHEN 扫描整个代码库 THEN THE System SHALL 识别所有使用 any 类型的位置
2. WHEN 发现 any 类型 THEN THE Type_Safety_Module SHALL 将其替换为明确的类型定义或泛型
3. WHEN 处理 Repository 方法参数 THEN THE Type_Safety_Module SHALL 使用 Prisma 生成的类型参数
4. WHEN 处理 DTO 类型 THEN THE Type_Safety_Module SHALL 使用 class-validator 装饰器定义明确类型
5. WHEN 处理函数返回值 THEN THE Type_Safety_Module SHALL 显式声明返回类型
6. WHEN 配置 ESLint THEN THE System SHALL 添加规则禁止使用 any 类型

### Requirement 2: 统一日志输出

**User Story:** 作为运维人员，我希望所有日志通过统一的 Logger 输出，以便进行日志收集和分析。

#### Acceptance Criteria

1. WHEN 扫描代码库 THEN THE System SHALL 识别所有 console.log/console.error 调用
2. WHEN 发现 console 调用 THEN THE Logger_Module SHALL 将其替换为 NestJS Logger
3. WHEN 记录日志 THEN THE Logger_Module SHALL 包含上下文信息（模块名、租户ID等）
4. WHEN 配置 ESLint THEN THE System SHALL 添加规则禁止使用 console 方法
5. WHEN 日志级别为 error THEN THE Logger_Module SHALL 包含堆栈信息

### Requirement 3: 统一文件和目录命名

**User Story:** 作为开发人员，我希望项目文件和目录命名统一规范，以便快速定位和理解代码结构。

#### Acceptance Criteria

1. WHEN 检查文件命名 THEN THE Code_Standard_Module SHALL 识别拼写错误的文件名
2. WHEN 发现拼写错误 THEN THE Code_Standard_Module SHALL 修正文件名（如 require-premission.decorator.ts）
3. WHEN 检查目录结构 THEN THE Code_Standard_Module SHALL 识别重复或不一致的目录
4. WHEN 发现目录不一致 THEN THE Code_Standard_Module SHALL 统一为复数形式（如 interceptors/）
5. WHEN 发现重复文件 THEN THE Code_Standard_Module SHALL 合并重复的 DTO 或工具文件
6. THE Code_Standard_Module SHALL 确保所有文件使用 kebab-case 命名

### Requirement 4: 数据库字段类型安全改造

**User Story:** 作为开发人员，我希望数据库状态字段使用枚举类型，以便获得类型安全和更好的可读性。

#### Acceptance Criteria

1. WHEN 定义状态字段 THEN THE System SHALL 在 Prisma Schema 中使用 Enum 类型
2. WHEN 定义 delFlag 字段 THEN THE System SHALL 使用 DelFlag 枚举（NORMAL='0', DELETED='2'）
3. WHEN 定义 status 字段 THEN THE System SHALL 使用 Status 枚举（NORMAL='0', DISABLED='1'）
4. WHEN 生成 Prisma Client THEN THE System SHALL 自动生成对应的 TypeScript 枚举
5. WHEN 查询或更新状态字段 THEN THE System SHALL 使用枚举值而非字符串字面量
6. WHEN 迁移数据库 THEN THE System SHALL 保持现有数据兼容性

### Requirement 5: 魔法字符串常量化

**User Story:** 作为开发人员，我希望所有硬编码的字符串都定义为常量，以便统一管理和避免拼写错误。

#### Acceptance Criteria

1. WHEN 扫描代码库 THEN THE Code_Standard_Module SHALL 识别所有魔法字符串
2. WHEN 发现状态相关字符串 THEN THE Code_Standard_Module SHALL 使用枚举替代
3. WHEN 发现配置相关字符串 THEN THE Code_Standard_Module SHALL 定义为常量
4. WHEN 发现错误消息字符串 THEN THE Code_Standard_Module SHALL 定义在 i18n 文件或常量文件中
5. THE Code_Standard_Module SHALL 创建统一的常量管理文件（如 constants/）
6. WHEN 使用常量 THEN THE System SHALL 通过导入引用而非硬编码

### Requirement 6: Repository 泛型类型优化

**User Story:** 作为开发人员，我希望 Repository 方法具有精确的类型定义，以便获得完整的类型检查。

#### Acceptance Criteria

1. WHEN 定义 Repository 基类 THEN THE System SHALL 使用 Prisma 泛型类型参数
2. WHEN 调用 create 方法 THEN THE Type_Safety_Module SHALL 使用 Prisma.ModelCreateInput 类型
3. WHEN 调用 update 方法 THEN THE Type_Safety_Module SHALL 使用 Prisma.ModelUpdateInput 类型
4. WHEN 调用 findMany 方法 THEN THE Type_Safety_Module SHALL 使用 Prisma.ModelFindManyArgs 类型
5. WHEN 返回查询结果 THEN THE Type_Safety_Module SHALL 使用 Prisma 生成的模型类型
6. FOR ALL Repository 方法 THEN THE System SHALL 提供完整的类型推导

### Requirement 7: ESLint 规则配置

**User Story:** 作为团队负责人，我希望通过 ESLint 强制执行代码规范，以便保持代码质量一致性。

#### Acceptance Criteria

1. WHEN 配置 ESLint THEN THE System SHALL 添加 @typescript-eslint/no-explicit-any 规则为 error
2. WHEN 配置 ESLint THEN THE System SHALL 添加 no-console 规则为 error
3. WHEN 配置 ESLint THEN THE System SHALL 添加命名规范规则（camelCase、PascalCase）
4. WHEN 运行 lint 检查 THEN THE System SHALL 报告所有违反规则的代码
5. WHEN 提交代码 THEN THE System SHALL 通过 Git hooks 自动运行 lint 检查
6. THE System SHALL 提供 lint:fix 命令自动修复可修复的问题

### Requirement 8: 类型定义文件组织

**User Story:** 作为开发人员，我希望类型定义文件组织清晰，以便快速找到和复用类型。

#### Acceptance Criteria

1. THE System SHALL 创建 types/ 目录存放共享类型定义
2. WHEN 定义业务类型 THEN THE System SHALL 按模块组织类型文件
3. WHEN 定义通用类型 THEN THE System SHALL 放在 types/common.ts 中
4. WHEN 定义 API 响应类型 THEN THE System SHALL 放在 types/response.ts 中
5. WHEN 导出类型 THEN THE System SHALL 使用 export type 而非 export interface（除非需要声明合并）
6. THE System SHALL 避免循环依赖的类型定义

### Requirement 9: DTO 类型安全增强

**User Story:** 作为开发人员，我希望 DTO 具有完整的类型定义和验证规则，以便确保数据正确性。

#### Acceptance Criteria

1. WHEN 定义 DTO THEN THE System SHALL 使用 class-validator 装饰器
2. WHEN 定义可选字段 THEN THE System SHALL 使用 @IsOptional() 装饰器
3. WHEN 定义枚举字段 THEN THE System SHALL 使用 @IsEnum() 装饰器
4. WHEN 定义嵌套对象 THEN THE System SHALL 使用 @ValidateNested() 和 @Type() 装饰器
5. WHEN 定义数组字段 THEN THE System SHALL 使用 @IsArray() 和 @ArrayMinSize() 装饰器
6. FOR ALL DTO 字段 THEN THE System SHALL 提供明确的类型注解

### Requirement 10: 代码审查检查清单

**User Story:** 作为代码审查者，我希望有明确的检查清单，以便确保改造质量。

#### Acceptance Criteria

1. THE System SHALL 提供类型安全检查清单文档
2. WHEN 审查代码 THEN THE System SHALL 确认无 any 类型使用
3. WHEN 审查代码 THEN THE System SHALL 确认无 console 调用
4. WHEN 审查代码 THEN THE System SHALL 确认无魔法字符串
5. WHEN 审查代码 THEN THE System SHALL 确认文件命名符合规范
6. WHEN 审查代码 THEN THE System SHALL 确认所有 DTO 有完整验证规则
