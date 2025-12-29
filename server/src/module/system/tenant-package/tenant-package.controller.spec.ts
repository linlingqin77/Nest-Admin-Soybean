import { Test, TestingModule } from '@nestjs/testing';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { TenantPackageController } from './tenant-package.controller';
import { TenantPackageService } from './tenant-package.service';
import { plainToInstance } from 'class-transformer';
import { ListTenantPackageDto } from './dto/list-tenant-package.dto';

describe('TenantPackageController', () => {
  let controller: TenantPackageController;
  let service: TenantPackageService;

  const mockTenantPackageService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    changeStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantPackageController],
      providers: [
        {
          provide: TenantPackageService,
          useValue: mockTenantPackageService,
        },
        {
          provide: OperlogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<TenantPackageController>(TenantPackageController);
    service = module.get<TenantPackageService>(TenantPackageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a tenant package', async () => {
      const createDto = { packageName: '基础套餐', menuIds: [1, 2, 3] };
      const mockResult = { code: 200, msg: '创建成功' };
      mockTenantPackageService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return package list', async () => {
      const query = plainToInstance(ListTenantPackageDto, { pageNum: 1, pageSize: 10 });
      const mockResult = { code: 200, data: { rows: [], total: 0 } };
      mockTenantPackageService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return package by id', async () => {
      const mockResult = { code: 200, data: { packageId: 1 } };
      mockTenantPackageService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockResult);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a package', async () => {
      const updateDto = { packageId: 1, packageName: '更新套餐' };
      const mockResult = { code: 200, msg: '更新成功' };
      mockTenantPackageService.update.mockResolvedValue(mockResult);

      const result = await controller.update(updateDto);

      expect(result).toEqual(mockResult);
      expect(service.update).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('remove', () => {
    it('should remove packages', async () => {
      const mockResult = { code: 200, msg: '删除成功' };
      mockTenantPackageService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1,2,3');

      expect(result).toEqual(mockResult);
      expect(service.remove).toHaveBeenCalledWith([1, 2, 3]);
    });
  });
});
