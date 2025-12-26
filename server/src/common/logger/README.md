# Logger Module

统一的日志模块，基于 Pino 实现，自动注入租户和用户上下文信息。

## 功能特性

- ✅ 自动注入租户 ID（tenantId）
- ✅ 自动注入用户 ID（userId）
- ✅ 支持多种日志级别（log, error, warn, debug, verbose）
- ✅ 结构化日志输出
- ✅ 支持日志脱敏
- ✅ 支持文件和控制台输出

## 使用方法

### 1. 在 Service 中使用

```typescript
import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/logger';

@Injectable()
export class UserService {
  constructor(private readonly logger: AppLogger) {
    // 设置日志上下文
    this.logger.setContext('UserService');
  }

  async createUser(userData: CreateUserDto) {
    this.logger.log('Creating new user');
    
    try {
      const user = await this.userRepository.create(userData);
      this.logger.log(`User created successfully: ${user.userId}`);
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error.stack);
      throw error;
    }
  }

  async updateUser(userId: number, userData: UpdateUserDto) {
    this.logger.debug(`Updating user ${userId}`);
    
    // 业务逻辑...
    
    this.logger.log(`User ${userId} updated successfully`);
  }
}
```

### 2. 在 Controller 中使用

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AppLogger } from 'src/common/logger';

@Controller('users')
export class UserController {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('UserController');
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    this.logger.log('Received create user request');
    
    try {
      const result = await this.userService.create(createUserDto);
      return result;
    } catch (error) {
      this.logger.error('Create user request failed', error.stack);
      throw error;
    }
  }
}
```

## 日志级别

- **log**: 普通信息日志
- **error**: 错误日志（包含堆栈信息）
- **warn**: 警告日志
- **debug**: 调试日志
- **verbose**: 详细日志

## 日志输出格式

日志会自动包含以下上下文信息：

```json
{
  "level": "info",
  "time": "2024-01-01T12:00:00.000Z",
  "tenantId": "tenant-123",
  "userId": 456,
  "message": "User created successfully",
  "context": "UserService"
}
```

## 配置

日志配置在 `.env` 文件中：

```env
# 日志级别: trace, debug, info, warn, error, fatal
LOG_LEVEL=info

# 日志目录
LOG_DIR=logs

# 是否美化输出（开发环境建议开启）
LOG_PRETTY_PRINT=true

# 是否输出到文件
LOG_TO_FILE=true

# 排除的路径（不记录日志）
LOG_EXCLUDE_PATHS=/health,/metrics

# 敏感字段（自动脱敏）
LOG_SENSITIVE_FIELDS=password,token,secret
```

## 注意事项

1. **不要使用 console.log**：请使用 AppLogger 替代所有 console 调用
2. **设置上下文**：在构造函数中调用 `setContext()` 设置日志上下文
3. **错误日志**：调用 `error()` 时传入堆栈信息以便调试
4. **敏感信息**：敏感字段会自动脱敏，无需手动处理

## 迁移指南

### 从 console 迁移

```typescript
// ❌ 旧代码
console.log('User created');
console.error('Error:', error);

// ✅ 新代码
this.logger.log('User created');
this.logger.error('Error occurred', error.stack);
```

### 从 NestJS Logger 迁移

```typescript
// ❌ 旧代码
import { Logger } from '@nestjs/common';
const logger = new Logger('UserService');
logger.log('User created');

// ✅ 新代码
import { AppLogger } from 'src/common/logger';
constructor(private readonly logger: AppLogger) {
  this.logger.setContext('UserService');
}
this.logger.log('User created');
```
