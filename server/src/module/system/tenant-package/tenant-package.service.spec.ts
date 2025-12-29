import { Test, TestingModule } from '@nestjs/testing';
import { TenantPackageService } from './tenant-package.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TenantPackageRepository } from './tenant-package.repository';
import { plainToInstance } from 'class-transformer';
import { ListTenantPackageDto } from './dto/list-tenant-package.dto';

describe('TenantPackageService', () => {
  let service: TenantPackageService;
  let prisma: PrismaService;
  let packageRepo: TenantPackageRepository;

  const mockPrismaService = {
    sysTenantPackage: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    sysTenant: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((fn) => {
      if (Array.isArray(fn)) {
        return Promise.all(fn);
      }
      return fn(mockPrismaService);
    }),
  };

  const mockPackageRepository = {
    create: jest.fn(),
    findPageWithFilter: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantPackageService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TenantPackageRepository,
          useValue: mockPackageRepository,
        },
      ],
    }).compile();

    service = module.get<TenantPackageService>(TenantPackageService);
    prisma = module.get<PrismaService>(PrismaService);
    packageRepo = module.get<TenantPackageRepository>(TenantPackageRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a tenant package', async () => {
      const createDto = {
        packageName: '基础套餐',
        menuIds: [1, 2, 3],
        remark: '测试套餐',
      };
      mockPrismaService.sysTenantPackage.findFirst.mockResolvedValue(null);
      mockPrismaService.sysTenantPackage.create.mockResolvedValue({ packageId: 1 });

      const result = await service.create(createDto);

      expect(result.code).toBe(200);
    });
  });

  describe('findAll', () => {
    it('should return package list', async () => {
      const query = plainToInstance(ListTenantPackageDto, { pageNum: 1, pageSize: 10 });
      const mockPackages = [{ packageId: 1, packageName: '套餐1' }];
      mockPrismaService.$transaction.mockResolvedValue([mockPackages, 1]);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
    });
  });

  describe('findOne', () => {
    it('should return package by id', async () => {
      const mockPackage = { packageId: 1, packageName: '套餐1' };
      mockPrismaService.sysTenantPackage.findUnique.mockResolvedValue(mockPackage);

      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockPackage);
    });
  });

  describe('update', () => {
    it('should update a package', async () => {
      const updateDto = { packageId: 1, packageName: '更新套餐' };
      const existingPackage = { packageId: 1, packageName: '原套餐' };
      mockPrismaService.sysTenantPackage.findUnique.mockResolvedValue(existingPackage);
      mockPrismaService.sysTenantPackage.findFirst.mockResolvedValue(null);
      mockPrismaService.sysTenantPackage.update.mockResolvedValue({});

      const result = await service.update(updateDto);

      expect(result.code).toBe(200);
    });
  });

  describe('remove', () => {
    it('should remove packages', async () => {
      mockPrismaService.sysTenant.findFirst.mockResolvedValue(null);
      mockPrismaService.sysTenantPackage.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.remove([1, 2]);

      expect(result.code).toBe(200);
    });
  });
});
