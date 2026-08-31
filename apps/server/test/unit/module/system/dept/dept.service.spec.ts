/** @file dept.service.spec.ts @description Migrated from src/modules/depts/dept.service.spec.ts */

import { Test, TestingModule } from '@nestjs/testing';
import { DeptService } from '@/modules/depts/dept.service';
import { PrismaService } from '@/platform/prisma';
import { DeptRepository } from '@/modules/depts/dept.repository';
import { DataScopeEnum } from '@/shared/enums';

// Mock decorators
jest.mock('@/core/auth/decorators/redis.decorator', () => ({
  Cacheable: () => () => {},
  CacheEvict: () => () => {},
}));
jest.mock('@/core/http/decorators/transactional.decorator', () => ({
  Transactional: () => () => {},
}));

describe('DeptService', () => {
  let service: DeptService;
  let prismaMock: any;
  let deptRepoMock: any;

  beforeEach(async () => {
    prismaMock = {
      sysDept: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (arg) => {
        if (typeof arg === 'function') return arg(prismaMock);
        return arg;
      }),
    };

    deptRepoMock = {
      create: jest.fn().mockResolvedValue({ deptId: 1 }),
      findById: jest.fn().mockResolvedValue({ deptId: 1, deptName: 'Test' }),
      update: jest.fn().mockResolvedValue({ deptId: 1 }),
      softDelete: jest.fn().mockResolvedValue({ deptId: 1 }),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [
        DeptService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: DeptRepository, useValue: deptRepoMock },
      ],
    }).compile();

    service = modules.get<DeptService>(DeptService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create dept without parent', async () => {
      const result = await service.create({ deptName: 'Test', orderNum: 1 } as any);

      expect(result.code).toBe(200);
      expect(deptRepoMock.create).toHaveBeenCalled();
    });

    it('should create dept with parent', async () => {
      prismaMock.sysDept.findUnique.mockResolvedValue({ ancestors: '0' });

      const result = await service.create({ deptName: 'Test', parentId: 100, orderNum: 1 } as any);

      expect(result.code).toBe(200);
      expect(deptRepoMock.create).toHaveBeenCalled();
    });

    it('should fail when parent not found', async () => {
      prismaMock.sysDept.findUnique.mockResolvedValue(null);

      const result = await service.create({ deptName: 'Test', parentId: 999, orderNum: 1 } as any);

      expect(result.code).not.toBe(200);
    });
  });

  describe('findAll', () => {
    it('should return all depts', async () => {
      prismaMock.sysDept.findMany.mockResolvedValue([{ deptId: 1, deptName: 'Test' }]);

      const result = await service.findAll({} as any);

      expect(result.code).toBe(200);
    });

    it('should filter by deptName', async () => {
      await service.findAll({ deptName: 'IT' } as any);

      expect(prismaMock.sysDept.findMany).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      await service.findAll({ status: '0' } as any);

      expect(prismaMock.sysDept.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return dept detail', async () => {
      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(deptRepoMock.findById).toHaveBeenCalledWith(1);
    });
  });

  describe('findDeptIdsByDataScope', () => {
    it('should return empty for DATA_SCOPE_SELF', async () => {
      const result = await service.findDeptIdsByDataScope(1, DataScopeEnum.DATA_SCOPE_SELF);

      expect(result).toEqual([]);
    });

    it('should return single dept for DATA_SCOPE_DEPT', async () => {
      prismaMock.sysDept.findMany.mockResolvedValue([{ deptId: 1 }]);

      const result = await service.findDeptIdsByDataScope(1, DataScopeEnum.DATA_SCOPE_DEPT);

      expect(result).toEqual([1]);
    });

    it('should return dept and children for DATA_SCOPE_DEPT_AND_CHILD', async () => {
      prismaMock.sysDept.findMany.mockResolvedValue([{ deptId: 1 }, { deptId: 2 }]);

      const result = await service.findDeptIdsByDataScope(1, DataScopeEnum.DATA_SCOPE_DEPT_AND_CHILD);

      expect(result).toEqual([1, 2]);
    });
  });

  describe('findListExclude', () => {
    it('should return depts excluding specified id', async () => {
      prismaMock.sysDept.findMany.mockResolvedValue([{ deptId: 2 }]);

      const result = await service.findListExclude(1);

      expect(result.code).toBe(200);
    });
  });

  describe('update', () => {
    it('should update dept without parent change', async () => {
      const result = await service.update({ deptId: 1, deptName: 'Updated' } as any);

      expect(result.code).toBe(200);
      expect(deptRepoMock.update).toHaveBeenCalled();
    });

    it('should update dept with parent change', async () => {
      prismaMock.sysDept.findUnique.mockResolvedValue({ ancestors: '0' });

      const result = await service.update({ deptId: 1, deptName: 'Updated', parentId: 100 } as any);

      expect(result.code).toBe(200);
    });

    it('should fail when new parent not found', async () => {
      prismaMock.sysDept.findUnique.mockResolvedValue(null);

      const result = await service.update({ deptId: 1, deptName: 'Updated', parentId: 999 } as any);

      expect(result.code).not.toBe(200);
    });
  });

  describe('remove', () => {
    it('should soft delete dept', async () => {
      const result = await service.remove(1);

      expect(result.code).toBe(200);
      expect(deptRepoMock.softDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('optionselect', () => {
    it('should return dept options', async () => {
      prismaMock.sysDept.findMany.mockResolvedValue([{ deptId: 1, deptName: 'Test' }]);

      const result = await service.optionselect();

      expect(result.code).toBe(200);
    });
  });

  describe('deptTree', () => {
    it('should return dept tree', async () => {
      prismaMock.sysDept.findMany.mockResolvedValue([
        { deptId: 1, deptName: 'Root', parentId: 0 },
        { deptId: 2, deptName: 'Child', parentId: 1 },
      ]);

      const result = await service.deptTree();

      expect(result).toBeDefined();
    });
  });

  describe('getChildDeptIds', () => {
    it('should return child dept ids', async () => {
      prismaMock.sysDept.findMany.mockResolvedValue([{ deptId: 1 }, { deptId: 2 }]);

      const result = await service.getChildDeptIds(1);

      expect(result).toEqual([1, 2]);
    });
  });
});
