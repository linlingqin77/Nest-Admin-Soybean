# 企业级请求日志和监控系统

## 📋 已实现功能

### 1. Pino 高性能日志系统
- ✅ 自动记录所有 HTTP 请求
- ✅ JSON 格式日志 (生产) / 彩色格式 (开发)
- ✅ 自动敏感数据脱敏
- ✅ 自定义日志级别和排除路径

### 2. Request ID 追踪
- ✅ 每个请求自动生成唯一 UUID
- ✅ 响应头携带 `X-Request-ID`
- ✅ 日志中关联 Request ID

### 3. 健康检查
- ✅ `/api/health` - 综合健康检查
- ✅ `/api/health/liveness` - Kubernetes 存活探针
- ✅ `/api/health/readiness` - Kubernetes 就绪探针
- ✅ 检查 PostgreSQL、Redis、内存、磁盘

### 4. Prometheus 指标监控
- ✅ `/api/metrics` - Prometheus 指标端点
- ✅ 自动收集 HTTP 请求指标
- ✅ 自动收集系统指标 (CPU/内存/Node.js)
- ✅ 自定义业务指标 (登录、操作日志)

---

## 🚀 快速开始

### 1. 启动服务

```bash
cd server
pnpm run start:dev
```

### 2. 验证功能

#### 健康检查
```bash
# 综合健康检查
curl http://localhost:8080/api/health

# 存活探针
curl http://localhost:8080/api/health/liveness

# 就绪探针
curl http://localhost:8080/api/health/readiness
```

#### Prometheus 指标
```bash
curl http://localhost:8080/api/metrics
```

#### 查看日志
- 开发环境: 日志输出到控制台 (彩色格式)
- 生产环境: 日志输出到 `/var/log/nest-admin/` (JSON 格式)

---

## ⚙️ 配置说明

### 环境变量 (.env.development / .env.production)

```bash
# 日志级别: debug | info | warn | error
LOG_LEVEL=debug

# 是否使用彩色输出 (开发环境建议 true)
LOG_PRETTY_PRINT=true

# 日志目录
LOG_DIR=../logs

# 排除路径 (JSON 数组)
LOG_EXCLUDE_PATHS=["/health","/metrics","/favicon.ico"]

# 敏感字段 (JSON 数组)
LOG_SENSITIVE_FIELDS=["password","token","authorization"]
```

---

## 📊 日志示例

### 开发环境 (彩色输出)
```
[10:30:15.234] INFO (12345): POST /api/auth/login completed
    requestId: "550e8400-e29b-41d4-a716-446655440000"
    tenantId: "000000"
    username: "admin"
    responseTime: 245
```

### 生产环境 (JSON)
```json
{
  "level": "info",
  "time": 1702707015234,
  "pid": 12345,
  "hostname": "nest-admin-server",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "000000",
  "userId": 1,
  "username": "admin",
  "req": {
    "method": "POST",
    "url": "/api/auth/login",
    "body": {
      "username": "admin",
      "password": "***REDACTED***"
    }
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 245,
  "msg": "POST /api/auth/login completed"
}
```

---

## 🔧 Kubernetes 集成

### Deployment 配置

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nest-admin
spec:
  containers:
  - name: server
    image: nest-admin:latest
    ports:
    - containerPort: 8080
    # 存活探针
    livenessProbe:
      httpGet:
        path: /api/health/liveness
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    # 就绪探针
    readinessProbe:
      httpGet:
        path: /api/health/readiness
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
```

---

## 📈 Prometheus + Grafana 监控

### 1. Prometheus 配置

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'nest-admin'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/api/metrics'
```

### 2. 启动 Prometheus

```bash
docker run -d \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### 3. 启动 Grafana

```bash
docker run -d \
  -p 3000:3000 \
  grafana/grafana
```

### 4. 配置 Grafana
1. 访问 http://localhost:3000 (admin/admin)
2. 添加 Prometheus 数据源: http://localhost:9090
3. 导入仪表盘或创建自定义面板

---

## 📦 已安装的依赖

```json
{
  "nestjs-pino": "^4.5.0",
  "pino-http": "^11.0.0",
  "pino-pretty": "^13.1.3",
  "nestjs-cls": "^6.1.0",
  "@nestjs/terminus": "^11.0.0",
  "@willsoto/nestjs-prometheus": "^6.0.2",
  "prom-client": "^15.1.3"
}
```

---

## 🎯 核心特性

### 自动功能
- ✅ 所有 HTTP 请求自动记录
- ✅ 敏感数据自动脱敏
- ✅ Request ID 自动生成和追踪
- ✅ 租户 ID、用户 ID 自动关联
- ✅ 响应时间自动计算
- ✅ 错误自动捕获和记录

### 性能优化
- ✅ Pino 是最快的 Node.js 日志库
- ✅ 异步日志写入,不阻塞请求
- ✅ 可配置的排除路径
- ✅ 生产环境 JSON 格式,便于解析

### 企业级功能
- ✅ Kubernetes 健康检查
- ✅ Prometheus 指标收集
- ✅ 多租户日志隔离
- ✅ 完整的审计追踪

---

## 🔍 故障排查

### 查看实时日志
```bash
# 开发环境 (控制台)
pnpm run start:dev

# 生产环境 (文件)
tail -f /var/log/nest-admin/app.log
```

### 过滤特定请求
```bash
# 使用 jq 过滤 JSON 日志
cat app.log | jq 'select(.requestId == "550e8400-e29b-41d4-a716-446655440000")'
```

### 查看错误日志
```bash
cat app.log | jq 'select(.level == "error")'
```

---

## 📚 相关文档

- [Pino 官方文档](https://getpino.io/)
- [NestJS Terminus 健康检查](https://docs.nestjs.com/recipes/terminus)
- [Prometheus 官方文档](https://prometheus.io/)
- [Grafana 官方文档](https://grafana.com/)

---

## ✅ 验证清单

启动服务后,验证以下端点:

- [ ] `http://localhost:8080/api/health` - 返回健康状态
- [ ] `http://localhost:8080/api/health/liveness` - 返回 OK
- [ ] `http://localhost:8080/api/health/readiness` - 返回 OK  
- [ ] `http://localhost:8080/api/metrics` - 返回 Prometheus 指标
- [ ] 控制台显示彩色日志
- [ ] 每个请求都有唯一的 Request ID
- [ ] 敏感字段已被脱敏 (password 显示为 ***REDACTED***)

---

🎉 企业级请求日志和监控系统已完整实现!
