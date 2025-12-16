# 本地开发日志配置指南

## 概述

本项目使用 Pino 作为日志记录框架,在本地开发环境中已配置详细的日志记录功能,帮助快速定位和修复 bug。

## 日志配置

### 环境变量 (.env.development)

```bash
# 日志级别: trace, debug, info, warn, error, fatal
LOG_LEVEL=debug

# 美化输出 (彩色控制台输出)
LOG_PRETTY_PRINT=true

# 日志目录
LOG_DIR=../logs

# 同时写入文件 (开发环境也记录到文件)
LOG_TO_FILE=true

# 排除的路径 (减少噪音)
LOG_EXCLUDE_PATHS=["/health","/metrics","/favicon.ico","/api-docs"]

# 敏感字段 (自动脱敏)
LOG_SENSITIVE_FIELDS=["password","token","authorization","cookie","secret"]
```

### 日志级别说明

- **trace**: 最详细的跟踪信息
- **debug**: 调试信息 (默认开发环境)
- **info**: 一般信息
- **warn**: 警告信息
- **error**: 错误信息
- **fatal**: 致命错误

## 日志功能特性

### 1. 双输出模式

开发环境同时输出到:
- **控制台**: 彩色美化输出,便于实时查看
- **文件**: JSON 格式,便于后续分析

日志文件位置: `server/logs/app-development-YYYY-MM-DD.log`

### 2. 自动记录信息

每个请求自动记录:
- ✅ 请求 ID (唯一标识)
- ✅ 租户 ID
- ✅ 用户 ID 和用户名
- ✅ 请求方法和 URL
- ✅ 请求参数 (query, params, body)
- ✅ 请求头 (包括 tenant-id, encrypted 等)
- ✅ 响应状态码
- ✅ 响应时间
- ✅ IP 地址
- ✅ User-Agent

### 3. 敏感信息脱敏

自动隐藏敏感字段:
- password, passwd, pwd
- token, accessToken, refreshToken
- authorization
- cookie
- secret, secretKey, apiKey

显示为: `***REDACTED***`

### 4. 错误堆栈

开发环境自动记录完整错误堆栈,包括:
- 错误类型
- 错误消息
- 堆栈跟踪
- 错误代码
- HTTP 状态码

## 使用方法

### 在代码中记录日志

```typescript
import { Logger } from '@nestjs/common';

export class YourService {
  private readonly logger = new Logger(YourService.name);

  async yourMethod() {
    this.logger.debug('调试信息');
    this.logger.log('一般信息');
    this.logger.warn('警告信息');
    this.logger.error('错误信息', error.stack);
  }
}
```

### 使用注入的 PinoLogger

```typescript
import { PinoLogger } from 'nestjs-pino';

export class YourService {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(YourService.name);
  }

  async yourMethod() {
    this.logger.debug({ userId: 123, action: 'test' }, '用户操作');
    this.logger.error({ error: err }, '操作失败');
  }
}
```

## 日志查看工具

### 快速查看脚本

使用提供的日志查看脚本:

```bash
cd server/scripts

# 实时查看最后50行
./view-logs.sh -t 50

# 只看错误
./view-logs.sh -e

# 只看警告和错误
./view-logs.sh -w

# 搜索关键词
./view-logs.sh -s "user login"

# 查看指定日期
./view-logs.sh -d 2025-12-16

# 列出所有日志文件
./view-logs.sh -l

# 清理7天前的日志
./view-logs.sh -c
```

### 手动查看

```bash
# 实时查看
tail -f ../logs/app-development-2025-12-16.log

# 查看错误
grep '"level":"error"' ../logs/app-development-2025-12-16.log

# 查看特定用户的请求
grep '"username":"admin"' ../logs/app-development-2025-12-16.log

# 查看特定接口
grep '"/api/system/user"' ../logs/app-development-2025-12-16.log
```

### 使用 jq 格式化 JSON 日志

```bash
# 安装 jq (如果未安装)
brew install jq

# 美化查看
tail -f ../logs/app-development-2025-12-16.log | jq '.'

# 只看错误消息
grep '"level":"error"' ../logs/app-development-2025-12-16.log | jq '.msg, .err'

# 查看请求详情
grep 'POST' ../logs/app-development-2025-12-16.log | jq '{method: .req.method, url: .req.url, status: .res.statusCode}'
```

## 调试技巧

### 1. 追踪请求链路

使用 `requestId` 追踪完整请求:

```bash
# 获取某个请求的 requestId
grep "/api/system/user/add" ../logs/app-development-2025-12-16.log | jq '.requestId'

# 查看该请求的所有日志
grep '"requestId":"xxx-xxx-xxx"' ../logs/app-development-2025-12-16.log
```

### 2. 分析错误模式

```bash
# 统计错误类型
grep '"level":"error"' ../logs/app-development-2025-12-16.log | jq '.err.type' | sort | uniq -c

# 查看最近的错误
grep '"level":"error"' ../logs/app-development-2025-12-16.log | tail -10 | jq '.'
```

### 3. 性能分析

```bash
# 查看慢请求 (假设响应时间在日志中)
jq 'select(.responseTime > 1000)' ../logs/app-development-2025-12-16.log
```

### 4. 多租户调试

```bash
# 查看特定租户的请求
grep '"tenantId":"000000"' ../logs/app-development-2025-12-16.log
```

## 常见问题

### Q: 日志文件太大怎么办?

A: 使用清理脚本:
```bash
./view-logs.sh -c  # 清理7天前的日志
```

### Q: 如何只在控制台输出,不写文件?

A: 修改 `.env.development`:
```bash
LOG_TO_FILE=false
```

### Q: 如何调整日志级别?

A: 修改 `.env.development`:
```bash
LOG_LEVEL=info  # 减少日志量
LOG_LEVEL=trace # 最详细
```

### Q: 控制台输出太多噪音?

A: 添加更多排除路径:
```bash
LOG_EXCLUDE_PATHS=["/health","/metrics","/favicon.ico","/api-docs","/static"]
```

## 最佳实践

1. **使用有意义的日志消息**: 
   ```typescript
   // ❌ 不好
   this.logger.debug('debug');
   
   // ✅ 好
   this.logger.debug(`Creating user with email: ${email}`);
   ```

2. **记录上下文信息**:
   ```typescript
   this.logger.error(
     { userId, tenantId, operation: 'deleteUser' },
     'Failed to delete user',
     error.stack
   );
   ```

3. **避免记录敏感信息**:
   ```typescript
   // ❌ 不要这样
   this.logger.debug({ password: user.password });
   
   // ✅ 使用配置的脱敏功能
   // password 会自动被脱敏
   ```

4. **在关键操作点记录日志**:
   - 外部 API 调用前后
   - 数据库操作
   - 业务逻辑的重要分支
   - 异常捕获处理

5. **使用合适的日志级别**:
   - `debug`: 开发调试信息
   - `info`: 正常业务流程
   - `warn`: 可恢复的错误或警告
   - `error`: 需要关注的错误

## 生产环境注意事项

生产环境配置 (`.env.production`):

```bash
LOG_LEVEL=info
LOG_PRETTY_PRINT=false
LOG_TO_FILE=true
LOG_DIR=/var/log/nest-admin-soybean
```

生产环境日志特点:
- JSON 格式(便于日志收集系统解析)
- info 级别(减少日志量)
- 只写入文件
- 不包含堆栈跟踪(安全考虑)
