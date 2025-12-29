#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import { seedAllTestData, cleanupAllTestData, resetTestData } from './index';

/**
 * 命令行工具：管理 E2E 测试种子数据
 * 
 * 用法:
 *   npx ts-node test/seeds/run-seed.ts           # 创建测试数据
 *   npx ts-node test/seeds/run-seed.ts --cleanup # 清理测试数据
 *   npx ts-node test/seeds/run-seed.ts --reset   # 重置测试数据
 */

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const prisma = new PrismaClient();

  try {
    switch (command) {
      case '--cleanup':
        console.log('🧹 清理测试数据...\n');
        await cleanupAllTestData(prisma);
        break;

      case '--reset':
        console.log('🔄 重置测试数据...\n');
        await resetTestData(prisma);
        break;

      case '--help':
      case '-h':
        printHelp();
        break;

      default:
        console.log('🌱 创建测试种子数据...\n');
        await seedAllTestData(prisma);
        break;
    }
  } catch (error) {
    console.error('\n❌ 操作失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function printHelp() {
  console.log(`
E2E 测试种子数据管理工具

用法:
  npx ts-node test/seeds/run-seed.ts [选项]

选项:
  (无)        创建测试种子数据
  --cleanup   清理所有测试数据
  --reset     重置测试数据（先清理再创建）
  --help, -h  显示此帮助信息

示例:
  # 创建测试数据
  npx ts-node test/seeds/run-seed.ts

  # 清理测试数据
  npx ts-node test/seeds/run-seed.ts --cleanup

  # 重置测试数据
  npx ts-node test/seeds/run-seed.ts --reset
`);
}

// 执行主函数
main();
