import { Test, TestingModule } from '@nestjs/testing';
import { DeptLoader } from './dept.loader';
import { PrismaService } from '../../prisma/prisma.service';
import { DelFlagEnum } from '../enum';

describe('DeptLoader', () => {
  let loader: DeptLoader;
  let prisma: jest.Mocked<PrismaService>;

  const mockDepts = [
    {
      deptId: 1,
      parentId: 0,
      ancestors: '0',
      deptName: '总公司',
      orderNum: 0,
      leader: '张三',
      phone: '13800138000',
      email: 'admin@example.com',
      status: '0',
      delFlag: '0',
      tenantId: '000000',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
    },
    {
      deptId: 2,
      parentId: 1,
      ancestors: '0,1',
      deptName: '研发部',
      orderNum: 1,
      leader: '李四',
      phone: '13800138001',
      email: 'dev@example.com',
      status: '0',
      delFlag: '0',
      tenantId: '000000',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
    },
    {
      deptId: 3,
      parentId: 1,
      ancestors: '0,1',
      deptName: '市场部',
      orderNum: 2,
      leader: '王五',
      phone: '13800138002',
      email: 'market@example.com',
      status: '0',
      delFlag: '0',
      tenantId: '000000',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
    },
  ];

  beforeEach(async () => {
    const mockPrisma = {
      sysDept: {
        findMany: jest.fn(),
      },
      sysUser: {
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeptLoader,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    loader = await module.resolve<DeptLoader>(DeptLoader);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('load', () => {
    it('should load a single department by ID', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([mockDepts[0]]);

      const result = await loader.load(1);

      expect(result).toEqual(mockDepts[0]);
      expect(prisma.sysDept.findMany).toHaveBeenCalledWith({
        where: {
          deptId: { in: [1] },
          delFlag: DelFlagEnum.NORMAL,
        },
      });
    });

    it('should return null for non-existent department', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([]);

      const result = await loader.load(999);

      expect(result).toBeNull();
    });

    it('should batch multiple load calls', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts.slice(0, 2));

      // Call load multiple times in the same tick
      const [result1, result2] = await Promise.all([loader.load(1), loader.load(2)]);

      expect(result1).toEqual(mockDepts[0]);
      expect(result2).toEqual(mockDepts[1]);
      // Should only make one database call
      expect(prisma.sysDept.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.sysDept.findMany).toHaveBeenCalledWith({
        where: {
          deptId: { in: [1, 2] },
          delFlag: DelFlagEnum.NORMAL,
        },
      });
    });
  });

  describe('loadMany', () => {
    it('should load multiple departments', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);

      const results = await loader.loadMany([1, 2, 3]);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(mockDepts[0]);
      expect(results[1]).toEqual(mockDepts[1]);
      expect(results[2]).toEqual(mockDepts[2]);
    });

    it('should return null for missing departments', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([mockDepts[0]]);

      const results = await loader.loadMany([1, 999]);

      expect(results[0]).toEqual(mockDepts[0]);
      expect(results[1]).toBeNull();
    });
  });

  describe('loadDirectChildren', () => {
    it('should load direct children of departments', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([mockDepts[1], mockDepts[2]]);

      const result = await loader.loadDirectChildren([1]);

      expect(result.get(1)).toHaveLength(2);
      expect(result.get(1)).toContainEqual(mockDepts[1]);
      expect(result.get(1)).toContainEqual(mockDepts[2]);
    });

    it('should return empty array for departments without children', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([]);

      const result = await loader.loadDirectChildren([2]);

      expect(result.get(2)).toEqual([]);
    });
  });

  describe('loadUserCounts', () => {
    it('should load user counts for departments', async () => {
      (prisma.sysUser.groupBy as jest.Mock).mockResolvedValue([
        { deptId: 1, _count: { userId: 5 } },
        { deptId: 2, _count: { userId: 10 } },
      ]);

      const result = await loader.loadUserCounts([1, 2, 3]);

      expect(result.get(1)).toBe(5);
      expect(result.get(2)).toBe(10);
      expect(result.get(3)).toBe(0);
    });
  });

  describe('loadAncestors', () => {
    it('should load ancestor departments', async () => {
      // First call returns the department with ancestors
      (prisma.sysDept.findMany as jest.Mock)
        .mockResolvedValueOnce([{ deptId: 2, ancestors: '0,1' }])
        .mockResolvedValueOnce([mockDepts[0]]);

      const result = await loader.loadAncestors([2]);

      expect(result.get(2)).toHaveLength(1);
      expect(result.get(2)?.[0]).toEqual(mockDepts[0]);
    });

    it('should return empty array for root departments', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValueOnce([{ deptId: 1, ancestors: '0' }]);

      const result = await loader.loadAncestors([1]);

      expect(result.get(1)).toEqual([]);
    });
  });

  describe('cache operations', () => {
    it('should clear cache for specific key', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([mockDepts[0]]);

      await loader.load(1);
      loader.clear(1);

      // After clearing, should make another database call
      await loader.load(1);
      expect(prisma.sysDept.findMany).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts.slice(0, 2));

      await loader.loadMany([1, 2]);
      loader.clearAll();

      // After clearing all, should make another database call
      await loader.load(1);
      expect(prisma.sysDept.findMany).toHaveBeenCalledTimes(2);
    });

    it('should prime cache with value', async () => {
      loader.prime(1, mockDepts[0]);

      const result = await loader.load(1);

      expect(result).toEqual(mockDepts[0]);
      // Should not make database call since value was primed
      expect(prisma.sysDept.findMany).not.toHaveBeenCalled();
    });
  });
});
