# Design Document: 类型安全与代码规范改造

## Overview

本设计文档描述了 NestJS SaaS 多租户系统的类型安全与代码规范改造方案。该改造旨在消除代码中的类型安全隐患（如 `any` 类型、`console` 调用、魔法字符串等），统一代码规范，提升项目的可维护性和企业级标准。

改造范围包括：
- 消除所有 `any` 类型，引入严格类型检查
- 统一日志输出，替换所有 `console` 调用为 NestJS Logger
- 统一文件和目录命名规范
- 数据库字段类型安全改造（使用 Prisma Enum）
- 魔法字符串常量化
- Repository 泛型类型优化
- 配置 ESLint 强制执行代码规范

## Architecture

### 整体架构

改造采用渐进式方案，分为以下几个层次：

1. **静态分析层**：使用 ESLint、TypeScript Compiler API 扫描代码问题
2. **类型系统层**：优化 TypeScript 类型定义，引入 Prisma 生成的类型
3. **代码规范层**：统一命名、目录结构、常量管理
4. **运行时层**：统一日志输出，增强运行时类型验证

### 技术栈

- **TypeScript 5.1.3**：启用严格类型检查
- **ESLint 8.42.0**：代码规范检查
- **Prisma 5.17.0**：类型安全的数据库访问
- **class-validator 0.14.1**：DTO 运行时验证
- **nestjs-pino 4.5.0**：结构化日志

## Components and Interfaces

### 1. 类型安全模块

#### 1.1 Prisma 枚举定义

在 `prisma/schema.prisma` 中定义枚举类型：

```prisma
enum DelFlag {
  NORMAL  @map("0")
  DELETED @map("2")
}

enum Status {
  NORMAL   @map("0")
  DISABLED @map("1")
}
```

#### 1.2 Repository 泛型优化

优化后的 `BaseRepository` 类型定义：

```typescript
export abstract class BaseRepository<
  TModel,
  TDelegate extends PrismaDelegate,
  TModelName extends Prisma.ModelName
> {
  protected readonly delegate: TDelegate;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: TModelName,
  ) {
    this.delegate = (prisma as any)[modelName] as TDelegate;
  }

  async create<T extends Prisma.Args<TDelegate, 'create'>>(
    args: Prisma.Exact<T, Prisma.Args<TDelegate, 'create'>>
  ): Promise<Prisma.Result<TDelegate, T, 'create'>> {
    return this.delegate.create(args);
  }

  async update<T extends Prisma.Args<TDelegate, 'update'>>(
    args: Prisma.Exact<T, Prisma.Args<TDelegate, 'update'>>
  ): Promise<Prisma.Result<TDelegate, T, 'update'>> {
    return this.delegate.update(args);
  }

  // ... 其他方法
}
```


#### 1.3 DTO 类型定义

使用 class-validator 装饰器的 DTO 示例：

```typescript
import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Status, DelFlag } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  userName: string;

  @IsString()
  nickName: string;

  @IsEnum(Status)
  status: Status;

  @IsOptional()
  @IsInt()
  @Min(1)
  deptId?: number;
}
```

### 2. 日志模块

#### 2.1 Logger 封装

创建统一的 Logger 服务：

```typescript
import { Injectable, Scope } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ClsService } from 'nestjs-cls';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends PinoLogger {
  constructor(private readonly cls: ClsService) {
    super();
  }

  log(message: string, context?: string): void {
    const tenantId = this.cls.get('tenantId');
    const userId = this.cls.get('userId');
    super.log({ tenantId, userId, message, context });
  }

  error(message: string, trace?: string, context?: string): void {
    const tenantId = this.cls.get('tenantId');
    const userId = this.cls.get('userId');
    super.error({ tenantId, userId, message, trace, context });
  }

  // ... 其他日志方法
}
```

### 3. 常量管理模块

#### 3.1 常量文件结构

```
src/
  common/
    constants/
      index.ts              # 导出所有常量
      status.constants.ts   # 状态相关常量
      error.constants.ts    # 错误消息常量
      config.constants.ts   # 配置相关常量
```

#### 3.2 常量定义示例

```typescript
// status.constants.ts
export const STATUS = {
  NORMAL: '0',
  DISABLED: '1',
} as const;

export const DEL_FLAG = {
  NORMAL: '0',
  DELETED: '2',
} as const;

// 类型导出
export type StatusValue = typeof STATUS[keyof typeof STATUS];
export type DelFlagValue = typeof DEL_FLAG[keyof typeof DEL_FLAG];
```

### 4. ESLint 配置模块

#### 4.1 ESLint 规则配置

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/'],
  rules: {
    // 禁止使用 any 类型
    '@typescript-eslint/no-explicit-any': 'error',
    
    // 禁止使用 console
    'no-console': 'error',
    
    // 要求显式返回类型
    '@typescript-eslint/explicit-function-return-type': ['error', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
    }],
    
    // 命名规范
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'default',
        format: ['camelCase'],
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
    ],
    
    // 禁止未使用的变量
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
  },
};
```

## Data Models

### Prisma Schema 改造

#### 改造前（部分示例）

```prisma
model SysUser {
  userId    Int       @id @default(autoincrement())
  status    String    @default("0") @db.Char(1)
  delFlag   String    @default("0") @map("del_flag") @db.Char(1)
  // ...
}
```

#### 改造后

```prisma
enum Status {
  NORMAL   @map("0")
  DISABLED @map("1")
}

enum DelFlag {
  NORMAL  @map("0")
  DELETED @map("2")
}

model SysUser {
  userId    Int       @id @default(autoincrement())
  status    Status    @default(NORMAL)
  delFlag   DelFlag   @default(NORMAL) @map("del_flag")
  // ...
}
```

### 数据迁移策略

由于 Prisma 枚举使用 `@map` 指令，数据库中的实际值保持不变（仍为 "0", "1", "2"），因此：
- **无需数据迁移**
- **向后兼容**
- **仅需重新生成 Prisma Client**


## Correctness Properties

*属性（Property）是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: ESLint 配置包含禁止 any 规则

*For any* ESLint 配置文件，应该包含 `@typescript-eslint/no-explicit-any` 规则且设置为 `error` 级别。

**Validates: Requirements 1.6, 7.1**

### Property 2: ESLint 配置包含禁止 console 规则

*For any* ESLint 配置文件，应该包含 `no-console` 规则且设置为 `error` 级别。

**Validates: Requirements 2.4, 7.2**

### Property 3: 日志输出包含上下文信息

*For any* 日志记录调用，输出的日志对象应该包含 `tenantId` 和 `userId` 字段（如果在 CLS 上下文中可用）。

**Validates: Requirements 2.3**

### Property 4: Error 级别日志包含堆栈信息

*For any* error 级别的日志记录，如果提供了 trace 参数，输出的日志对象应该包含 `trace` 字段。

**Validates: Requirements 2.5**

### Property 5: 文件名符合 kebab-case 规范

*For any* TypeScript 源文件（排除配置文件），文件名应该符合 kebab-case 命名规范（小写字母、数字和连字符）。

**Validates: Requirements 3.6**

### Property 6: Prisma Schema 状态字段使用枚举

*For any* Prisma Schema 中的 `status` 字段，应该使用 `Status` 枚举类型而非 `String` 类型。

**Validates: Requirements 4.1, 4.3**

### Property 7: Prisma Schema delFlag 字段使用枚举

*For any* Prisma Schema 中的 `delFlag` 字段，应该使用 `DelFlag` 枚举类型而非 `String` 类型。

**Validates: Requirements 4.1, 4.2**

### Property 8: 代码中使用枚举值而非字符串字面量

*For any* 涉及状态或删除标志的代码，应该使用 Prisma 生成的枚举值（如 `Status.NORMAL`）而非字符串字面量（如 `"0"`）。

**Validates: Requirements 4.5**

### Property 9: 常量通过导入引用

*For any* 使用常量的代码位置，应该通过 `import` 语句引用常量模块，而非在代码中硬编码字符串值。

**Validates: Requirements 5.6**

### Property 10: Repository 方法类型推导完整

*For any* Repository 方法调用，TypeScript 编译器应该能够正确推导出参数类型和返回类型，无需显式类型断言。

**Validates: Requirements 6.6**

### Property 11: DTO 类使用 class-validator 装饰器

*For any* DTO 类，所有字段应该使用适当的 class-validator 装饰器（如 `@IsString()`, `@IsEnum()` 等）。

**Validates: Requirements 9.1**

### Property 12: DTO 可选字段使用 @IsOptional

*For any* DTO 类中的可选字段（TypeScript `?` 标记），应该使用 `@IsOptional()` 装饰器。

**Validates: Requirements 9.2**

### Property 13: DTO 枚举字段使用 @IsEnum

*For any* DTO 类中类型为枚举的字段，应该使用 `@IsEnum()` 装饰器。

**Validates: Requirements 9.3**

### Property 14: DTO 嵌套对象使用 @ValidateNested

*For any* DTO 类中类型为对象的字段，应该使用 `@ValidateNested()` 和 `@Type()` 装饰器。

**Validates: Requirements 9.4**

### Property 15: DTO 数组字段使用 @IsArray

*For any* DTO 类中类型为数组的字段，应该使用 `@IsArray()` 装饰器。

**Validates: Requirements 9.5**

### Property 16: DTO 字段有明确类型注解

*For any* DTO 类的字段，应该有明确的 TypeScript 类型注解，不使用 `any` 类型。

**Validates: Requirements 9.6**

### Property 17: 类型导出使用 export type

*For any* 纯类型导出（不包含运行时值），应该使用 `export type` 而非 `export interface` 或 `export`。

**Validates: Requirements 8.5**

## Error Handling

### 1. 类型错误处理

- **编译时错误**：通过 TypeScript 严格模式和 ESLint 在编译时捕获类型错误
- **运行时错误**：通过 class-validator 在运行时验证 DTO 数据

### 2. 迁移错误处理

- **Prisma 迁移失败**：提供回滚脚本
- **数据不兼容**：使用 `@map` 指令保持数据库值不变

### 3. 日志错误处理

- **Logger 初始化失败**：降级到 console（仅在开发环境）
- **CLS 上下文缺失**：日志仍然记录，但缺少上下文信息

## Testing Strategy

### 单元测试

使用 Jest 进行单元测试，覆盖以下场景：

1. **Logger 测试**
   - 测试日志输出格式
   - 测试上下文信息注入
   - 测试不同日志级别

2. **Repository 测试**
   - 测试类型推导正确性
   - 测试 CRUD 操作
   - 测试枚举值使用

3. **DTO 验证测试**
   - 测试各种装饰器的验证逻辑
   - 测试边界条件
   - 测试错误消息

### 属性测试

使用 fast-check 进行属性测试（最少 100 次迭代）：

1. **Property 3: 日志上下文信息**
   - 生成随机日志消息和上下文
   - 验证输出包含必要字段

2. **Property 5: 文件名规范**
   - 扫描所有源文件
   - 验证命名符合 kebab-case

3. **Property 8: 枚举值使用**
   - 扫描代码中的状态字段使用
   - 验证使用枚举而非字符串

4. **Property 10: 类型推导**
   - 生成随机 Repository 调用
   - 验证 TypeScript 能正确推导类型

### 静态分析测试

1. **ESLint 规则测试**
   - 创建违反规则的测试代码
   - 验证 ESLint 能检测到违规

2. **TypeScript 编译测试**
   - 验证启用严格模式后代码能编译通过
   - 验证类型定义完整性

### 集成测试

1. **端到端类型安全测试**
   - 测试从 API 请求到数据库查询的完整流程
   - 验证类型在整个调用链中保持一致

2. **日志集成测试**
   - 测试日志在实际请求中的输出
   - 验证租户隔离的日志上下文

### 测试配置

所有属性测试使用以下配置：

```typescript
import * as fc from 'fast-check';

describe('Feature: type-safety-refactor', () => {
  it('Property 3: 日志输出包含上下文信息', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string(),
        (tenantId, userId) => {
          // 测试逻辑
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 测试覆盖率目标

- **单元测试覆盖率**：80%+
- **属性测试覆盖率**：所有核心属性
- **静态分析覆盖率**：100%（所有文件）

