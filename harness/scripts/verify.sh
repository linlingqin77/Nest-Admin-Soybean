# Agent Harness Scripts

## verify.sh

主验证脚本，在每次 commit 前必须跑：

```bash
#!/bin/bash
set -e

echo "=== Running pre-commit checks ==="

cd "$(dirname "$0")/.."

echo "1. Checking generated files..."
pnpm harness:check-generated
if [ $? -ne 0 ]; then
  echo "❌ Generated files have been modified manually"
  exit 1
fi

echo "2. Checking architecture boundaries..."
pnpm harness:check-boundaries
if [ $? -ne 0 ]; then
  echo "❌ Architecture boundary violations found"
  exit 1
fi

echo "3. Running lint..."
pnpm lint
if [ $? -ne 0 ]; then
  echo "❌ Lint failed"
  exit 1
fi

echo "4. Running type check..."
pnpm typecheck
if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi

echo "5. Running tests..."
pnpm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

echo "6. Building..."
pnpm build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo ""
echo "✅ All checks passed!"
exit 0
```

## check-generated.ts

检查 generated 文件是否被手改：

```typescript
#!/usr/bin/env ts-node
import { readFileSync } from 'fs';
import { join } from 'path';

const RULES_FILE = join(__dirname, '../rules/generated-files.json');
const rules = JSON.parse(readFileSync(RULES_FILE, 'utf-8'));

// TODO: 实现检查逻辑
console.log('Checking generated files...');
```

## check-boundaries.ts

检查架构边界违规：

```typescript
#!/usr/bin/env ts-node
// 检查规则：
// 1. Controller 不能直接 import @prisma/client 或 PrismaService
// 2. 模块之间不能直接 import *.repository
// 3. core/ 不能 import modules/

// TODO: 实现检查逻辑
console.log('Checking architecture boundaries...');
```
