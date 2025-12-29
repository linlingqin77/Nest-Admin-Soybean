import { Test, TestingModule } from '@nestjs/testing';
import { DeptRepository } from './dept.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';

describe('DeptRepository', () => {
  let repository: DeptRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockDept = {
    deptId: 1,
    parentId: 0,
    ancestors: '0',
    deptName: '总公司',
    orderNum: 0,
    leader: '管理员',
    phone: '13800138000',
    email: 'admin@example.com',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
  };

  const mockPrisma = {
    sysDept: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    sysUser: {
      count: jest.fn(),
    },
    sysRoleDept: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeptRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<DeptRepository>(DeptRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByDeptName', () => {
    it('should find dept by name', async () => {
      mockPrisma.sysDept.findFirst.mockResolvedValue(mockDept);

      const result = await repository.findByDeptName('总公司');

      expect(result).toEqual(mockDept);
    });

    it('should return null if dept not found', async () => {
      mockPrisma.sysDept.findFirst.mockResolvedValue(null);

      const result = await repository.findByDeptName('不存在');

      expect(result).toBeNull();
    });
  });

  describe('existsByDeptName', () => {
    it('should return true if dept name exists', async () => {
      mockPrisma.sysDept.count.mockResolvedValue(1);

      const result = await repository.existsByDeptName('总公司', 0);

      expect(result).toBe(true);
    });

    it('should return false if dept name does not exist', async () => {
      mockPrisma.sysDept.count.mockResolvedValue(0);

      const result = await repository.existsByDeptName('不存在', 0);

      expect(result).toBe(false);
    });

    it('should exclude specific dept id when checking', async () => {
      mockPrisma.sysDept.count.mockResolvedValue(0);

      const result = await repository.existsByDeptName('总公司', 0, 1);

      expect(result).toBe(false);
    });
  });

  describe('findAllDepts', () => {
    it('should find all depts without status filter', async () => {
      mockPrisma.sysDept.findMany.mockResolvedValue([mockDept]);

      const result = await repository.findAllDepts();

      expect(result).toEqual([mockDept]);
    });

    it('should filter by status', async () => {
      mockPrisma.sysDept.findMany.mockResolvedValue([mockDept]);

      const result = await repository.findAllDepts(StatusEnum.NORMAL);

      expect(result).toEqual([mockDept]);
    });
  });

  describe('countChildren', () => {
    it('should count children depts', async () => {
      mockPrisma.sysDept.count.mockResolvedValue(5);

      const result = await repository.countChildren(1);

      expect(result).toBe(5);
    });

    it('should return 0 if no children', async () => {
      mockPrisma.sysDept.count.mockResolvedValue(0);

      const result = await repository.countChildren(999);

      expect(result).toBe(0);
    });
  });

  describe('countUsers', () => {
    it('should count users in dept', async () => {
      mockPrisma.sysUser.count.mockResolvedValue(10);

      const result = await repository.countUsers(1);

      expect(result).toBe(10);
    });

    it('should return 0 if no users in dept', async () => {
      mockPrisma.sysUser.count.mockResolvedValue(0);

      const result = await repository.countUsers(999);

      expect(result).toBe(0);
    });
  });

  describe('findRoleDeptIds', () => {
    it('should find role dept ids', async () => {
      mockPrisma.sysRoleDept.findMany.mockResolvedValue([{ deptId: 1 }, { deptId: 2 }]);

      const result = await repository.findRoleDeptIds(1);

      expect(result).toEqual([1, 2]);
    });

    it('should return empty array if no depts', async () => {
      mockPrisma.sysRoleDept.findMany.mockResolvedValue([]);

      const result = await repository.findRoleDeptIds(999);

      expect(result).toEqual([]);
    });
  });

  describe('findUserDataScope', () => {
    it('should find user data scope depts', async () => {
      mockPrisma.sysDept.findMany.mockResolvedValue([mockDept]);

      const result = await repository.findUserDataScope(1, [1, 2]);

      expect(result).toEqual([mockDept]);
    });

    it('should return empty array if no depts in scope', async () => {
      mockPrisma.sysDept.findMany.mockResolvedValue([]);

      const result = await repository.findUserDataScope(1, []);

      expect(result).toEqual([]);
    });
  });

  describe('softDeleteBatch', () => {
    it('should soft delete multiple depts', async () => {
      mockPrisma.sysDept.updateMany.mockResolvedValue({ count: 3 });

      const result = await repository.softDeleteBatch([1, 2, 3]);

      expect(result).toBe(3);
    });

    it('should return 0 if no depts deleted', async () => {
      mockPrisma.sysDept.updateMany.mockResolvedValue({ count: 0 });

      const result = await repository.softDeleteBatch([]);

      expect(result).toBe(0);
    });
  });

  describe('inherited methods from SoftDeleteRepository', () => {
    it('should have access to findById', async () => {
      // base.repository.ts SoftDeleteRepository.findById uses findUnique
      mockPrisma.sysDept.findUnique.mockResolvedValue(mockDept);

      const result = await repository.findById(1);

      expect(result).toEqual(mockDept);
    });

    it('should return null for soft deleted record', async () => {
      const deletedDept = { ...mockDept, delFlag: DelFlagEnum.DELETED };
      mockPrisma.sysDept.findUnique.mockResolvedValue(deletedDept);

      const result = await repository.findById(1);

      expect(result).toBeNull();
    });

    it('should have access to findAll', async () => {
      mockPrisma.sysDept.findMany.mockResolvedValue([mockDept]);

      const result = await repository.findAll();

      expect(result).toEqual([mockDept]);
    });

    it('should have access to create', async () => {
      mockPrisma.sysDept.create.mockResolvedValue(mockDept);

      const result = await repository.create({
        deptName: '新部门',
        parentId: 0,
        orderNum: 1,
      } as any);

      expect(result).toEqual(mockDept);
    });

    it('should have access to update', async () => {
      const updatedDept = { ...mockDept, deptName: 'Updated' };
      mockPrisma.sysDept.update.mockResolvedValue(updatedDept);

      const result = await repository.update(1, { deptName: 'Updated' });

      expect(result.deptName).toBe('Updated');
    });

    it('should have access to softDelete', async () => {
      const deletedDept = { ...mockDept, delFlag: DelFlagEnum.DELETED };
      mockPrisma.sysDept.update.mockResolvedValue(deletedDept);

      const result = await repository.softDelete(1);

      expect(result.delFlag).toBe(DelFlagEnum.DELETED);
    });
  });
});
