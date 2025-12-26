# Implementation Plan: 类型安全与代码规范改造

## Overview

本实施计划将类型安全与代码规范改造分解为可执行的编码任务。改造采用渐进式方案，优先处理影响最大的 P0 问题，然后逐步完善。每个任务都是独立的、可测试的，并引用了相关的需求。

## Tasks

- [x] 1. 配置 TypeScript 和 ESLint 严格模式
  - 更新 `tsconfig.json` 启用严格类型检查
  - 更新 `.eslintrc.js` 添加禁止 `any` 和 `console` 的规则
  - 添加命名规范规则
  - 配置 Git hooks 自动运行 lint 检查
  - _Requirements: 1.6, 2.4, 7.1, 7.2, 7.3, 7.5_

- [x] 1.1 编写 ESLint 配置验证测试
  - **Property 1: ESLint 配置包含禁止 any 规则**
  - **Property 2: ESLint 配置包含禁止 console 规则**
  - **Validates: Requirements 1.6, 2.4, 7.1, 7.2**

- [x] 2. 创建 Prisma 枚举类型
  - [x] 2.1 在 `prisma/schema.prisma` 中定义 `Status` 枚举
    - 定义 `NORMAL` 和 `DISABLED` 值
    - 使用 `@map` 指令映射到数据库值 "0" 和 "1"
    - _Requirements: 4.1, 4.3_

  - [x] 2.2 在 `prisma/schema.prisma` 中定义 `DelFlag` 枚举
    - 定义 `NORMAL` 和 `DELETED` 值
    - 使用 `@map` 指令映射到数据库值 "0" 和 "2"
    - _Requirements: 4.1, 4.2_

  - [x] 2.3 更新所有模型的 `status` 字段使用 `Status` 枚举
    - 更新所有表的 status 字段类型
    - 保持默认值为 `NORMAL`
    - _Requirements: 4.1, 4.3_

  - [x] 2.4 更新所有模型的 `delFlag` 字段使用 `DelFlag` 枚举
    - 更新所有表的 delFlag 字段类型
    - 保持默认值为 `NORMAL`
    - _Requirements: 4.1, 4.2_

  - [x] 2.5 生成 Prisma Client 并验证枚举类型
    - 运行 `prisma generate`
    - 验证生成的 TypeScript 枚举
    - _Requirements: 4.4_

- [x] 2.6 编写 Prisma Schema 枚举验证测试
  - **Property 6: Prisma Schema 状态字段使用枚举**
  - **Property 7: Prisma Schema delFlag 字段使用枚举**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 3. 创建常量管理模块
  - [x] 3.1 创建常量目录结构
    - 创建 `src/common/constants/` 目录
    - 创建 `index.ts` 作为统一导出文件
    - _Requirements: 5.5_

  - [x] 3.2 定义状态相关常量
    - 创建 `status.constants.ts`
    - 定义 `STATUS` 和 `DEL_FLAG` 常量对象
    - 导出类型定义
    - _Requirements: 5.2, 5.3_

  - [x] 3.3 定义错误消息常量
    - 创建 `error.constants.ts`
    - 整理现有错误消息字符串
    - _Requirements: 5.4_

  - [x] 3.4 定义配置相关常量
    - 创建 `config.constants.ts`
    - 整理配置键名等常量
    - _Requirements: 5.3_

- [x] 4. 优化 Repository 泛型类型
  - [x] 4.1 重构 `BaseRepository` 类型定义
    - 添加 Prisma 泛型类型参数
    - 更新 `create` 方法使用 `Prisma.ModelCreateInput`
    - 更新 `update` 方法使用 `Prisma.ModelUpdateInput`
    - 更新 `findMany` 方法使用 `Prisma.ModelFindManyArgs`
    - 确保返回类型使用 Prisma 生成的模型类型
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.2 更新 `SoftDeleteRepository` 类型定义
    - 继承优化后的 `BaseRepository`
    - 确保类型推导正确传递
    - _Requirements: 6.1, 6.6_

- [x] 4.3 编写 Repository 类型推导测试
  - **Property 10: Repository 方法类型推导完整**
  - **Validates: Requirements 6.6**

- [x] 5. 创建统一 Logger 模块
  - [x] 5.1 创建 `AppLogger` 服务
    - 继承 `PinoLogger`
    - 注入 `ClsService` 获取上下文
    - 实现 `log`, `error`, `warn`, `debug` 方法
    - 在日志中自动注入 `tenantId` 和 `userId`
    - _Requirements: 2.3, 2.5_

  - [x] 5.2 创建 Logger 模块
    - 创建 `LoggerModule`
    - 配置 Pino 日志格式
    - 导出 `AppLogger` 服务
    - _Requirements: 2.3_

- [x] 5.3 编写 Logger 单元测试
  - 测试日志输出格式
  - 测试上下文信息注入
  - 测试不同日志级别
  - _Requirements: 2.3, 2.5_

- [ ] 5.4 编写 Logger 属性测试
  - **Property 3: 日志输出包含上下文信息**
  - **Property 4: Error 级别日志包含堆栈信息**
  - **Validates: Requirements 2.3, 2.5**

- [ ] 6. Checkpoint - 验证基础设施
  - 确保所有测试通过
  - 验证 Prisma Client 生成正确
  - 验证 ESLint 规则生效
  - 询问用户是否有问题


- [x] 7. 扫描并消除 any 类型
  - [x] 7.1 扫描代码库中的 any 类型使用
    - 使用 ESLint 或 TypeScript Compiler API 扫描
    - 生成 any 类型使用报告
    - _Requirements: 1.1_

  - [x] 7.2 替换 Repository 中的 any 类型
    - 更新所有 Repository 方法参数类型
    - 使用 Prisma 生成的类型
    - _Requirements: 1.2, 1.3_

  - [x] 7.3 替换 Service 中的 any 类型
    - 更新所有 Service 方法参数和返回类型
    - 使用明确的类型定义或泛型
    - _Requirements: 1.2_

  - [x] 7.4 替换 Controller 中的 any 类型
    - 更新所有 Controller 方法参数和返回类型
    - 使用 DTO 类型
    - _Requirements: 1.2_

  - [x] 7.5 替换工具函数中的 any 类型
    - 更新所有工具函数的类型定义
    - 使用泛型或明确类型
    - _Requirements: 1.2_

  - [x] 7.6 添加显式函数返回类型
    - 为所有函数添加返回类型注解
    - 确保类型推导正确
    - _Requirements: 1.5_

- [x] 8. 扫描并替换 console 调用
  - [x] 8.1 扫描代码库中的 console 调用
    - 使用 ESLint 扫描所有 console.log/error/warn 调用
    - 生成 console 使用报告
    - _Requirements: 2.1_

  - [x] 8.2 替换 Service 中的 console 调用
    - 注入 `AppLogger`
    - 替换所有 console 调用为 Logger 方法
    - _Requirements: 2.2_

  - [x] 8.3 替换 Controller 中的 console 调用
    - 注入 `AppLogger`
    - 替换所有 console 调用为 Logger 方法
    - _Requirements: 2.2_

  - [x] 8.4 替换中间件和拦截器中的 console 调用
    - 注入 `AppLogger`
    - 替换所有 console 调用为 Logger 方法
    - _Requirements: 2.2_

- [x] 9. 统一文件和目录命名
  - [x] 9.1 扫描并修正文件命名错误
    - 修正 `require-premission.decorator.ts` 为 `require-permission.decorator.ts`
    - 识别其他拼写错误的文件
    - _Requirements: 3.1, 3.2_

  - [x] 9.2 统一目录结构
    - 合并 `interceptor/` 和 `interceptors/` 目录
    - 统一使用复数形式
    - _Requirements: 3.3, 3.4_

  - [x] 9.3 合并重复文件
    - 识别重复的 DTO 文件
    - 合并功能相同的文件
    - _Requirements: 3.5_

- [-] 9.4 编写文件命名规范验证测试
  - **Property 5: 文件名符合 kebab-case 规范**
  - **Validates: Requirements 3.6**

- [ ] 10. 替换魔法字符串为枚举和常量
  - [ ] 10.1 扫描代码库中的魔法字符串
    - 识别所有硬编码的状态值（"0", "1", "2"）
    - 识别其他魔法字符串
    - _Requirements: 5.1_

  - [ ] 10.2 替换状态字段的字符串字面量
    - 使用 Prisma 枚举值（`Status.NORMAL`, `DelFlag.NORMAL`）
    - 更新所有查询和更新操作
    - _Requirements: 4.5, 5.2_

  - [ ] 10.3 替换配置相关的魔法字符串
    - 使用常量模块中的常量
    - 更新所有引用位置
    - _Requirements: 5.3, 5.6_

  - [ ] 10.4 替换错误消息的魔法字符串
    - 使用错误常量模块
    - 更新所有错误抛出位置
    - _Requirements: 5.4, 5.6_

- [ ]* 10.5 编写枚举使用验证测试
  - **Property 8: 代码中使用枚举值而非字符串字面量**
  - **Property 9: 常量通过导入引用**
  - **Validates: Requirements 4.5, 5.6**

- [ ] 11. 增强 DTO 类型安全
  - [ ] 11.1 审查所有 DTO 类
    - 识别缺少装饰器的 DTO 字段
    - 识别类型不明确的字段
    - _Requirements: 9.1, 9.6_

  - [ ] 11.2 为 DTO 字段添加 class-validator 装饰器
    - 为字符串字段添加 `@IsString()`
    - 为数字字段添加 `@IsInt()` 或 `@IsNumber()`
    - 为布尔字段添加 `@IsBoolean()`
    - _Requirements: 9.1_

  - [ ] 11.3 为可选字段添加 @IsOptional
    - 识别所有可选字段（`?` 标记）
    - 添加 `@IsOptional()` 装饰器
    - _Requirements: 9.2_

  - [ ] 11.4 为枚举字段添加 @IsEnum
    - 识别所有枚举类型字段
    - 添加 `@IsEnum()` 装饰器
    - _Requirements: 9.3_

  - [ ] 11.5 为嵌套对象添加 @ValidateNested
    - 识别所有对象类型字段
    - 添加 `@ValidateNested()` 和 `@Type()` 装饰器
    - _Requirements: 9.4_

  - [ ] 11.6 为数组字段添加 @IsArray
    - 识别所有数组类型字段
    - 添加 `@IsArray()` 装饰器
    - _Requirements: 9.5_

  - [ ] 11.7 为所有 DTO 字段添加明确类型注解
    - 确保没有 any 类型
    - 使用 Prisma 枚举类型
    - _Requirements: 9.6_

- [ ]* 11.8 编写 DTO 验证属性测试
  - **Property 11: DTO 类使用 class-validator 装饰器**
  - **Property 12: DTO 可选字段使用 @IsOptional**
  - **Property 13: DTO 枚举字段使用 @IsEnum**
  - **Property 14: DTO 嵌套对象使用 @ValidateNested**
  - **Property 15: DTO 数组字段使用 @IsArray**
  - **Property 16: DTO 字段有明确类型注解**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**

- [ ] 12. 组织类型定义文件
  - [ ] 12.1 创建 types 目录结构
    - 创建 `src/types/` 目录
    - 创建 `common.ts`, `response.ts` 等文件
    - _Requirements: 8.1_

  - [ ] 12.2 迁移共享类型定义
    - 将通用类型移到 `types/common.ts`
    - 将 API 响应类型移到 `types/response.ts`
    - 按模块组织业务类型
    - _Requirements: 8.2, 8.3, 8.4_

  - [ ] 12.3 统一类型导出方式
    - 使用 `export type` 导出纯类型
    - 保留 `export interface` 用于需要声明合并的场景
    - _Requirements: 8.5_

- [ ]* 12.4 编写类型导出验证测试
  - **Property 17: 类型导出使用 export type**
  - **Validates: Requirements 8.5**

- [ ]* 12.5 检测循环依赖
  - 使用工具检测类型定义的循环依赖
  - _Requirements: 8.6_

- [ ] 13. Checkpoint - 验证改造完成
  - 运行所有单元测试
  - 运行所有属性测试
  - 运行 ESLint 检查，确保无违规
  - 运行 TypeScript 编译，确保无类型错误
  - 询问用户是否有问题

- [ ] 14. 创建代码审查检查清单
  - [ ] 14.1 编写类型安全检查清单文档
    - 列出所有需要检查的项目
    - 提供检查方法和工具
    - _Requirements: 10.1_

  - [ ] 14.2 更新开发规范文档
    - 记录新的代码规范
    - 提供示例代码
    - _Requirements: 10.1_

- [ ] 15. 最终验证和文档
  - [ ] 15.1 运行完整测试套件
    - 单元测试覆盖率 > 80%
    - 所有属性测试通过
    - ESLint 无错误
    - TypeScript 编译通过

  - [ ] 15.2 更新 README 和文档
    - 记录改造内容
    - 更新开发指南
    - 提供迁移指南

  - [ ] 15.3 生成改造报告
    - 统计改造前后的指标
    - 记录遇到的问题和解决方案
    - 提供后续优化建议

## Notes

- 任务标记 `*` 的为可选任务，可以跳过以加快 MVP 进度
- 每个任务都引用了相关需求，便于追溯
- Checkpoint 任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
