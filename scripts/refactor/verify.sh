#!/bin/bash
# Refactor Verify Script
# Runs all checks after refactoring

set -e

echo "=== Refactor Verification ==="
echo ""

cd /Users/mac/Documents/project/nest-admin

echo "[1/4] Build check..."
cd apps/server
pnpm build 2>&1 | tail -10
cd ../..

echo ""
echo "[2/4] Typecheck (via build)..."

echo ""
echo "[3/4] Circular dependency check..."
npx madge --circular --extensions ts apps/server/src/ 2>&1 | tail -10

echo ""
echo "[4/4] Unused files check..."
npx tsx scripts/refactor/check-unused.ts 2>&1 | tail -20

echo ""
echo "✅ All checks complete."
