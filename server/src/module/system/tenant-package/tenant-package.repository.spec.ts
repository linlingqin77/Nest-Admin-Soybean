import { Test, TestingModule } from '@nestjs/testing';
import { TenantPackageRepository } from './tenant-package.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status, DelFlag } from '@prisma/client';

describe('TenantPackageRepository', () => {
  let repository: TenantPackageRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockPackage = {
    packageId: 1,
    packageName: '基础套餐',
    menuIds: '1,2,3,4,5',
    status: Status.NORMAL,
    delFlag: DelFlag.NORMAL,
    remark: '基础功能套餐',
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
  };

  const mockPrisma = {
    sysTenantPackage: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sysTenant: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantPackageRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<TenantPackageRepository>(TenantPackageRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPageWithFilter', () => {
    it('should return paginated packages', async () => {
      const mockPackages = [mockPackage];
      mockPrisma.$transaction.mockResolvedValue([mockPackages, 1]);

      const result = await repository.findPageWithFilter({}, 0, 10);

      expect(result).toEqual({ list: mockPackages, total: 1 });
    });

    it('should apply where conditions', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const where = { status: Status.NORMAL };
      await repository.findPageWithFilter(where, 0, 10);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should apply custom orderBy', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      await repository.findPageWithFilter({}, 0, 10, { packageName: 'asc' });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findByPackageName', () => {
    it('should find package by name', async () => {
      mockPrisma.sysTenantPackage.findFirst.mockResolvedValue(mockPackage);

      const result = await repository.findByPackageName('基础套餐');

      expect(result).toEqual(mockPackage);
    });

    it('should return null if package not found', async () => {
      mockPrisma.sysTenantPackage.findFirst.mockResolvedValue(null);

      const result = await repository.findByPackageName('不存在');

      expect(result).toBeNull();
    });

    it('should exclude specific package id when checking', async () => {
      mockPrisma.sysTenantPackage.findFirst.mockResolvedValue(null);

      const result = await repository.findByPackageName('基础套餐', 1);

      expect(result).toBeNull();
      expect(mockPrisma.sysTenantPackage.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          packageId: { not: 1 },
        }),
      });
    });
  });

  describe('isPackageInUse', () => {
    it('should return true if package is in use', async () => {
      mockPrisma.sysTenant.count.mockResolvedValue(1);

      const result = await repository.isPackageInUse(1);

      expect(result).toBe(true);
    });

    it('should return false if package is not in use', async () => {
      mockPrisma.sysTenant.count.mockResolvedValue(0);

      const result = await repository.isPackageInUse(999);

      expect(result).toBe(false);
    });
  });

  describe('findAllNormalPackages', () => {
    it('should find all normal packages', async () => {
      mockPrisma.sysTenantPackage.findMany.mockResolvedValue([mockPackage]);

      const result = await repository.findAllNormalPackages();

      expect(result).toEqual([mockPackage]);
    });

    it('should return empty array if no packages', async () => {
      mockPrisma.sysTenantPackage.findMany.mockResolvedValue([]);

      const result = await repository.findAllNormalPackages();

      expect(result).toEqual([]);
    });
  });

  describe('findMenuIdsByPackageId', () => {
    it('should find menu ids by package id', async () => {
      mockPrisma.sysTenantPackage.findUnique.mockResolvedValue({ menuIds: '1,2,3,4,5' });

      const result = await repository.findMenuIdsByPackageId(1);

      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return empty array if package not found', async () => {
      mockPrisma.sysTenantPackage.findUnique.mockResolvedValue(null);

      const result = await repository.findMenuIdsByPackageId(999);

      expect(result).toEqual([]);
    });

    it('should return empty array if menuIds is empty', async () => {
      mockPrisma.sysTenantPackage.findUnique.mockResolvedValue({ menuIds: '' });

      const result = await repository.findMenuIdsByPackageId(1);

      expect(result).toEqual([]);
    });

    it('should return empty array if menuIds is null', async () => {
      mockPrisma.sysTenantPackage.findUnique.mockResolvedValue({ menuIds: null });

      const result = await repository.findMenuIdsByPackageId(1);

      expect(result).toEqual([]);
    });
  });

  describe('inherited methods from SoftDeleteRepository', () => {
    it('should have access to findById', async () => {
      mockPrisma.sysTenantPackage.findUnique.mockResolvedValue(mockPackage);

      const result = await repository.findById(1);

      expect(result).toEqual(mockPackage);
    });

    it('should return null for soft deleted record', async () => {
      const deletedPackage = { ...mockPackage, delFlag: DelFlag.DELETED };
      mockPrisma.sysTenantPackage.findUnique.mockResolvedValue(deletedPackage);

      const result = await repository.findById(1);

      expect(result).toBeNull();
    });

    it('should have access to findAll', async () => {
      mockPrisma.sysTenantPackage.findMany.mockResolvedValue([mockPackage]);

      const result = await repository.findAll();

      expect(result).toEqual([mockPackage]);
    });

    it('should have access to create', async () => {
      mockPrisma.sysTenantPackage.create.mockResolvedValue(mockPackage);

      const result = await repository.create({
        packageName: '新套餐',
        menuIds: '1,2,3',
      } as any);

      expect(result).toEqual(mockPackage);
    });

    it('should have access to update', async () => {
      const updatedPackage = { ...mockPackage, packageName: 'Updated' };
      mockPrisma.sysTenantPackage.update.mockResolvedValue(updatedPackage);

      const result = await repository.update(1, { packageName: 'Updated' });

      expect(result.packageName).toBe('Updated');
    });

    it('should have access to softDelete', async () => {
      const deletedPackage = { ...mockPackage, delFlag: DelFlag.DELETED };
      mockPrisma.sysTenantPackage.update.mockResolvedValue(deletedPackage);

      const result = await repository.softDelete(1);

      expect(result.delFlag).toBe(DelFlag.DELETED);
    });
  });
});
