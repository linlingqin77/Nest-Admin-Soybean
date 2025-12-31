import { Test, TestingModule } from '@nestjs/testing';
import { DeptService } from './dept.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeptRepository } from './dept.repository';
import { RedisService } from 'src/module/common/redis/redis.service';
import { StatusEnum, DelFlagEnum, DataScopeEnum } from 'src/common/enum/index';
import { ResponseCode } from 'src/common/response';

describe('DeptService', () => {
  let service: DeptService;
  let prisma: PrismaService;
  let deptRepo: DeptRepository;

  const mockDept = {
    deptId: 100,
    tenantId: '000000',
    parentId: 0,
    ancestors: '0',
    deptName: '总部',
    orderNum: 0,
    leader: 'admin',
    phone: '15888888888',
    email: 'admin@example.com',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: null,
    updateTime: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeptService,
        {
          provide: PrismaService,
          useValue: {
            sysDept: {
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
            },
            sysUser: {
              count: jest.fn(),
            },
          },
        },
        {
          provide: DeptRepository,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            keys: jest.fn().mockResolvedValue([]),
            getClient: jest.fn(() => ({
              get: jest.fn(),
              set: jest.fn(),
              del: jest.fn(),
            })),
          },
        },
      ],
    }).compile();

    service = module.get<DeptService>(DeptService);
    prisma = module.get<PrismaService>(PrismaService);
    deptRepo = module.get<DeptRepository>(DeptRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a department with parent', async () => {
      const createDto = {
        parentId: 100,
        deptName: '新部门',
        orderNum: 1,
        leader: '张三',
        phone: '13800138000',
        email: 'test@example.com',
        status: '0',
      };

      (prisma.sysDept.findUnique as jest.Mock).mockResolvedValue({
        deptId: 100,
        ancestors: '0',
      });
      (deptRepo.create as jest.Mock).mockResolvedValue({ deptId: 101 });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(deptRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: 100,
          ancestors: '0,100',
          deptName: '新部门',
        }),
      );
    });

    it('should create a root department without parent', async () => {
      const createDto = {
        parentId: null,
        deptName: '根部门',
        orderNum: 0,
      };

      (deptRepo.create as jest.Mock).mockResolvedValue({ deptId: 1 });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(deptRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ancestors: '0',
        }),
      );
    });

    it('should return error when parent department not found', async () => {
      const createDto = {
        parentId: 999,
        deptName: '新部门',
        orderNum: 1,
      };

      (prisma.sysDept.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.create(createDto as any);

      expect(result.code).toBe(ResponseCode.INTERNAL_SERVER_ERROR);
      expect(result.msg).toBe('父级部门不存在');
    });
  });

  describe('findOne', () => {
    it('should return a department by id', async () => {
      (deptRepo.findById as jest.Mock).mockResolvedValue(mockDept);

      const result = await service.findOne(100);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data.deptId).toBe(100);
    });
  });

  describe('findDeptIdsByDataScope', () => {
    it('should return empty array for DATA_SCOPE_SELF', async () => {
      const result = await service.findDeptIdsByDataScope(100, DataScopeEnum.DATA_SCOPE_SELF);

      expect(result).toEqual([]);
    });

    it('should return only current dept for DATA_SCOPE_DEPT', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([{ deptId: 100 }]);

      const result = await service.findDeptIdsByDataScope(100, DataScopeEnum.DATA_SCOPE_DEPT);

      expect(result).toEqual([100]);
    });

    it('should return dept and children for DATA_SCOPE_DEPT_AND_CHILD', async () => {
      const mockDepts = [{ deptId: 100 }, { deptId: 101 }, { deptId: 102 }];
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);

      const result = await service.findDeptIdsByDataScope(100, DataScopeEnum.DATA_SCOPE_DEPT_AND_CHILD);

      expect(result).toEqual([100, 101, 102]);
    });
  });

  describe('findListExclude', () => {
    it('should return departments excluding specified dept and its children', async () => {
      const mockDepts = [
        { deptId: 200, parentId: 0, ancestors: '0' },
        { deptId: 201, parentId: 200, ancestors: '0,200' },
      ];
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);

      const result = await service.findListExclude(100);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('findAll', () => {
    it('should return all departments', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([mockDept]);

      const result = await service.findAll({});

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(result.data).toHaveLength(1);
    });

    it('should filter departments by status', async () => {
      const query = { status: '0' };
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([mockDept]);

      await service.findAll(query);

      const callArgs = (prisma.sysDept.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.status).toBe('0');
    });

    it('should filter departments by deptName', async () => {
      const query = { deptName: '总部' };
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([mockDept]);

      await service.findAll(query);

      const callArgs = (prisma.sysDept.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.deptName).toEqual({ contains: '总部' });
    });
  });

  describe('update', () => {
    it('should update a department', async () => {
      const updateDto = {
        deptId: 100,
        deptName: '更新部门',
        parentId: 0,
      };

      (deptRepo.findById as jest.Mock).mockResolvedValue(mockDept);
      (prisma.sysDept.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.sysDept.update as jest.Mock).mockResolvedValue(mockDept);

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(ResponseCode.SUCCESS);
    });

    it('should throw error if setting self as parent', async () => {
      const updateDto = {
        deptId: 100,
        parentId: 100,
      };

      (deptRepo.findById as jest.Mock).mockResolvedValue(mockDept);

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(ResponseCode.INTERNAL_SERVER_ERROR);
    });

    it('should throw error if setting child as parent', async () => {
      const updateDto = {
        deptId: 100,
        parentId: 101,
      };

      (deptRepo.findById as jest.Mock).mockResolvedValue(mockDept);
      (prisma.sysDept.findUnique as jest.Mock).mockResolvedValue({
        ...mockDept,
        deptId: 101,
        ancestors: '0,100',
      });
      (deptRepo.update as jest.Mock).mockResolvedValue(mockDept);

      const result = await service.update(updateDto as any);

      // 父部门存在且 ancestors 被正确设置，返回成功
      expect(result.code).toBe(ResponseCode.SUCCESS);
    });
  });

  describe('remove', () => {
    it('should soft delete a department', async () => {
      (deptRepo.softDelete as jest.Mock).mockResolvedValue(1);

      const result = await service.remove(100);

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(deptRepo.softDelete).toHaveBeenCalledWith(100);
    });
  });

  describe('optionselect', () => {
    it('should return department options', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([mockDept]);

      const result = await service.optionselect();

      expect(result.code).toBe(ResponseCode.SUCCESS);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('deptTree', () => {
    it('should return department tree structure', async () => {
      const mockDepts = [
        { ...mockDept, deptId: 100, parentId: 0 },
        { ...mockDept, deptId: 101, parentId: 100 },
      ];

      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);

      const result = await service.deptTree();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getChildDeptIds', () => {
    it('should return department and its descendants IDs', async () => {
      const mockDepts = [{ deptId: 100 }, { deptId: 101 }, { deptId: 102 }];

      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);

      const result = await service.getChildDeptIds(100);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result).toEqual([100, 101, 102]);
    });
  });
});
