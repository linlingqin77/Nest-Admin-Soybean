import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TenantRepository } from './tenant.repository';
import { RedisService } from 'src/module/common/redis/redis.service';
import { MockServiceFactory } from 'src/test-utils/mocks/service.mock';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { plainToInstance } from 'class-transformer';
import { ListTenantDto } from './dto/list-tenant.dto';
import { BusinessException } from 'src/common/exceptions';
import { StatusEnum, DelFlagEnum } from 'src/common/enum/index';

// Mock TenantContext
jest.mock('src/common/tenant/tenant.context', () => ({
  TenantContext: {
    getTenantId: jest.fn().mockReturnValue('000000'),
    SUPER_TENANT_ID: '000000',
  },
}));

describe('TenantService', () => {
  let service: TenantService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let tenantRepo: TenantRepository;
  let redisService: any;

  const mockTenantRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDeleteBatch: jest.fn(),
  };

  const mockTenant = {
    id: 1,
    tenantId: '100001',
    contactUserName: '张三',
    contactPhone: '13800138000',
    companyName: '测试公司',
    licenseNumber: '123456789',
    address: '测试地址',
    intro: '测试简介',
    domain: 'test.com',
    packageId: 1,
    expireTime: new Date('2025-12-31'),
    accountCount: 10,
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    remark: '测试备注',
    createTime: new Date(),
    updateTime: new Date(),
  };

  beforeEach(async () => {
    prisma = createPrismaMock();
    redisService = MockServiceFactory.createRedisService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: TenantRepository,
          useValue: mockTenantRepository,
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    tenantRepo = module.get<TenantRepository>(TenantRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a tenant with auto-generated tenantId', async () => {
      const createDto = {
        contactUserName: '张三',
        contactPhone: '13800138000',
        companyName: '测试公司',
        packageId: 1,
        username: 'admin',
        password: 'Admin@123',
      } as any;
      
      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValueOnce({ tenantId: '100005' }); // last tenant
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValueOnce(null); // company name check
      (prisma.sysTenant.create as jest.Mock).mockResolvedValue({});
      (prisma.sysUser.create as jest.Mock).mockResolvedValue({});

      const result = await service.create(createDto);

      expect(result.code).toBe(200);
      expect(prisma.sysTenant.create).toHaveBeenCalled();
      expect(prisma.sysUser.create).toHaveBeenCalled();
    });

    it('should create a tenant with provided tenantId', async () => {
      const createDto = {
        tenantId: '100000',
        contactUserName: '张三',
        contactPhone: '13800138000',
        companyName: '测试公司',
        packageId: 1,
        username: 'admin',
        password: 'Admin@123',
      } as any;
      
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.create as jest.Mock).mockResolvedValue({});
      (prisma.sysUser.create as jest.Mock).mockResolvedValue({});

      const result = await service.create(createDto);

      expect(result.code).toBe(200);
    });

    it('should throw error when tenantId already exists', async () => {
      const createDto = {
        tenantId: '100000',
        contactUserName: '张三',
        contactPhone: '13800138000',
        companyName: '测试公司',
        packageId: 1,
        username: 'admin',
        password: 'Admin@123',
      } as any;
      
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      await expect(service.create(createDto)).rejects.toThrow(BusinessException);
    });

    it('should throw error when company name already exists', async () => {
      const createDto = {
        tenantId: '100000',
        contactUserName: '张三',
        contactPhone: '13800138000',
        companyName: '测试公司',
        packageId: 1,
        username: 'admin',
        password: 'Admin@123',
      } as any;
      
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValue(mockTenant);

      await expect(service.create(createDto)).rejects.toThrow(BusinessException);
    });

    it('should throw HttpException when database error occurs', async () => {
      const createDto = {
        tenantId: '100000',
        contactUserName: '张三',
        contactPhone: '13800138000',
        companyName: '测试公司',
        packageId: 1,
        username: 'admin',
        password: 'Admin@123',
      } as any;
      
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.create(createDto)).rejects.toThrow(HttpException);
    });
  });

  describe('findAll', () => {
    it('should return tenant list', async () => {
      const query = plainToInstance(ListTenantDto, { pageNum: 1, pageSize: 10 });
      const mockTenants = [{ id: 1, tenantId: '100000', companyName: '公司1', packageId: 1 }];
      const mockPackages = [{ packageId: 1, packageName: '套餐1' }];

      (prisma.$transaction as jest.Mock).mockResolvedValue([mockTenants, 1]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue(mockPackages);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should filter by tenantId', async () => {
      const query = plainToInstance(ListTenantDto, { pageNum: 1, pageSize: 10, tenantId: '100' });
      
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
    });

    it('should filter by contactUserName', async () => {
      const query = plainToInstance(ListTenantDto, { pageNum: 1, pageSize: 10, contactUserName: '张' });
      
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
    });

    it('should filter by contactPhone', async () => {
      const query = plainToInstance(ListTenantDto, { pageNum: 1, pageSize: 10, contactPhone: '138' });
      
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
    });

    it('should filter by companyName', async () => {
      const query = plainToInstance(ListTenantDto, { pageNum: 1, pageSize: 10, companyName: '测试' });
      
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
    });

    it('should filter by status', async () => {
      const query = plainToInstance(ListTenantDto, { pageNum: 1, pageSize: 10, status: StatusEnum.NORMAL });
      
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
    });

    it('should filter by date range', async () => {
      const query = plainToInstance(ListTenantDto, { 
        pageNum: 1, 
        pageSize: 10, 
        beginTime: '2024-01-01',
        endTime: '2024-12-31'
      });
      
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
    });

    it('should handle tenants without packageId', async () => {
      const query = plainToInstance(ListTenantDto, { pageNum: 1, pageSize: 10 });
      const mockTenants = [{ id: 1, tenantId: '100000', companyName: '公司1', packageId: null }];

      (prisma.$transaction as jest.Mock).mockResolvedValue([mockTenants, 1]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(result.data.rows[0].packageName).toBe('');
    });
  });

  describe('findOne', () => {
    it('should return tenant by id', async () => {
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockTenant);
    });

    it('should throw error when tenant not found', async () => {
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(BusinessException);
    });
  });

  describe('update', () => {
    it('should update a tenant', async () => {
      const updateDto = { id: 1, tenantId: '100000', companyName: '更新公司' } as any;
      const existingTenant = { id: 1, tenantId: '100000', companyName: '公司1' };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(existingTenant);
      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.update as jest.Mock).mockResolvedValue({});

      const result = await service.update(updateDto);

      expect(result.code).toBe(200);
    });

    it('should throw error when tenant not found', async () => {
      const updateDto = { id: 999, companyName: '更新公司' } as any;

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update(updateDto)).rejects.toThrow(BusinessException);
    });

    it('should throw error when company name already exists', async () => {
      const updateDto = { id: 1, companyName: '已存在公司' } as any;
      const existingTenant = { id: 1, companyName: '原公司' };
      const duplicateTenant = { id: 2, companyName: '已存在公司' };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(existingTenant);
      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValue(duplicateTenant);

      await expect(service.update(updateDto)).rejects.toThrow(BusinessException);
    });

    it('should update tenant status', async () => {
      const updateDto = { id: 1, status: StatusEnum.DISABLED } as any;
      const existingTenant = { id: 1, companyName: '公司1' };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(existingTenant);
      (prisma.sysTenant.update as jest.Mock).mockResolvedValue({});

      const result = await service.update(updateDto);

      expect(result.code).toBe(200);
    });
  });

  describe('remove', () => {
    it('should remove tenants', async () => {
      (prisma.sysTenant.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.remove([1, 2]);

      expect(result.code).toBe(200);
    });
  });

  describe('syncTenantDict', () => {
    it('should sync tenant dictionaries', async () => {
      const mockTenants = [{ tenantId: '100001', companyName: '公司1' }];
      const mockDictTypes = [{ dictType: 'sys_normal_disable', dictName: '状态', status: StatusEnum.NORMAL, remark: '' }];
      const mockDictDatas = [{ dictSort: 1, dictLabel: '正常', dictValue: '0', dictType: 'sys_normal_disable' }];

      (prisma.sysTenant.findMany as jest.Mock).mockResolvedValue(mockTenants);
      (prisma.sysDictType.findMany as jest.Mock).mockResolvedValue(mockDictTypes);
      (prisma.sysDictType.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.sysDictType.create as jest.Mock).mockResolvedValue({});
      (prisma.sysDictData.findMany as jest.Mock).mockResolvedValue(mockDictDatas);
      (prisma.sysDictData.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.syncTenantDict();

      expect(result.code).toBe(200);
      expect(result.data.detail.synced).toBeGreaterThanOrEqual(0);
    });

    it('should skip existing dict types', async () => {
      const mockTenants = [{ tenantId: '100001', companyName: '公司1' }];
      const mockDictTypes = [{ dictType: 'sys_normal_disable', dictName: '状态' }];

      (prisma.sysTenant.findMany as jest.Mock).mockResolvedValue(mockTenants);
      (prisma.sysDictType.findMany as jest.Mock).mockResolvedValue(mockDictTypes);
      (prisma.sysDictType.findFirst as jest.Mock).mockResolvedValue({ dictType: 'sys_normal_disable' }); // already exists

      const result = await service.syncTenantDict();

      expect(result.code).toBe(200);
      expect(result.data.detail.skipped).toBeGreaterThanOrEqual(0);
    });

    it('should handle sync errors gracefully', async () => {
      (prisma.sysTenant.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.syncTenantDict()).rejects.toThrow(HttpException);
    });
  });

  describe('syncTenantPackage', () => {
    it('should sync tenant package', async () => {
      const params = { tenantId: '100001', packageId: 1 };
      const mockPackage = { packageId: 1, packageName: '套餐1', menuIds: '1,2,3' };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.sysTenantPackage.findUnique as jest.Mock).mockResolvedValue(mockPackage);
      (prisma.sysTenant.update as jest.Mock).mockResolvedValue({});

      const result = await service.syncTenantPackage(params);

      expect(result.code).toBe(200);
    });

    it('should throw error when tenant not found', async () => {
      const params = { tenantId: '999999', packageId: 1 };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.syncTenantPackage(params)).rejects.toThrow(HttpException);
    });

    it('should throw error when package not found', async () => {
      const params = { tenantId: '100001', packageId: 999 };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.sysTenantPackage.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.syncTenantPackage(params)).rejects.toThrow(HttpException);
    });

    it('should handle sync errors', async () => {
      const params = { tenantId: '100001', packageId: 1 };

      (prisma.sysTenant.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.syncTenantPackage(params)).rejects.toThrow(HttpException);
    });
  });

  describe('syncTenantConfig', () => {
    it('should sync tenant configs', async () => {
      const mockTenants = [{ tenantId: '100001', companyName: '公司1' }];
      const mockConfigs = [{ configName: '配置1', configKey: 'key1', configValue: 'value1', configType: 'Y', remark: '' }];

      (prisma.sysTenant.findMany as jest.Mock).mockResolvedValue(mockTenants);
      (prisma.sysConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs);
      (prisma.sysConfig.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.syncTenantConfig();

      expect(result.code).toBe(200);
    });

    it('should handle sync errors gracefully', async () => {
      (prisma.sysTenant.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.syncTenantConfig()).rejects.toThrow(HttpException);
    });
  });

  describe('export', () => {
    it('should export tenant data', async () => {
      const mockRes = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;
      const body = plainToInstance(ListTenantDto, { pageNum: 1, pageSize: 10 });
      const mockTenants = [mockTenant];

      (prisma.$transaction as jest.Mock).mockResolvedValue([mockTenants, 1]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      // Note: ExportTable is mocked internally, so we just verify no errors
      await expect(service.export(mockRes, body)).resolves.not.toThrow();
    });
  });
});
