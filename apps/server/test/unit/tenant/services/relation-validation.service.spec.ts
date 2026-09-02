import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  DependencyCheckResult,
  RelationValidationResult,
  RelationValidationService,
} from '@/core/tenancy/services/relation-validation.service';
import { PrismaService } from '@/platform/prisma';
import { TenantContext } from '@/core/tenancy/context/tenant.context';

describe('RelationValidationService', () => {
  let service: RelationValidationService;

  const mockPrismaService = {
    sysTenantPackage: {
      findUnique: jest.fn(),
    },
    sysDept: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    sysRole: {
      findUnique: jest.fn(),
    },
    sysUser: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    sysUserRole: {
      count: jest.fn(),
    },
    sysTenant: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        RelationValidationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = modules.get<RelationValidationService>(RelationValidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validatePackageExists', () => {
    it('应该返回 valid=true 当套餐存在且状态正常', async () => {
      mockPrismaService.sysTenantPackage.findUnique.mockResolvedValue({
        packageId: 1,
        status: '0',
      });

      const result = await service.validatePackageExists(1);

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('应该返回 valid=false 当套餐不存在', async () => {
      mockPrismaService.sysTenantPackage.findUnique.mockResolvedValue(null);

      const result = await service.validatePackageExists(999);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('套餐不存在');
      expect(result.message).toContain('999');
    });

    it('应该返回 valid=false 当套餐已停用', async () => {
      mockPrismaService.sysTenantPackage.findUnique.mockResolvedValue({
        packageId: 1,
        status: '1', // 停用状态
      });

      const result = await service.validatePackageExists(1);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('套餐已停用');
    });
  });

  describe('validateDeptExists', () => {
    it('应该返回 valid=true 当部门存在且状态正常', async () => {
      mockPrismaService.sysDept.findUnique.mockResolvedValue({
        deptId: 100,
        status: '0',
        delFlag: '0',
      });

      const result = await service.validateDeptExists(100);

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('应该返回 valid=false 当部门不存在', async () => {
      mockPrismaService.sysDept.findUnique.mockResolvedValue(null);

      const result = await service.validateDeptExists(999);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('部门不存在');
      expect(result.message).toContain('999');
    });

    it('应该返回 valid=false 当部门已删除', async () => {
      mockPrismaService.sysDept.findUnique.mockResolvedValue({
        deptId: 100,
        status: '0',
        delFlag: '2', // 已删除
      });

      const result = await service.validateDeptExists(100);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('部门已删除');
    });

    it('应该返回 valid=false 当部门已停用', async () => {
      mockPrismaService.sysDept.findUnique.mockResolvedValue({
        deptId: 100,
        status: '1', // 停用状态
        delFlag: '0',
      });

      const result = await service.validateDeptExists(100);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('部门已停用');
    });
  });

  describe('validateRoleExists', () => {
    it('应该返回 valid=true 当角色存在且状态正常', async () => {
      mockPrismaService.sysRole.findUnique.mockResolvedValue({
        roleId: 1,
        status: '0',
        delFlag: '0',
      });

      const result = await service.validateRoleExists(1);

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('应该返回 valid=false 当角色不存在', async () => {
      mockPrismaService.sysRole.findUnique.mockResolvedValue(null);

      const result = await service.validateRoleExists(999);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('角色不存在');
      expect(result.message).toContain('999');
    });

    it('应该返回 valid=false 当角色已删除', async () => {
      mockPrismaService.sysRole.findUnique.mockResolvedValue({
        roleId: 1,
        status: '0',
        delFlag: '2', // 已删除
      });

      const result = await service.validateRoleExists(1);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('角色已删除');
    });

    it('应该返回 valid=false 当角色已停用', async () => {
      mockPrismaService.sysRole.findUnique.mockResolvedValue({
        roleId: 1,
        status: '1', // 停用状态
        delFlag: '0',
      });

      const result = await service.validateRoleExists(1);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('角色已停用');
    });
  });

  describe('validateUserExists', () => {
    it('应该返回 valid=true 当用户存在且未删除', async () => {
      mockPrismaService.sysUser.findUnique.mockResolvedValue({
        userId: 1,
        status: '0',
        delFlag: '0',
      });

      const result = await service.validateUserExists(1);

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('应该返回 valid=false 当用户不存在', async () => {
      mockPrismaService.sysUser.findUnique.mockResolvedValue(null);

      const result = await service.validateUserExists(999);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('用户不存在');
      expect(result.message).toContain('999');
    });

    it('应该返回 valid=false 当用户已删除', async () => {
      mockPrismaService.sysUser.findUnique.mockResolvedValue({
        userId: 1,
        status: '0',
        delFlag: '2', // 已删除
      });

      const result = await service.validateUserExists(1);

      expect(result.valid).toBe(false);
      expect(result.message).toContain('用户已删除');
    });

    it('应该返回 valid=true 当用户已停用但未删除', async () => {
      // 用户停用不影响存在性验证
      mockPrismaService.sysUser.findUnique.mockResolvedValue({
        userId: 1,
        status: '1', // 停用状态
        delFlag: '0',
      });

      const result = await service.validateUserExists(1);

      expect(result.valid).toBe(true);
    });
  });

  describe('validateTenantExists', () => {
    it('应该返回 valid=true 当租户存在且状态正常', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        tenantId: '100001',
        status: '0',
        delFlag: '0',
      });

      const result = await service.validateTenantExists('100001');

      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('应该返回 valid=false 当租户不存在', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue(null);

      const result = await service.validateTenantExists('999999');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('租户不存在');
      expect(result.message).toContain('999999');
    });

    it('应该返回 valid=false 当租户已删除', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        tenantId: '100001',
        status: '0',
        delFlag: '2', // 已删除
      });

      const result = await service.validateTenantExists('100001');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('租户已删除');
    });

    it('应该返回 valid=false 当租户已停用', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue({
        tenantId: '100001',
        status: '1', // 停用状态
        delFlag: '0',
      });

      const result = await service.validateTenantExists('100001');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('租户已停用');
    });
  });

  describe('checkDeptDependencies', () => {
    it('应该返回 hasDependencies=false 当部门没有依赖', async () => {
      mockPrismaService.sysDept.count.mockResolvedValue(0);
      mockPrismaService.sysUser.count.mockResolvedValue(0);

      const result = await service.checkDeptDependencies(100);

      expect(result.hasDependencies).toBe(false);
      expect(result.dependencies).toHaveLength(0);
      expect(result.message).toBeUndefined();
    });

    it('应该返回 hasDependencies=true 当部门有子部门', async () => {
      mockPrismaService.sysDept.count.mockResolvedValue(3);
      mockPrismaService.sysUser.count.mockResolvedValue(0);

      const result = await service.checkDeptDependencies(100);

      expect(result.hasDependencies).toBe(true);
      expect(result.dependencies).toContainEqual({ model: 'SysDept', count: 3 });
      expect(result.message).toContain('部门存在依赖关系');
      expect(result.message).toContain('SysDept(3)');
    });

    it('应该返回 hasDependencies=true 当部门有用户', async () => {
      mockPrismaService.sysDept.count.mockResolvedValue(0);
      mockPrismaService.sysUser.count.mockResolvedValue(5);

      const result = await service.checkDeptDependencies(100);

      expect(result.hasDependencies).toBe(true);
      expect(result.dependencies).toContainEqual({ model: 'SysUser', count: 5 });
      expect(result.message).toContain('SysUser(5)');
    });

    it('应该返回所有依赖当部门同时有子部门和用户', async () => {
      mockPrismaService.sysDept.count.mockResolvedValue(2);
      mockPrismaService.sysUser.count.mockResolvedValue(10);

      const result = await service.checkDeptDependencies(100);

      expect(result.hasDependencies).toBe(true);
      expect(result.dependencies).toHaveLength(2);
      expect(result.dependencies).toContainEqual({ model: 'SysDept', count: 2 });
      expect(result.dependencies).toContainEqual({ model: 'SysUser', count: 10 });
    });
  });

  describe('checkRoleDependencies', () => {
    it('应该返回 hasDependencies=false 当角色没有依赖', async () => {
      mockPrismaService.sysUserRole.count.mockResolvedValue(0);

      const result = await service.checkRoleDependencies(1);

      expect(result.hasDependencies).toBe(false);
      expect(result.dependencies).toHaveLength(0);
      expect(result.message).toBeUndefined();
    });

    it('应该返回 hasDependencies=true 当角色有用户关联', async () => {
      mockPrismaService.sysUserRole.count.mockResolvedValue(15);

      const result = await service.checkRoleDependencies(1);

      expect(result.hasDependencies).toBe(true);
      expect(result.dependencies).toContainEqual({ model: 'SysUserRole', count: 15 });
      expect(result.message).toContain('角色存在依赖关系');
      expect(result.message).toContain('SysUserRole(15)');
    });
  });

  describe('checkPackageDependencies', () => {
    it('应该返回 hasDependencies=false 当套餐没有依赖', async () => {
      mockPrismaService.sysTenant.count.mockResolvedValue(0);

      const result = await service.checkPackageDependencies(1);

      expect(result.hasDependencies).toBe(false);
      expect(result.dependencies).toHaveLength(0);
      expect(result.message).toBeUndefined();
    });

    it('应该返回 hasDependencies=true 当套餐有租户使用', async () => {
      mockPrismaService.sysTenant.count.mockResolvedValue(8);

      const result = await service.checkPackageDependencies(1);

      expect(result.hasDependencies).toBe(true);
      expect(result.dependencies).toContainEqual({ model: 'SysTenant', count: 8 });
      expect(result.message).toContain('套餐存在依赖关系');
      expect(result.message).toContain('SysTenant(8)');
    });
  });

  describe('assertValid', () => {
    it('应该在验证通过时不抛出异常', () => {
      const validResult: RelationValidationResult = { valid: true };

      expect(() => service.assertValid(validResult)).not.toThrow();
    });

    it('应该在验证失败时抛出 BadRequestException', () => {
      const invalidResult: RelationValidationResult = {
        valid: false,
        message: '部门不存在: deptId=999',
      };

      expect(() => service.assertValid(invalidResult)).toThrow(BadRequestException);
      expect(() => service.assertValid(invalidResult)).toThrow('部门不存在: deptId=999');
    });
  });

  describe('assertNoDependencies', () => {
    it('应该在没有依赖时不抛出异常', () => {
      const noDepsResult: DependencyCheckResult = {
        hasDependencies: false,
        dependencies: [],
      };

      expect(() => service.assertNoDependencies(noDepsResult)).not.toThrow();
    });

    it('应该在有依赖时抛出 BadRequestException', () => {
      const hasDepsResult: DependencyCheckResult = {
        hasDependencies: true,
        dependencies: [{ model: 'SysUser', count: 5 }],
        message: '部门存在依赖关系，无法删除: SysUser(5)',
      };

      expect(() => service.assertNoDependencies(hasDepsResult)).toThrow(BadRequestException);
      expect(() => service.assertNoDependencies(hasDepsResult)).toThrow('部门存在依赖关系，无法删除: SysUser(5)');
    });
  });

  describe('边界条件测试', () => {
    it('validatePackageExists 应该正确处理 packageId=0', async () => {
      mockPrismaService.sysTenantPackage.findUnique.mockResolvedValue(null);

      const result = await service.validatePackageExists(0);

      expect(result.valid).toBe(false);
    });

    it('validateDeptExists 应该正确处理 deptId=0', async () => {
      mockPrismaService.sysDept.findUnique.mockResolvedValue(null);

      const result = await service.validateDeptExists(0);

      expect(result.valid).toBe(false);
    });

    it('validateRoleExists 应该正确处理 roleId=0', async () => {
      mockPrismaService.sysRole.findUnique.mockResolvedValue(null);

      const result = await service.validateRoleExists(0);

      expect(result.valid).toBe(false);
    });

    it('validateUserExists 应该正确处理 userId=0', async () => {
      mockPrismaService.sysUser.findUnique.mockResolvedValue(null);

      const result = await service.validateUserExists(0);

      expect(result.valid).toBe(false);
    });

    it('validateTenantExists 应该正确处理空字符串', async () => {
      mockPrismaService.sysTenant.findUnique.mockResolvedValue(null);

      const result = await service.validateTenantExists('');

      expect(result.valid).toBe(false);
    });
  });
});
