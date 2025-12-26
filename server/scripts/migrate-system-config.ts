import { PrismaClient } from '@prisma/client';

/**
 * 系统配置表迁移脚本
 * 
 * 功能：
 * 1. 创建 sys_system_config 表
 * 2. 从 sys_config 表迁移 tenant_id='000000' 的配置到新表
 */
async function migrate() {
  const prisma = new PrismaClient();

  try {
    console.log('开始迁移系统配置表...\n');

    console.log('1. 创建 sys_system_config 表...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "sys_system_config" (
        "config_id" SERIAL NOT NULL,
        "config_name" VARCHAR(100) NOT NULL,
        "config_key" VARCHAR(100) NOT NULL,
        "config_value" VARCHAR(500) NOT NULL,
        "config_type" CHAR(1) NOT NULL,
        "create_by" VARCHAR(64) NOT NULL DEFAULT '',
        "create_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
        "update_by" VARCHAR(64) NOT NULL DEFAULT '',
        "update_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
        "remark" VARCHAR(500),
        "status" CHAR(1) NOT NULL DEFAULT '0',
        "del_flag" CHAR(1) NOT NULL DEFAULT '0',
        CONSTRAINT "sys_system_config_pkey" PRIMARY KEY ("config_id")
      )
    `);

    console.log('2. 创建唯一索引...');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "sys_system_config_config_key_key" 
      ON "sys_system_config"("config_key")
    `);

    console.log('3. 创建普通索引...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "sys_system_config_status_idx" 
      ON "sys_system_config"("status")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "sys_system_config_config_type_idx" 
      ON "sys_system_config"("config_type")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "sys_system_config_del_flag_status_idx" 
      ON "sys_system_config"("del_flag", "status")
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "sys_system_config_create_time_idx" 
      ON "sys_system_config"("create_time")
    `);

    console.log('4. 迁移超级租户配置数据...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO "sys_system_config" (
        "config_name",
        "config_key",
        "config_value",
        "config_type",
        "create_by",
        "create_time",
        "update_by",
        "update_time",
        "remark",
        "status",
        "del_flag"
      )
      SELECT 
        "config_name",
        "config_key",
        "config_value",
        "config_type",
        "create_by",
        "create_time",
        "update_by",
        "update_time",
        "remark",
        "status",
        "del_flag"
      FROM "sys_config"
      WHERE "tenant_id" = '000000'
      ON CONFLICT ("config_key") DO NOTHING
    `);

    console.log('\n✅ 迁移成功完成！');
    console.log('\n验证数据...');

    // 验证数据
    const systemConfigs = await prisma.$queryRaw`
      SELECT config_key, config_value 
      FROM sys_system_config 
      WHERE del_flag = '0'
    `;

    console.log(`\n系统配置表记录数: ${(systemConfigs as any[]).length}`);
    console.log('\n前5条记录:');
    (systemConfigs as any[]).slice(0, 5).forEach((config: any) => {
      console.log(`  - ${config.config_key}: ${config.config_value}`);
    });

  } catch (error) {
    console.error('\n❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
