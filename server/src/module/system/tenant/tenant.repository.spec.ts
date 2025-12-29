import { Test, TestingModule } from '@nestjs/testing';
import { TenantRepository } from './tenant.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';
import { TenantContext } from 'src/common/tenant/tenant.context';

describe('TenantRepository', () => {
  let repository: TenantRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockTenant = {
    id: 1,
    tenantId: '000001',
    companyName: 'Test Company',
    contactName: 'John Doe',
    contactPhone: '13800138000',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    packageId: 1,
    expireTime: new Date('2025-12-31'),
    accountCount: 10,
    storageQuota: 1000,
    storageUsed: 100,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  const mockPrisma = {
    sysTenant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<TenantRepository>(TenantRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByTenantId', () => {
    it('should find tenant by tenantId', async () => {
      mockPrisma.sysTenant.findUnique.mockResolvedValue(mockTenant);

      const result = await repository.findByTenantId('000001');

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.sysTenant.findUnique).toHaveBeenCalledWith({
        where: { tenantId: '000001' },
      });
    });

    it('should return null if tenant not found', async () => {
      mockPrisma.sysTenant.findUnique.mockResolvedValue(null);

      const result = await repository.findByTenantId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAllActive', () => {
    it('should find all active tenants', async () => {
      const mockTenants = [mockTenant, { ...mockTenant, tenantId: '000002' }];
      mockPrisma.sysTenant.findMany.mockResolvedValue(mockTenants);

      const result = await repository.findAllActive();

      expect(result).toEqual(mockTenants);
      expect(mockPrisma.sysTenant.findMany).toHaveBeenCalledWith({
        where: {
          status: StatusEnum.NORMAL,
          delFlag: DelFlagEnum.NORMAL,
        },
        orderBy: { createTime: 'desc' },
      });
    });

    it('should return empty array if no active tenants', async () => {
      mockPrisma.sysTenant.findMany.mockResolvedValue([]);

      const result = await repository.findAllActive();

      expect(result).toEqual([]);
    });
  });

  describe('findAllNonSuper', () => {
    it('should find all non-super tenants', async () => {
      const mockTenants = [
        { tenantId: '000001', companyName: 'Company 1', status: StatusEnum.NORMAL, expireTime: new Date() },
      ];
      mockPrisma.sysTenant.findMany.mockResolvedValue(mockTenants);

      const result = await repository.findAllNonSuper();

      expect(result).toEqual(mockTenants);
      expect(mockPrisma.sysTenant.findMany).toHaveBeenCalledWith({
        where: {
          status: StatusEnum.NORMAL,
          delFlag: DelFlagEnum.NORMAL,
          tenantId: { not: TenantContext.SUPER_TENANT_ID },
        },
        select: {
          tenantId: true,
          companyName: true,
          status: true,
          expireTime: true,
        },
      });
    });
  });

  describe('findByCompanyName', () => {
    it('should find tenant by company name', async () => {
      mockPrisma.sysTenant.findFirst.mockResolvedValue(mockTenant);

      const result = await repository.findByCompanyName('Test Company');

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.sysTenant.findFirst).toHaveBeenCalledWith({
        where: {
          companyName: 'Test Company',
          delFlag: DelFlagEnum.NORMAL,
        },
      });
    });

    it('should return null if company not found', async () => {
      mockPrisma.sysTenant.findFirst.mockResolvedValue(null);

      const result = await repository.findByCompanyName('Nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findLastTenant', () => {
    it('should find the last created tenant', async () => {
      mockPrisma.sysTenant.findFirst.mockResolvedValue(mockTenant);

      const result = await repository.findLastTenant();

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.sysTenant.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: { not: TenantContext.SUPER_TENANT_ID },
        },
        orderBy: { id: 'desc' },
      });
    });

    it('should return null if no tenants exist', async () => {
      mockPrisma.sysTenant.findFirst.mockResolvedValue(null);

      const result = await repository.findLastTenant();

      expect(result).toBeNull();
    });
  });

  describe('existsByTenantId', () => {
    it('should return true if tenant exists', async () => {
      mockPrisma.sysTenant.count.mockResolvedValue(1);

      const result = await repository.existsByTenantId('000001');

      expect(result).toBe(true);
    });

    it('should return false if tenant does not exist', async () => {
      mockPrisma.sysTenant.count.mockResolvedValue(0);

      const result = await repository.existsByTenantId('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('findPaginated', () => {
    it('should return paginated tenants', async () => {
      const mockTenants = [mockTenant];
      mockPrisma.$transaction.mockResolvedValue([mockTenants, 1]);

      const result = await repository.findPaginated({}, 0, 10);

      expect(result).toEqual({ list: mockTenants, total: 1 });
    });

    it('should apply where conditions', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const where = { status: StatusEnum.NORMAL };
      await repository.findPaginated(where, 0, 10);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new tenant', async () => {
      mockPrisma.sysTenant.create.mockResolvedValue(mockTenant);

      const createData = {
        tenantId: '000001',
        companyName: 'Test Company',
        contactName: 'John Doe',
        contactPhone: '13800138000',
      };

      const result = await repository.create(createData as any);

      expect(result).toEqual(mockTenant);
      expect(mockPrisma.sysTenant.create).toHaveBeenCalledWith({ data: createData });
    });
  });

  describe('update', () => {
    it('should update tenant', async () => {
      const updatedTenant = { ...mockTenant, companyName: 'Updated Company' };
      mockPrisma.sysTenant.update.mockResolvedValue(updatedTenant);

      const result = await repository.update('000001', { companyName: 'Updated Company' });

      expect(result.companyName).toBe('Updated Company');
      expect(mockPrisma.sysTenant.update).toHaveBeenCalledWith({
        where: { tenantId: '000001' },
        data: { companyName: 'Updated Company' },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update tenant status', async () => {
      const updatedTenant = { ...mockTenant, status: StatusEnum.DISABLED };
      mockPrisma.sysTenant.update.mockResolvedValue(updatedTenant);

      const result = await repository.updateStatus('000001', StatusEnum.DISABLED);

      expect(result.status).toBe(StatusEnum.DISABLED);
      expect(mockPrisma.sysTenant.update).toHaveBeenCalledWith({
        where: { tenantId: '000001' },
        data: { status: StatusEnum.DISABLED },
      });
    });
  });

  describe('softDelete', () => {
    it('should soft delete tenant', async () => {
      const deletedTenant = { ...mockTenant, delFlag: DelFlagEnum.DELETED };
      mockPrisma.sysTenant.update.mockResolvedValue(deletedTenant);

      const result = await repository.softDelete('000001');

      expect(result.delFlag).toBe(DelFlagEnum.DELETED);
      expect(mockPrisma.sysTenant.update).toHaveBeenCalledWith({
        where: { tenantId: '000001' },
        data: { delFlag: DelFlagEnum.DELETED },
      });
    });
  });

  describe('updatePackageForTenants', () => {
    it('should update package for multiple tenants', async () => {
      mockPrisma.sysTenant.updateMany.mockResolvedValue({ count: 3 });

      const result = await repository.updatePackageForTenants(['000001', '000002', '000003'], 2);

      expect(result).toBe(3);
      expect(mockPrisma.sysTenant.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId: { in: ['000001', '000002', '000003'] },
        },
        data: {
          packageId: 2,
        },
      });
    });

    it('should return 0 if no tenants updated', async () => {
      mockPrisma.sysTenant.updateMany.mockResolvedValue({ count: 0 });

      const result = await repository.updatePackageForTenants([], 2);

      expect(result).toBe(0);
    });
  });
});
