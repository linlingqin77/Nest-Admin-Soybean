import { Test, TestingModule } from '@nestjs/testing';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { plainToInstance } from 'class-transformer';
import { ListTenantDto } from './dto/list-tenant.dto';

describe('TenantController', () => {
  let controller: TenantController;
  let service: TenantService;

  const mockTenantService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    changeStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
        {
          provide: OperlogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<TenantController>(TenantController);
    service = module.get<TenantService>(TenantService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a tenant', async () => {
      const createDto = { tenantId: '100000', companyName: '测试公司', username: 'admin', password: 'password123' };
      const mockResult = { code: 200, msg: '创建成功' };
      mockTenantService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return tenant list', async () => {
      const query = plainToInstance(ListTenantDto, { pageNum: 1, pageSize: 10 });
      const mockResult = { code: 200, data: { rows: [], total: 0 } };
      mockTenantService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return tenant by id', async () => {
      const mockResult = { code: 200, data: { tenantId: '100000' } };
      mockTenantService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('100000');

      expect(result).toEqual(mockResult);
      expect(service.findOne).toHaveBeenCalledWith(100000);
    });
  });

  describe('update', () => {
    it('should update a tenant', async () => {
      const updateDto = { id: 1, tenantId: '100000', companyName: '更新公司' };
      const mockResult = { code: 200, msg: '更新成功' };
      mockTenantService.update.mockResolvedValue(mockResult);

      const result = await controller.update(updateDto);

      expect(result).toEqual(mockResult);
      expect(service.update).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('remove', () => {
    it('should remove tenants', async () => {
      const mockResult = { code: 200, msg: '删除成功' };
      mockTenantService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('100000,100001');

      expect(result).toEqual(mockResult);
      expect(service.remove).toHaveBeenCalledWith([100000, 100001]);
    });
  });
});
