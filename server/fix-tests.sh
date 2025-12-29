#!/bin/bash

# Script to fix common test issues

echo "Fixing test files..."

# Fix Status.DISABLE to Status.DISABLED
find src -name "*.spec.ts" -type f -exec sed -i 's/Status\.DISABLE/Status.DISABLED/g' {} +

echo "Fixed Status.DISABLE -> Status.DISABLED"

# Fix MockServiceFactory.createPrismaService() to createPrismaMock()
find src -name "*.spec.ts" -type f -exec sed -i 's/MockServiceFactory\.createPrismaService()/createPrismaMock()/g' {} +

echo "Fixed MockServiceFactory.createPrismaService() -> createPrismaMock()"

# Fix MockServiceFactory.createRedisService() to manual mock
find src -name "*.spec.ts" -type f -exec sed -i 's/MockServiceFactory\.createRedisService()/{ get: jest.fn(), set: jest.fn(), del: jest.fn(), keys: jest.fn() }/g' {} +

echo "Fixed MockServiceFactory.createRedisService()"

echo "Done! Please review changes and run tests."
