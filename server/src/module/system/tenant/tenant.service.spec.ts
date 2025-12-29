import { Test, TestingModule } from '@nestjs/testing';
import { TenantService } from './tenant.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TenantRepository } from './tenant.repository';
import { RedisService } from 'src/module/common/redis/redis.service';
import { MockServiceFactory } from 'src/test-utils/mocks/service.mock';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { plainToInstance } from 'class-transformer';
import { ListTenantDto } from './dto/list-tenant.dto';

describe('TenantService', () => {
  let service: TenantService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let tenantRepo: TenantRepository;

  const mockTenantRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDeleteBatch: jest.fn(),
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

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
          useValue: MockServiceFactory.createRedisService(),
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
    it('should create a tenant', async () => {
      const createDto = {
        tenantId: '100000',
        contactUserName: '张三',
        contactPhone: '13800138000',
        companyName: '测试公司',
        packageId: 1,
        username: 'admin',
        password: 'Admin@123',
      } as any;
      
      // Mock prisma methods used in create
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.sysTenant.create as jest.Mock).mockResolvedValue({});
      (prisma.sysUser.create as jest.Mock).mockResolvedValue({});

      const result = await service.create(createDto);

      expect(result.code).toBe(200);
      expect(prisma.sysTenant.create).toHaveBeenCalled();
      expect(prisma.sysUser.create).toHaveBeenCalled();
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
  });

  describe('findOne', () => {
    it('should return tenant by id', async () => {
      const mockTenant = { id: 1, tenantId: '100000', companyName: '公司1' };
      (prisma.sysTenant.findUnique as jest.Mock).mockResolvedValue(mockTenant);

      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockTenant);
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
  });

  describe('remove', () => {
    it('should remove tenants', async () => {
      (prisma.sysTenant.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.remove([1, 2]);

      expect(result.code).toBe(200);
    });
  });
});
