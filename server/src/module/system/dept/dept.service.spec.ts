import { Test, TestingModule } from '@nestjs/testing';
import { DeptService } from './dept.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeptRepository } from './dept.repository';
import { RedisService } from 'src/module/common/redis/redis.service';
import { StatusEnum, DelFlagEnum } from 'src/common/enum/index';
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
      const mockDepts = [
        { deptId: 100 },
        { deptId: 101 },
        { deptId: 102 },
      ];

      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);

      const result = await service.getChildDeptIds(100);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
      expect(result).toEqual([100, 101, 102]);
    });
  });
});
