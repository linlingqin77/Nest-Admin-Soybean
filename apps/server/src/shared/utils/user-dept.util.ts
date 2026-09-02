import { SysDept, SysUser } from '@prisma/client';

/**
 * 附加部门信息的用户类型
 */
export type UserWithDept = SysUser & { dept?: SysDept | null };

/**
 * 最小化的 Prisma 客户端接口（兼容 PrismaService 和事务客户端）
 */
export interface DeptLookupClient {
  sysDept: {
    findMany: (args: { where: { deptId: { in: number[] }; delFlag: string } }) => Promise<SysDept[]>;
  };
}

/**
 * 为用户列表附加部门信息
 *
 * 通过批量查询避免 N+1 问题。该函数仅依赖 Prisma 客户端的最小接口，
 * 因此可以同时在普通 Prisma 上下文和事务（txHost.tx）上下文中使用。
 */
export async function attachDeptInfo(prisma: DeptLookupClient, users: SysUser[]): Promise<UserWithDept[]> {
  if (!users.length) {
    return users;
  }
  const deptIds = Array.from(
    new Set(
      users
        .map((item) => item.deptId)
        .filter((deptId): deptId is number => typeof deptId === 'number' && !Number.isNaN(deptId)),
    ),
  );
  if (!deptIds.length) {
    return users;
  }
  const depts = await prisma.sysDept.findMany({
    where: {
      deptId: { in: deptIds },
      delFlag: '0',
    },
  });
  const deptMap = new Map<number, SysDept>(depts.map((dept) => [dept.deptId, dept]));
  return users.map((item) => ({
    ...item,
    dept: deptMap.get(item.deptId ?? -1) ?? null,
  }));
}
