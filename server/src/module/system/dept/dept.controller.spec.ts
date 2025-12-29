import { Test, TestingModule } from '@nestjs/testing';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { DeptController } from './dept.controller';
import { DeptService } from './dept.service';
import { Status } from '@prisma/client';
import { Result } from 'src/common/response';

describe('DeptController', () => {
  let controller: DeptController;
  let service: jest.Mocked<DeptService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeptController],
      providers: [
        {
          provide: DeptService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            findListExclude: jest.fn(),
            optionselect: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: OperlogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<DeptController>(DeptController);
    service = module.get(DeptService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a dept', async () => {
      const createDto = {
        parentId: 100,
        deptName: '测试部门',
        orderNum: 1,
        leader: '张三',
        phone: '13800138000',
        email: 'test@example.com',
        status: Status.NORMAL,
      };
      const userTool = {
        injectCreate: jest.fn((dto) => dto),
        injectUpdate: jest.fn((dto) => dto),
      } as any;
      const mockResult = Result.ok();

      service.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto, userTool);

      expect(result.code).toBe(200);
      expect(userTool.injectCreate).toHaveBeenCalledWith(createDto);
      expect(service.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return dept list', async () => {
      const query = {};
      const mockResult = Result.ok([]);

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result.code).toBe(200);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by deptName', async () => {
      const query = { deptName: '测试' };
      const mockResult = Result.ok([]);

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result.code).toBe(200);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by status', async () => {
      const query = { status: Status.NORMAL };
      const mockResult = Result.ok([]);

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result.code).toBe(200);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('optionselect', () => {
    it('should return dept option list', async () => {
      const mockResult = Result.ok([]);

      service.optionselect.mockResolvedValue(mockResult);

      const result = await controller.optionselect();

      expect(result.code).toBe(200);
      expect(service.optionselect).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single dept by id', async () => {
      const mockResult = Result.ok({
        deptId: 1,
        deptName: '测试部门',
      });

      service.findOne.mockResolvedValue(mockResult as any);

      const result = await controller.findOne('1');

      expect(result.code).toBe(200);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should convert string id to number', async () => {
      const mockResult = Result.ok({});

      service.findOne.mockResolvedValue(mockResult as any);

      await controller.findOne('123');

      expect(service.findOne).toHaveBeenCalledWith(123);
    });
  });

  describe('findListExclude', () => {
    it('should return dept list excluding specified node', async () => {
      const mockResult = Result.ok([]);

      service.findListExclude.mockResolvedValue(mockResult as any);

      const result = await controller.findListExclude('1');

      expect(result.code).toBe(200);
      expect(service.findListExclude).toHaveBeenCalledWith(1);
    });

    it('should convert string id to number', async () => {
      const mockResult = Result.ok([]);

      service.findListExclude.mockResolvedValue(mockResult as any);

      await controller.findListExclude('100');

      expect(service.findListExclude).toHaveBeenCalledWith(100);
    });
  });

  describe('update', () => {
    it('should update a dept', async () => {
      const updateDto = {
        deptId: 1,
        parentId: 0,
        deptName: '更新部门',
        orderNum: 2,
      };
      const mockResult = Result.ok();

      service.update.mockResolvedValue(mockResult);

      const result = await controller.update(updateDto);

      expect(result.code).toBe(200);
      expect(service.update).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a dept', async () => {
      const mockResult = Result.ok();

      service.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1');

      expect(result.code).toBe(200);
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should convert string id to number', async () => {
      const mockResult = Result.ok();

      service.remove.mockResolvedValue(mockResult);

      await controller.remove('100');

      expect(service.remove).toHaveBeenCalledWith(100);
    });
  });
});
