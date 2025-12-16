# 日志配置已完成 ✅

## 已实现的功能

### 1. 双输出模式
- ✅ **控制台输出**: 彩色美化输出,便于实时查看调试
- ✅ **文件输出**: JSON 格式日志,便于后续分析和追踪

### 2. 日志位置
- 日志目录: `/Users/mac/Documents/project/nest-admin/logs/`
- 日志文件: `app-development-2025-12-16.log` (按日期自动创建)

### 3. 增强的日志信息
每个HTTP请求自动记录:
- ✅ 请求ID (唯一追踪)
- ✅ 租户ID
- ✅ 用户ID和用户名
- ✅ 请求方法和URL
- ✅ 请求参数 (query, params, body)
- ✅ 请求头 (包括tenant-id, encrypted等)
- ✅ 响应状态码
- ✅ IP地址
- ✅ User-Agent

### 4. 错误信息增强
- ✅ 完整的错误堆栈 (仅开发环境)
- ✅ 错误类型和代码
- ✅ 错误响应详情

### 5. 敏感信息自动脱敏
自动隐藏以下字段:
- password, passwd, pwd
- token, accessToken, refreshToken
- authorization
- cookie
- secret, secretKey, apiKey

## 快速使用

### npm 脚本
```bash
# 实时查看日志
npm run logs:view

# 只看错误
npm run logs:error

# 只看警告
npm run logs:warn

# 列出所有日志
npm run logs:list

# 清理旧日志
npm run logs:clean
```

### 命令行工具
```bash
cd server/scripts

# 实时查看(带参数)
./view-logs.sh -t 100

# 搜索关键词
./view-logs.sh -s "login"

# 查看指定日期
./view-logs.sh -d 2025-12-16
```

### 手动查看
```bash
# 实时跟踪
tail -f ../logs/app-development-2025-12-16.log

# 美化JSON输出 (需要jq)
tail -f ../logs/app-development-2025-12-16.log | jq '.'

# 只看错误
grep '"level":"error"' ../logs/app-development-2025-12-16.log | jq '.'
```

## 调试示例

### 追踪单个请求
```bash
# 1. 从日志中获取requestId
grep "/api/system/user" ../logs/app-development-2025-12-16.log | jq '.requestId'

# 2. 查看该请求的所有日志
grep '"requestId":"xxxxxxxx"' ../logs/app-development-2025-12-16.log | jq '.'
```

### 查看特定用户操作
```bash
grep '"username":"admin"' ../logs/app-development-2025-12-16.log | jq '{time, method: .req.method, url: .req.url, status: .res.statusCode}'
```

### 分析错误模式
```bash
# 统计错误类型
grep '"level":"error"' ../logs/app-development-2025-12-16.log | jq '.err.type' | sort | uniq -c
```

## 已修复的问题

### 1. ExportTable 异步调用错误
修复了所有导出接口的异步调用问题:
- ✅ 添加了 `await` 关键字
- ✅ 添加了 `return` 语句
- ✅ 修复了响应头重复设置的检查

### 2. 操作日志拦截器兼容性
修复了导出等特殊操作的日志记录问题:
- ✅ 兼容非标准 ResultData 格式的响应
- ✅ 文件下载操作正确记录为成功
- ✅ 避免访问 undefined 的 code 属性

## 配置文件位置

- 环境配置: `server/.env.development`
- 日志配置: `server/src/config/index.ts`
- Pino配置: `server/src/common/logger/pino-logger.config.ts`
- 查看工具: `server/scripts/view-logs.sh`

## 详细文档

查看完整文档: `server/docs/LOCAL_DEVELOPMENT_LOGGING.md`

## 下次启动

服务器已经配置好日志功能,下次启动时会自动:
1. 创建日志目录
2. 按日期生成日志文件
3. 同时输出到控制台和文件
4. 自动脱敏敏感信息

**当前服务器状态**: ✅ 运行中,日志记录正常
