#!/bin/bash

# 快速修复 BusinessException.throwIf(true, ...) 的错误调用

cd "$(dirname "$0")/.."

echo "修复 BusinessException.throwIf(true, ...) 调用..."

# 将 BusinessException.throwIf(true, 'message') 替换为 throw new BusinessException(ResponseCode.BUSINESS_ERROR, 'message')
find src/module -type f -name "*.service.ts" -exec perl -i -pe "s/BusinessException\.throwIf\(true, '([^']+)'\)/throw new BusinessException(ResponseCode.BUSINESS_ERROR, '\$1')/g" {} \;

# 将 BusinessException.throwIf(true, 'message', ResponseCode.XXX) 替换为 throw new BusinessException(ResponseCode.XXX, 'message')
find src/module -type f -name "*.service.ts" -exec perl -i -pe "s/BusinessException\.throwIf\(true, '([^']+)', (ResponseCode\.[A-Z_]+)\)/throw new BusinessException(\$2, '\$1')/g" {} \;

# 将 BusinessException.throwIf(true, "message") 替换为 throw new BusinessException(ResponseCode.BUSINESS_ERROR, "message")
find src/module -type f -name "*.service.ts" -exec perl -i -pe 's/BusinessException\.throwIf\(true, "([^"]+)"\)/throw new BusinessException(ResponseCode.BUSINESS_ERROR, "$1")/g' {} \;

# 将 BusinessException.throwIf(true, `message`) 替换为 throw new BusinessException(ResponseCode.BUSINESS_ERROR, `message`)
find src/module -type f -name "*.service.ts" -exec perl -i -pe 's/BusinessException\.throwIf\(true, `([^`]+)`\)/throw new BusinessException(ResponseCode.BUSINESS_ERROR, `$1`)/g' {} \;

echo "修复完成！正在检查编译..."
npx tsc --noEmit --skipLibCheck

echo ""
echo "如果还有错误，请手动检查以下文件:"
grep -r "BusinessException\.throwIf(true" src/module --include="*.service.ts" | cut -d: -f1 | sort -u || echo "所有 throwIf(true) 已修复！"
