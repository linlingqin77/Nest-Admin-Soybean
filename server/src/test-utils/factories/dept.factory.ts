import { SysDept, Status, DelFlag } from '@prisma/client';
import { BaseFactory } from './base.factory';

/**
 * 部门测试数据工厂
 * 
 * @description
 * 提供创建 SysDept 测试数据的方法
 * 
 * @example
 * ```typescript
 * const dept = DeptFactory.create({ deptName: 'IT部门' });
 * const depts = DeptFactory.createMany(5);
 * ```
 */
export class DeptFactory extends BaseFactory<SysDept> {
  protected getDefaults(): SysDept {
    return {
      deptId: 100,
      tenantId: '000000',
      parentId: 0,
      ancestors: '0',
      deptName: '测试部门',
      orderNum: 1,
      leader: '张三',
      phone: '13800138000',
      email: 'dept@example.com',
      status: Status.NORMAL,
      delFlag: DelFlag.NORMAL,
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
    };
  }

  protected getSequentialOverrides(index: number): Partial<SysDept> {
    return {
      deptId: 100 + index,
      deptName: `测试部门${index + 1}`,
      orderNum: index + 1,
      leader: `领导${index + 1}`,
      phone: `1380013800${index}`,
      email: `dept${index + 1}@example.com`,
    };
  }

  /**
   * 创建根部门
   */
  static createRootDept(overrides?: Partial<SysDept>): SysDept {
    const factory = new DeptFactory();
    return factory.create({
      deptId: 100,
      parentId: 0,
      ancestors: '0',
      deptName: '根部门',
      ...overrides,
    });
  }

  /**
   * 创建子部门
   */
  static createChildDept(parentId: number, overrides?: Partial<SysDept>): SysDept {
    const factory = new DeptFactory();
    return factory.create({
      parentId,
      ancestors: `0,${parentId}`,
      ...overrides,
    });
  }

  /**
   * 创建部门树
   * 
   * @param depth 树的深度
   * @param childrenPerLevel 每层的子节点数量
   */
  static createTree(depth: number = 2, childrenPerLevel: number = 3): SysDept[] {
    const factory = new DeptFactory();
    const depts: SysDept[] = [];
    let currentId = 100;

    // 创建根部门
    const root = factory.create({
      deptId: currentId++,
      parentId: 0,
      ancestors: '0',
      deptName: '根部门',
    });
    depts.push(root);

    // 递归创建子部门
    const createChildren = (parent: SysDept, currentDepth: number) => {
      if (currentDepth >= depth) return;

      for (let i = 0; i < childrenPerLevel; i++) {
        const child = factory.create({
          deptId: currentId++,
          parentId: parent.deptId,
          ancestors: `${parent.ancestors},${parent.deptId}`,
          deptName: `${parent.deptName}-子部门${i + 1}`,
        });
        depts.push(child);
        createChildren(child, currentDepth + 1);
      }
    };

    createChildren(root, 1);
    return depts;
  }

  /**
   * 创建单个部门（静态方法）
   */
  static create(overrides?: Partial<SysDept>): SysDept {
    const factory = new DeptFactory();
    return factory.create(overrides);
  }

  /**
   * 批量创建部门（静态方法）
   */
  static createMany(count: number, overrides?: Partial<SysDept>): SysDept[] {
    const factory = new DeptFactory();
    return factory.createMany(count, overrides);
  }

  /**
   * 创建带关联的部门（静态方法）
   */
  static createWithRelations(relations: Record<string, any>): SysDept {
    const factory = new DeptFactory();
    return factory.createWithRelations(relations);
  }
}
