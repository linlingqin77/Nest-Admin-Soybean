import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEnums() {
  try {
    // 查询数据库中的枚举类型
    const result = await prisma.$queryRaw`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder;
    `;
    
    console.log('数据库中的枚举类型:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnums();
