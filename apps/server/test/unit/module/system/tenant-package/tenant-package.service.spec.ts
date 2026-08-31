/** @file tenant-package.service.spec.ts @description Migrated from src/modules/tenant-packages/tenant-package.service.spec.ts */

import { Test, TestingModule } from '@nestjs/testing';
import { TenantPackageService } from '@/modules/tenant-packages/tenant-package.service';
import { PrismaService } from '@/platform/prisma';
import { BusinessException } from '@/shared/exceptions';
import { ListTenantPackageRequestDto } from '@/modules/tenant-packages/dto/index';

// Helper to create DTO instance
function createListDto(params: Partial<ListTenantPackageRequestDto> = {}): ListTenantPackageRequestDto {
  const dto = new ListTenantPackageRequestDto();
  Object.assign(dto, params);
  return dto;
}

describe('TenantPackageService', () => {
  let service: TenantPackageService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      sysTenantPackage: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      sysTenant: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (arg) => {
        if (typeof arg === 'function') return arg({});
        return arg;
      }),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [TenantPackageService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    service = modules.get<TenantPackageService>(TenantPackageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create tenant package successfully', async () => {
      prismaMock.sysTenantPackage.findFirst.mockResolvedValue(null);
      prismaMock.sysTenantPackage.create.mockResolvedValue({ packageId: 1 });

      const result = await service.create({
        packageName: 'Basic',
        menuIds: [1, 2, 3],
        status: '0',
      });

      expect(result.code).toBe(200);
      expect(prismaMock.sysTenantPackage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          packageName: 'Basic',
          menuIds: '1,2,3',
        }),
      });
    });

    it('should throw error when package name exists', async () => {
      prismaMock.sysTenantPackage.findFirst.mockResolvedValue({ packageId: 1 });

      await expect(service.create({ packageName: 'Existing' })).rejects.toThrow(BusinessException);
    });

    it('should handle empty menuIds', async () => {
      prismaMock.sysTenantPackage.findFirst.mockResolvedValue(null);
      prismaMock.sysTenantPackage.create.mockResolvedValue({ packageId: 1 });

      await service.create({ packageName: 'Basic' });

      expect(prismaMock.sysTenantPackage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          menuIds: '',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated list', async () => {
      const mockList = [
        { packageId: 1, packageName: 'Basic' },
        { packageId: 2, packageName: 'Pro' },
      ];
      prismaMock.$transaction.mockResolvedValue([mockList, 2]);

      const result = await service.findAll(createListDto({ pageNum: 1, pageSize: 10 }));

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(2);
      expect(result.data.total).toBe(2);
    });

    it('should filter by packageName', async () => {
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await service.findAll(createListDto({ packageName: 'Basic', pageNum: 1, pageSize: 10 }));

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await service.findAll(createListDto({ status: '0', pageNum: 1, pageSize: 10 }));

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('selectList', () => {
    it('should return select options', async () => {
      prismaMock.sysTenantPackage.findMany.mockResolvedValue([{ packageId: 1, packageName: 'Basic' }]);

      const result = await service.selectList();

      expect(result.code).toBe(200);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return package detail', async () => {
      prismaMock.sysTenantPackage.findUnique.mockResolvedValue({
        packageId: 1,
        packageName: 'Basic',
      });

      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(result.data.packageId).toBe(1);
    });

    it('should throw error when package not found', async () => {
      prismaMock.sysTenantPackage.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(BusinessException);
    });
  });

  describe('update', () => {
    it('should update package successfully', async () => {
      prismaMock.sysTenantPackage.findUnique.mockResolvedValue({
        packageId: 1,
        packageName: 'Basic',
      });
      prismaMock.sysTenantPackage.update.mockResolvedValue({});

      const result = await service.update({
        packageId: 1,
        packageName: 'Basic Pro',
        menuIds: [1, 2],
      });

      expect(result.code).toBe(200);
    });

    it('should throw error when package not found', async () => {
      prismaMock.sysTenantPackage.findUnique.mockResolvedValue(null);

      await expect(service.update({ packageId: 999 })).rejects.toThrow(BusinessException);
    });

    it('should throw error when new name already exists', async () => {
      prismaMock.sysTenantPackage.findUnique.mockResolvedValue({
        packageId: 1,
        packageName: 'Basic',
      });
      prismaMock.sysTenantPackage.findFirst.mockResolvedValue({
        packageId: 2,
        packageName: 'Pro',
      });

      await expect(service.update({ packageId: 1, packageName: 'Pro' })).rejects.toThrow(BusinessException);
    });
  });

  describe('remove', () => {
    it('should remove packages successfully', async () => {
      prismaMock.sysTenant.findFirst.mockResolvedValue(null);
      prismaMock.sysTenantPackage.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.remove([1, 2]);

      expect(result.code).toBe(200);
    });

    it('should throw error when package is in use', async () => {
      prismaMock.sysTenant.findFirst.mockResolvedValue({ tenantId: '001' });

      await expect(service.remove([1])).rejects.toThrow(BusinessException);
    });
  });

  describe('changeStatus', () => {
    it('should change status successfully', async () => {
      prismaMock.sysTenantPackage.findUnique.mockResolvedValue({ packageId: 1 });
      prismaMock.sysTenantPackage.update.mockResolvedValue({});

      const result = await service.changeStatus(1, '1');

      expect(result.code).toBe(200);
    });

    it('should throw error when package not found', async () => {
      prismaMock.sysTenantPackage.findUnique.mockResolvedValue(null);

      await expect(service.changeStatus(999, '1')).rejects.toThrow(BusinessException);
    });
  });
});
