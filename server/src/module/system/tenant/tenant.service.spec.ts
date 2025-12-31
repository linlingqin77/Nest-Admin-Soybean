import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { ResponseCode } from 'src/common/response';
import { BusinessException } from 'src/common/exceptions';

describe('TenantService', () => {
  let service: TenantService;
  let prisma: PrismaService;
  let redisService: RedisService;

  const mockTenant = {
    id: 1,
    tenantId: '100001',
    contactUserName: '张三',
    contactPhone: '13800138000',
    companyName: '测试公司',
    licenseNumber: '91110000MA00XXXXX',
    address: '北京市朝阳区',
    intro: '测试公司简介',
    domain: 'test.example.com',
    packageId: 1,
    expireTime: new Date('2025-12-31'),
    accountCount: 10,
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  const mockTenant2 = {
    ...mockTenant,
    id: 2,
    tenantId: '100002',
    companyName: '测试公司2',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantService,
        {
          provide: PrismaService,
          useValue: {
            sysTenant: {
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              count: jest.fn(),
            },
            sysUser: {
              create: jest.fn(),
            },
            sysTenantPackage: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            sysDictType: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            sysDictData: {
              findMany: jest.fn(),
              createMany: jest.fn(),
            },
            sysConfig: {
              findMany: jest.fn(),
              createMany: jest.fn(),
            },
            $transaction: jest.fn((fn) => {
              if (Array.isArray(fn)) return Promise.all(fn);
              return fn(prisma);
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantService>(TenantService);
    prisma = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a tenant with auto-generated tenantId', async () => {
      const createDto = {
        contactUserName: '张三',
        contactPhone: '13800138000',
        companyName: '新公司',
        username: 'admin',
        password: 'password123',
        packageId: 1,
      };

      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValueOnce({ tenantId: '100001' });
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValueOnce(null);
      (prisma.sysTenant.create as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.sysUser.create as jest.Mock).mockResolvedValue({});

      const result = await service.create(createDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.sysTenant.create).toHaveBeenCalled();
      expect(prisma.sysUser.create).toHaveBeenCalled();
    });

    it('should create a tenant with provided tenantId', async () => {
      const createDto = {
        tenantId: '200001',
        contactUserName: '张三',
        contactPhone: '13800138000',
        companyName: '新公司',
        username: 'admin',
        password: 'password123',
      };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.create as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.sysUser.create as jest.Mock).mockResolvedValue({});

      const result = await service.create(createDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
    });

    it('should throw error when tenantId already exists', async () => {
      const createDto = {
        tenantId: '100001',
        contactUserName: '张三',
        companyName: '新公司',
        username: 'admin',
        password: 'password123',
      };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      await expect(service.create(createDto as any)).rejects.toThrow(BusinessException);
    });

    it('should throw error when company name already exists', async () => {
      const createDto = {
        contactUserName: '张三',
        companyName: '测试公司',
        username: 'admin',
        password: 'password123',
      };

      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValueOnce({ tenantId: '100001' });
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValueOnce(mockTenant);

      await expect(service.create(createDto as any)).rejects.toThrow(BusinessException);
    });
  });

  describe('findAll', () => {
    it('should return paginated tenant list', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
      };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockTenant], 1]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([
        { packageId: 1, packageName: '基础套餐' },
      ]);

      const result = await service.findAll(query as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should filter tenants by tenantId', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        tenantId: '100001',
      };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockTenant], 1]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(query as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter tenants by contactUserName', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        contactUserName: '张三',
      };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockTenant], 1]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(query as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter tenants by companyName', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        companyName: '测试',
      };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockTenant], 1]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(query as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter tenants by status', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        status: StatusEnum.NORMAL,
      };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockTenant], 1]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(query as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter tenants by date range', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        beginTime: '2024-01-01',
        endTime: '2024-12-31',
      };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockTenant], 1]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll(query as any);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should return empty list when no tenants found', async () => {
      const query = {
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
      };

      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);
      (prisma.sysTenantPackage.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll(query as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.rows).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a tenant by id', async () => {
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const result = await service.findOne(1);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toEqual(mockTenant);
    });

    it('should throw error when tenant not found', async () => {
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(BusinessException);
    });
  });

  describe('update', () => {
    it('should update tenant successfully', async () => {
      const updateDto = {
        id: 1,
        contactUserName: '李四',
        contactPhone: '13900139000',
      };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.sysTenant.update as jest.Mock).mockResolvedValue({ ...mockTenant, ...updateDto });

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.sysTenant.update).toHaveBeenCalled();
    });

    it('should throw error when tenant not found', async () => {
      const updateDto = {
        id: 999,
        contactUserName: '李四',
      };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update(updateDto as any)).rejects.toThrow(BusinessException);
    });

    it('should throw error when company name already exists', async () => {
      const updateDto = {
        id: 1,
        companyName: '测试公司2',
      };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValue(mockTenant2);

      await expect(service.update(updateDto as any)).rejects.toThrow(BusinessException);
    });

    it('should allow updating to same company name', async () => {
      const updateDto = {
        id: 1,
        companyName: '测试公司',
        contactUserName: '李四',
      };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.sysTenant.update as jest.Mock).mockResolvedValue({ ...mockTenant, ...updateDto });

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
    });
  });

  describe('remove', () => {
    it('should soft delete tenants', async () => {
      (prisma.sysTenant.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.remove([1, 2]);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.sysTenant.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        data: { delFlag: '1' },
      });
    });
  });

  describe('syncTenantDict', () => {
    it('should sync dictionaries to all tenants', async () => {
      const mockTenants = [
        { tenantId: '100001', companyName: '公司1' },
        { tenantId: '100002', companyName: '公司2' },
      ];

      const mockDictTypes = [
        { dictId: 1, dictName: '性别', dictType: 'sys_user_sex', status: '0', remark: '' },
      ];

      (prisma.sysTenant.findMany as jest.Mock).mockResolvedValue(mockTenants);
      (prisma.sysDictType.findMany as jest.Mock).mockResolvedValue(mockDictTypes);
      (prisma.sysDictType.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.sysDictType.create as jest.Mock).mockResolvedValue({});
      (prisma.sysDictData.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.syncTenantDict();

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.detail.tenants).toBe(2);
    });

    it('should skip existing dict types', async () => {
      const mockTenants = [{ tenantId: '100001', companyName: '公司1' }];
      const mockDictTypes = [{ dictId: 1, dictName: '性别', dictType: 'sys_user_sex' }];

      (prisma.sysTenant.findMany as jest.Mock).mockResolvedValue(mockTenants);
      (prisma.sysDictType.findMany as jest.Mock).mockResolvedValue(mockDictTypes);
      (prisma.sysDictType.findFirst as jest.Mock).mockResolvedValue({ dictId: 1 }); // Already exists

      const result = await service.syncTenantDict();

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.sysDictType.create).not.toHaveBeenCalled();
    });
  });

  describe('syncTenantPackage', () => {
    it('should sync package to tenant', async () => {
      const params = {
        tenantId: '100001',
        packageId: 2,
      };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.sysTenantPackage.findUnique as jest.Mock).mockResolvedValue({
        packageId: 2,
        packageName: '高级套餐',
        menuIds: '1,2,3',
      });
      (prisma.sysTenant.update as jest.Mock).mockResolvedValue({ ...mockTenant, packageId: 2 });

      const result = await service.syncTenantPackage(params);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(prisma.sysTenant.update).toHaveBeenCalled();
    });

    it('should throw error when tenant not found', async () => {
      const params = {
        tenantId: '999999',
        packageId: 2,
      };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.syncTenantPackage(params)).rejects.toThrow(HttpException);
    });

    it('should throw error when package not found', async () => {
      const params = {
        tenantId: '100001',
        packageId: 999,
      };

      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);
      (prisma.sysTenantPackage.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.syncTenantPackage(params)).rejects.toThrow(HttpException);
    });
  });

  describe('syncTenantConfig', () => {
    it('should sync configs to all tenants', async () => {
      const mockTenants = [
        { tenantId: '100001', companyName: '公司1' },
        { tenantId: '100002', companyName: '公司2' },
      ];

      const mockConfigs = [
        { configId: 1, configName: '主框架页', configKey: 'sys.index.skinName', configValue: 'skin-blue' },
      ];

      (prisma.sysTenant.findMany as jest.Mock).mockResolvedValue(mockTenants);
      (prisma.sysConfig.findMany as jest.Mock).mockResolvedValue(mockConfigs);
      (prisma.sysConfig.createMany as jest.Mock).mockResolvedValue({ count: 1 });
      (redisService.del as jest.Mock).mockResolvedValue(1);

      const result = await service.syncTenantConfig();

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.detail.tenants).toBe(2);
      expect(redisService.del).toHaveBeenCalledTimes(2);
    });
  });
});
