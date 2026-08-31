/**
 * @file Operlog Repository Unit Tests
 * @description Migrated from src/modules/oper-logs/operlog.repository.spec.ts
 */
import { Test, TestingModule } from '@nestjs/testing';
import { OperlogRepository } from '@/modules/oper-logs/operlog.repository';
import { PrismaService } from '@/platform/prisma';

describe('OperlogRepository', () => {
  let repository: OperlogRepository;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      sysOperLog: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn().mockImplementation(async (arg) => {
        if (typeof arg === 'function') return arg(prismaMock);
        return arg;
      }),
      $executeRawUnsafe: jest.fn().mockResolvedValue(0),
    };

    const modules: TestingModule = await Test.createTestingModule({
      providers: [OperlogRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = modules.get<OperlogRepository>(OperlogRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPageWithFilter', () => {
    it('should return paginated operation logs', async () => {
      const mockLogs = [{ operId: 1, title: 'Test' }];
      prismaMock.$transaction.mockResolvedValue([mockLogs, 1]);

      const result = await repository.findPageWithFilter({}, 0, 10);

      expect(result.list).toEqual(mockLogs);
      expect(result.total).toBe(1);
    });

    it('should use custom orderBy', async () => {
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await repository.findPageWithFilter({}, 0, 10, { title: 'asc' });

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('truncate', () => {
    it('should truncate operation logs table', async () => {
      await repository.truncate();

      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith('TRUNCATE TABLE "SysOperLog" RESTART IDENTITY CASCADE');
    });
  });

  describe('deleteByDays', () => {
    it('should delete logs older than specified days', async () => {
      prismaMock.sysOperLog.deleteMany.mockResolvedValue({ count: 10 });

      const result = await repository.deleteByDays(30);

      expect(result).toBe(10);
      expect(prismaMock.sysOperLog.deleteMany).toHaveBeenCalledWith({
        where: {
          operTime: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });

  describe('countByBusinessType', () => {
    it('should count logs by business type', async () => {
      prismaMock.sysOperLog.count.mockResolvedValue(25);

      const result = await repository.countByBusinessType(1);

      expect(result).toBe(25);
      expect(prismaMock.sysOperLog.count).toHaveBeenCalledWith({
        where: { businessType: 1 },
      });
    });
  });

  describe('countByOperName', () => {
    it('should count logs by operator name', async () => {
      prismaMock.sysOperLog.count.mockResolvedValue(50);

      const result = await repository.countByOperName('admin');

      expect(result).toBe(50);
      expect(prismaMock.sysOperLog.count).toHaveBeenCalledWith({
        where: { operName: 'admin' },
      });
    });
  });

  describe('findRecentLogs', () => {
    it('should find recent operation logs', async () => {
      const mockLogs = [{ operId: 1 }, { operId: 2 }];
      prismaMock.sysOperLog.findMany.mockResolvedValue(mockLogs);

      const result = await repository.findRecentLogs();

      expect(result).toEqual(mockLogs);
      expect(prismaMock.sysOperLog.findMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: { operTime: 'desc' },
      });
    });

    it('should use custom limit', async () => {
      await repository.findRecentLogs(5);

      expect(prismaMock.sysOperLog.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: { operTime: 'desc' },
      });
    });
  });
});
