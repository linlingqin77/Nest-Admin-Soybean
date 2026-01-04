/**
 * 部门模块集成测试
 *
 * @description
 * 测试部门模块的完整流程，包括部门树形结构、子部门删除限制
 * 使用真实的数据库和Redis连接
 *
 * _Requirements: 5.1, 5.6_
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeptService } from 'src/module/system/dept/dept.service';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';

describe('Dept Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let deptService: DeptService;

  // Test data tracking
  const createdDeptIds: number[] = [];

  // Test tenant
  const testTenantId = '000000';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure app similar to main.ts
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
    deptService = app.get(DeptService);
  }, 60000);

  afterAll(async () => {
    // Cleanup test data in reverse order of dependencies
    try {
      // Delete departments (children first, then parents)
      if (createdDeptIds.length > 0) {
        // Sort by ID descending to delete children first
        const sortedIds = [...createdDeptIds].sort((a, b) => b - a);
        for (const deptId of sortedIds) {
          await prisma.sysDept.delete({
            where: { deptId },
          }).catch(() => {
            // Ignore if already deleted
          });
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }

    await app.close();
  });

  /**
   * Helper function to create a test department
   */
  async function createTestDept(data: Partial<{
    deptName: string;
    parentId: number;
    ancestors: string;
    orderNum: number;
    leader: string;
    phone: string;
    email: string;
    status: string;
  }> = {}) {
    const timestamp = Date.now();

    const dept = await prisma.sysDept.create({
      data: {
        tenantId: testTenantId,
        deptName: data.deptName || `测试部门_${timestamp}`,
        parentId: data.parentId || 0,
        ancestors: data.ancestors || '0',
        orderNum: data.orderNum || 1,
        leader: data.leader || '',
        phone: data.phone || '',
        email: data.email || '',
        status: data.status || StatusEnum.NORMAL,
        delFlag: DelFlagEnum.NORMAL,
        createBy: 'test',
        updateBy: 'test',
      },
    });

    createdDeptIds.push(dept.deptId);
    return dept;
  }

  describe('Department Tree Structure Integration', () => {
    it('should return tree structure with parent-child relationships', async () => {
      // Create parent department
      const parentDept = await createTestDept({
        deptName: '树结构父部门',
        parentId: 0,
        ancestors: '0',
      });

      // Create child department
      const childDept = await createTestDept({
        deptName: '树结构子部门',
        parentId: parentDept.deptId,
        ancestors: `0,${parentDept.deptId}`,
      });

      // Get department tree
      const tree = await deptService.deptTree();

      expect(Array.isArray(tree)).toBe(true);
      
      // Find our parent in the tree
      const findDeptInTree = (nodes: any[], deptId: number): any => {
        for (const node of nodes) {
          if (node.id === deptId) return node;
          if (node.children && node.children.length > 0) {
            const found = findDeptInTree(node.children, deptId);
            if (found) return found;
          }
        }
        return null;
      };

      const parentNode = findDeptInTree(tree, parentDept.deptId);
      expect(parentNode).toBeDefined();
      
      // Child should be in parent's children
      if (parentNode && parentNode.children) {
        const childNode = parentNode.children.find((c: any) => c.id === childDept.deptId);
        expect(childNode).toBeDefined();
      }
    });

    it('should return department list with correct tree data', async () => {
      const result = await deptService.findAll({});

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      
      // Each department should have required fields
      if (result.data.length > 0) {
        const dept = result.data[0];
        expect(dept).toHaveProperty('deptId');
        expect(dept).toHaveProperty('deptName');
        expect(dept).toHaveProperty('parentId');
        expect(dept).toHaveProperty('ancestors');
      }
    });

    it('should correctly build ancestors chain when creating nested departments', async () => {
      // Create root department
      const rootDept = await createTestDept({
        deptName: '祖先链根部门',
        parentId: 0,
        ancestors: '0',
      });

      // Create level 1 child using service
      const level1Result = await deptService.create({
        deptName: '祖先链一级部门',
        parentId: rootDept.deptId,
        orderNum: 1,
      } as any);

      expect(level1Result.code).toBe(200);

      // Find the created department
      const level1Dept = await prisma.sysDept.findFirst({
        where: {
          deptName: '祖先链一级部门',
          parentId: rootDept.deptId,
        },
      });

      expect(level1Dept).toBeDefined();
      if (level1Dept) {
        createdDeptIds.push(level1Dept.deptId);
        expect(level1Dept.ancestors).toContain(rootDept.deptId.toString());

        // Create level 2 child
        const level2Result = await deptService.create({
          deptName: '祖先链二级部门',
          parentId: level1Dept.deptId,
          orderNum: 1,
        } as any);

        expect(level2Result.code).toBe(200);

        const level2Dept = await prisma.sysDept.findFirst({
          where: {
            deptName: '祖先链二级部门',
            parentId: level1Dept.deptId,
          },
        });

        if (level2Dept) {
          createdDeptIds.push(level2Dept.deptId);
          // Ancestors should contain both root and level1
          expect(level2Dept.ancestors).toContain(rootDept.deptId.toString());
          expect(level2Dept.ancestors).toContain(level1Dept.deptId.toString());
        }
      }
    });

    it('should return departments ordered by orderNum', async () => {
      // Create departments with different order numbers
      const dept1 = await createTestDept({
        deptName: '排序测试部门3',
        orderNum: 3,
      });
      const dept2 = await createTestDept({
        deptName: '排序测试部门1',
        orderNum: 1,
      });
      const dept3 = await createTestDept({
        deptName: '排序测试部门2',
        orderNum: 2,
      });

      const result = await deptService.findAll({});

      expect(result.code).toBe(200);
      
      // Find our test departments in the result
      const testDepts = result.data.filter((d: any) => 
        [dept1.deptId, dept2.deptId, dept3.deptId].includes(d.deptId)
      );

      // They should be ordered by orderNum
      if (testDepts.length === 3) {
        const orderNums = testDepts.map((d: any) => d.orderNum);
        const sortedOrderNums = [...orderNums].sort((a, b) => a - b);
        expect(orderNums).toEqual(sortedOrderNums);
      }
    });
  });

  describe('Child Department Delete Restriction Integration', () => {
    it('should allow deleting department without children', async () => {
      // Create a standalone department
      const dept = await createTestDept({
        deptName: '无子部门删除测试',
      });

      // Delete should succeed
      const result = await deptService.remove(dept.deptId);
      expect(result.code).toBe(200);

      // Verify soft delete
      const deletedDept = await prisma.sysDept.findUnique({
        where: { deptId: dept.deptId },
      });
      expect(deletedDept?.delFlag).toBe(DelFlagEnum.DELETE);

      // Remove from tracking since it's deleted
      const index = createdDeptIds.indexOf(dept.deptId);
      if (index > -1) {
        createdDeptIds.splice(index, 1);
      }
    });

    it('should get child department IDs correctly', async () => {
      // Create parent department
      const parentDept = await createTestDept({
        deptName: '子部门ID测试父',
        parentId: 0,
        ancestors: '0',
      });

      // Create child departments
      const child1 = await createTestDept({
        deptName: '子部门ID测试子1',
        parentId: parentDept.deptId,
        ancestors: `0,${parentDept.deptId}`,
      });

      const child2 = await createTestDept({
        deptName: '子部门ID测试子2',
        parentId: parentDept.deptId,
        ancestors: `0,${parentDept.deptId}`,
      });

      // Get child department IDs
      const childIds = await deptService.getChildDeptIds(parentDept.deptId);

      expect(Array.isArray(childIds)).toBe(true);
      expect(childIds).toContain(parentDept.deptId);
      expect(childIds).toContain(child1.deptId);
      expect(childIds).toContain(child2.deptId);
    });

    it('should exclude specified department and its children in findListExclude', async () => {
      // Create parent department
      const parentDept = await createTestDept({
        deptName: '排除测试父部门',
        parentId: 0,
        ancestors: '0',
      });

      // Create child department
      const childDept = await createTestDept({
        deptName: '排除测试子部门',
        parentId: parentDept.deptId,
        ancestors: `0,${parentDept.deptId}`,
      });

      // Get list excluding parent
      const result = await deptService.findListExclude(parentDept.deptId);

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);

      // Parent should not be in the list
      const parentInList = result.data.find((d: any) => d.deptId === parentDept.deptId);
      expect(parentInList).toBeUndefined();

      // Child should not be in the list (it's a descendant)
      const childInList = result.data.find((d: any) => d.deptId === childDept.deptId);
      expect(childInList).toBeUndefined();
    });
  });

  describe('Department Option Select Integration', () => {
    it('should return only active departments in option select', async () => {
      // Create active department
      const activeDept = await createTestDept({
        deptName: '选项测试启用部门',
        status: StatusEnum.NORMAL,
      });

      // Create disabled department
      const disabledDept = await createTestDept({
        deptName: '选项测试禁用部门',
        status: StatusEnum.STOP,
      });

      const result = await deptService.optionselect();

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);

      // Active department should be in the list
      const activeInList = result.data.find((d: any) => d.deptId === activeDept.deptId);
      expect(activeInList).toBeDefined();

      // Disabled department should not be in the list
      const disabledInList = result.data.find((d: any) => d.deptId === disabledDept.deptId);
      expect(disabledInList).toBeUndefined();
    });
  });

  describe('Department Filter Integration', () => {
    it('should filter departments by name', async () => {
      const uniqueName = `过滤测试部门_${Date.now()}`;
      await createTestDept({
        deptName: uniqueName,
      });

      const result = await deptService.findAll({ deptName: uniqueName } as any);

      expect(result.code).toBe(200);
      expect(result.data.length).toBeGreaterThanOrEqual(1);
      expect(result.data.some((d: any) => d.deptName === uniqueName)).toBe(true);
    });

    it('should filter departments by status', async () => {
      const result = await deptService.findAll({ status: StatusEnum.NORMAL } as any);

      expect(result.code).toBe(200);
      expect(Array.isArray(result.data)).toBe(true);
      
      // All returned departments should have normal status
      result.data.forEach((dept: any) => {
        expect(dept.status).toBe(StatusEnum.NORMAL);
      });
    });
  });

  describe('Department Update Integration', () => {
    it('should update department and recalculate ancestors when parent changes', async () => {
      // Create two parent departments
      const parent1 = await createTestDept({
        deptName: '更新测试父1',
        parentId: 0,
        ancestors: '0',
      });

      const parent2 = await createTestDept({
        deptName: '更新测试父2',
        parentId: 0,
        ancestors: '0',
      });

      // Create child under parent1
      const child = await createTestDept({
        deptName: '更新测试子部门',
        parentId: parent1.deptId,
        ancestors: `0,${parent1.deptId}`,
      });

      // Move child to parent2
      const result = await deptService.update({
        deptId: child.deptId,
        deptName: '更新测试子部门',
        parentId: parent2.deptId,
        orderNum: 1,
      } as any);

      expect(result.code).toBe(200);

      // Verify ancestors updated
      const updatedChild = await prisma.sysDept.findUnique({
        where: { deptId: child.deptId },
      });

      expect(updatedChild?.parentId).toBe(parent2.deptId);
      expect(updatedChild?.ancestors).toContain(parent2.deptId.toString());
    });
  });
});
