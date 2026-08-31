/**
 * @file Loginlog Repository Unit Tests
 * @description Migrated from src/modules/login-logs/loginlog.repository.spec.ts
 */
import { Test, TestingModule } from '@nestjs/testing';
import { LoginlogRepository } from '@/modules/login-logs/loginlog.repository';
import { PrismaService } from '@/platform/prisma';

describe('LoginlogRepository', () => {
  let repository: LoginlogRepository;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      sysLogininfor: {
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
      providers: [LoginlogRepository, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    repository = modules.get<LoginlogRepository>(LoginlogRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findPageWithFilter', () => {
    it('should return paginated login logs', async () => {
      const mockLogs = [{ infoId: 1, userName: 'admin' }];
      prismaMock.$transaction.mockResolvedValue([mockLogs, 1]);

      const result = await repository.findPageWithFilter({}, 0, 10);

      expect(result.list).toEqual(mockLogs);
      expect(result.total).toBe(1);
    });

    it('should use custom orderBy', async () => {
      prismaMock.$transaction.mockResolvedValue([[], 0]);

      await repository.findPageWithFilter({}, 0, 10, { userName: 'asc' });

      expect(prismaMock.$transaction).toHaveBeenCalled();
    });
  });

  describe('truncate', () => {
    it('should truncate login logs table', async () => {
      await repository.truncate();

      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
        'TRUNCATE TABLE "SysLogininfor" RESTART IDENTITY CASCADE',
      );
    });
  });

  describe('deleteByDays', () => {
    it('should delete logs older than specified days', async () => {
      prismaMock.sysLogininfor.deleteMany.mockResolvedValue({ count: 5 });

      const result = await repository.deleteByDays(30);

      expect(result).toBe(5);
      expect(prismaMock.sysLogininfor.deleteMany).toHaveBeenCalledWith({
        where: {
          loginTime: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });

  describe('findByUserName', () => {
    it('should find login history by username', async () => {
      const mockLogs = [{ infoId: 1, userName: 'admin' }];
      prismaMock.sysLogininfor.findMany.mockResolvedValue(mockLogs);

      const result = await repository.findByUserName('admin');

      expect(result).toEqual(mockLogs);
      expect(prismaMock.sysLogininfor.findMany).toHaveBeenCalledWith({
        where: { userName: 'admin' },
        take: 10,
        orderBy: { loginTime: 'desc' },
      });
    });

    it('should use custom limit', async () => {
      await repository.findByUserName('admin', 5);

      expect(prismaMock.sysLogininfor.findMany).toHaveBeenCalledWith({
        where: { userName: 'admin' },
        take: 5,
        orderBy: { loginTime: 'desc' },
      });
    });
  });

  describe('findByIpaddr', () => {
    it('should find login history by IP address', async () => {
      const mockLogs = [{ infoId: 1, ipaddr: '127.0.0.1' }];
      prismaMock.sysLogininfor.findMany.mockResolvedValue(mockLogs);

      const result = await repository.findByIpaddr('127.0.0.1');

      expect(result).toEqual(mockLogs);
      expect(prismaMock.sysLogininfor.findMany).toHaveBeenCalledWith({
        where: { ipaddr: '127.0.0.1' },
        take: 10,
        orderBy: { loginTime: 'desc' },
      });
    });
  });

  describe('countSuccessLogin', () => {
    it('should count successful logins', async () => {
      prismaMock.sysLogininfor.count.mockResolvedValue(100);

      const result = await repository.countSuccessLogin();

      expect(result).toBe(100);
      expect(prismaMock.sysLogininfor.count).toHaveBeenCalledWith({
        where: { status: '0' },
      });
    });

    it('should count successful logins for specific user', async () => {
      prismaMock.sysLogininfor.count.mockResolvedValue(50);

      const result = await repository.countSuccessLogin('admin');

      expect(result).toBe(50);
      expect(prismaMock.sysLogininfor.count).toHaveBeenCalledWith({
        where: { status: '0', userName: 'admin' },
      });
    });
  });

  describe('countFailedLogin', () => {
    it('should count failed logins', async () => {
      prismaMock.sysLogininfor.count.mockResolvedValue(10);

      const result = await repository.countFailedLogin();

      expect(result).toBe(10);
      expect(prismaMock.sysLogininfor.count).toHaveBeenCalledWith({
        where: { status: '1' },
      });
    });

    it('should count failed logins for specific user', async () => {
      prismaMock.sysLogininfor.count.mockResolvedValue(3);

      const result = await repository.countFailedLogin('admin');

      expect(result).toBe(3);
      expect(prismaMock.sysLogininfor.count).toHaveBeenCalledWith({
        where: { status: '1', userName: 'admin' },
      });
    });
  });

  describe('findRecentLogins', () => {
    it('should find recent login logs', async () => {
      const mockLogs = [{ infoId: 1 }, { infoId: 2 }];
      prismaMock.sysLogininfor.findMany.mockResolvedValue(mockLogs);

      const result = await repository.findRecentLogins();

      expect(result).toEqual(mockLogs);
      expect(prismaMock.sysLogininfor.findMany).toHaveBeenCalledWith({
        take: 10,
        orderBy: { loginTime: 'desc' },
      });
    });

    it('should use custom limit', async () => {
      await repository.findRecentLogins(5);

      expect(prismaMock.sysLogininfor.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: { loginTime: 'desc' },
      });
    });
  });
});
