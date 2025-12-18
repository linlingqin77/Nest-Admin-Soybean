#!/bin/bash

# 批量修复 Service 层分页代码的脚本

echo "开始修复 Service 层分页代码..."

# 1. 替换 pageSize 和 pageNum 的计算
find src/module -name "*.service.ts" -type f -exec sed -i '' \
  -e 's/const pageSize = Number(query\.pageSize ?? [0-9]\+);/\/\/ 使用 query.take 代替/g' \
  -e 's/const pageNum = Number(query\.pageNum ?? [0-9]\+);/\/\/ 使用 query.skip 代替/g' \
  -e 's/const take = Number(query\.pageSize ?? [0-9]\+);/\/\/ 使用 query.take 代替/g' \
  -e 's/const skip = take \* (Number(query\.pageNum ?? [0-9]\+) - [0-9]\+);/\/\/ 使用 query.skip 代替/g' \
  -e 's/const skip = pageSize \* (pageNum - [0-9]\+);/\/\/ 使用 query.skip 代替/g' \
  {} \;

# 2. 替换 skip 和 take 的使用
find src/module -name "*.service.ts" -type f -exec sed -i '' \
  -e 's/skip: skip,/skip: query.skip,/g' \
  -e 's/take: take,/take: query.take,/g' \
  -e 's/skip: pageSize \* (pageNum - 1),/skip: query.skip,/g' \
  -e 's/take: pageSize,/take: query.take,/g' \
  {} \;

echo "修复完成！请运行 'npx tsc --noEmit' 检查编译错误"
