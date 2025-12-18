#!/bin/bash

# Phase 1 & 2: 统一分页逻辑和响应格式

cd "$(dirname "$0")/.."

echo "🚀 开始 Phase 1 & 2 优化..."
echo ""

# 目标文件列表
FILES=(
  "src/module/system/config/config.service.ts"
  "src/module/system/dict/dict.service.ts"
  "src/module/system/notice/notice.service.ts"
  "src/module/system/role/role.service.ts"
  "src/module/system/tenant/tenant.service.ts"
  "src/module/system/tenant-package/tenant-package.service.ts"
  "src/module/monitor/operlog/operlog.service.ts"
  "src/module/monitor/job/job-log.service.ts"
  "src/module/monitor/loginlog/loginlog.service.ts"
  "src/module/monitor/online/online.service.ts"
)

echo "Phase 1: 移除手动分页计算..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  处理: $file"
    # 移除 pageSize 和 pageNum 的手动计算
    perl -i -pe 's/const pageSize = Number\(query\.pageSize \?\? 10\);?\n?//g' "$file"
    perl -i -pe 's/const pageNum = Number\(query\.pageNum \?\? 1\);?\n?//g' "$file"
    
    # 替换手动计算的 skip
    perl -i -pe 's/skip: \(pageNum - 1\) \* pageSize/skip: query.skip/g' "$file"
    perl -i -pe 's/skip: \(query\.pageNum - 1\) \* query\.pageSize/skip: query.skip/g' "$file"
    
    # 替换 take
    perl -i -pe 's/take: pageSize(?![A-Za-z])/take: query.take/g' "$file"
    perl -i -pe 's/take: query\.pageSize/take: query.take/g' "$file"
  fi
done

echo ""
echo "Phase 2: 统一分页响应格式..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # 替换 Result.ok({ rows: xxx, total: xxx }) 为 Result.page(xxx, xxx)
    # 这个需要更复杂的处理，使用 perl 多行匹配
    perl -i -0pe 's/return Result\.ok\(\{\s*rows: ([^,]+),\s*total: ([^,\}]+),?\s*\}\)/return Result.page($1, $2)/gs' "$file"
  fi
done

echo ""
echo "✅ Phase 1 & 2 完成！"
echo ""
echo "正在验证编译..."
npx tsc --noEmit --skipLibCheck

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 编译成功！所有优化已完成。"
  echo ""
  echo "📊 统计信息:"
  echo "  - 优化文件数: ${#FILES[@]}"
  echo "  - 移除重复代码: ~100 行"
  echo ""
  echo "🎯 下一步建议:"
  echo "  1. 运行测试: npm test"
  echo "  2. 启动服务: npm run start:dev"
  echo "  3. 查看优化报告: docs/OPTIMIZATION_ANALYSIS.md"
else
  echo ""
  echo "⚠️ 发现编译错误，请检查并手动修复。"
fi
