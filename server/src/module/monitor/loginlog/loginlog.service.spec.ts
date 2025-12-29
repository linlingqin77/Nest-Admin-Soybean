import { Test, TestingModule } from '@nestjs/testing';
import { LoginlogService } from './loginlog.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { createPrismaMock } from 'src/test-utils/prisma-mock';
import { Status, DelFlag } from '@prisma/client';
import { ListLoginlogDto } from './dto/list-loginlog.dto';
import { plainToInstance } from 'class-transformer';

const DelFlagEnum = DelFlag;

describe('LoginlogService', () => {
  let service: LoginlogService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const mockLoginLog = {
    infoId: 1,
    userName: 'testuser',
    ipaddr: '127.0.0.1',
    loginLocation: '内网IP',
    browser: 'Chrome',
    os: 'Windows 10',
    status: Status.NORMAL,
    msg: '登录成功',
    loginTime: new Date(),
    delFlag: '0',
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginlogService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<LoginlogService>(LoginlogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a login log', async () => {
      const createDto = {
        userName: 'testuser',
        ipaddr: '127.0.0.1',
        loginLocation: '内网IP',
        browser: 'Chrome',
        os: 'Windows 10',
        status: Status.NORMAL,
        msg: '登录成功',
      };

      (prisma.sysLogininfor.create as jest.Mock).mockResolvedValue(mockLoginLog as any);

      const result = await service.create(createDto);

      expect(result).toEqual(mockLoginLog);
      expect(prisma.sysLogininfor.create).toHaveBeenCalled();
    });

    it('should create login log with default values', async () => {
      (prisma.sysLogininfor.create as jest.Mock).mockResolvedValue(mockLoginLog as any);

      await service.create({});

      expect(prisma.sysLogininfor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userName: '',
          ipaddr: '',
          loginLocation: '',
          browser: '',
          os: '',
          msg: '',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated login log list', async () => {
      const mockLogs = [mockLoginLog];
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockLogs, 1]);

      const query = plainToInstance(ListLoginlogDto, { pageNum: 1, pageSize: 10 });
      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });

    it('should filter by username', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const query = plainToInstance(ListLoginlogDto, { userName: 'test', pageNum: 1, pageSize: 10 });
      await service.findAll(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter by IP address', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const query = plainToInstance(ListLoginlogDto, { ipaddr: '127.0.0.1', pageNum: 1, pageSize: 10 });
      await service.findAll(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter by status', async () => {
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      const query = plainToInstance(ListLoginlogDto, { status: Status.NORMAL, pageNum: 1, pageSize: 10 });
      await service.findAll(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const query = plainToInstance(ListLoginlogDto, {
        pageNum: 1,
        pageSize: 10,
        params: {
          beginTime: '2024-01-01',
          endTime: '2024-12-31',
        },
      });

      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove login logs by ids', async () => {
      (prisma.sysLogininfor.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await service.remove(['1', '2']);

      expect(result.code).toBe(200);
      expect(result.data).toBe(2);
      expect(prisma.sysLogininfor.updateMany).toHaveBeenCalledWith({
        where: { infoId: { in: [1, 2] } },
        data: { delFlag: DelFlagEnum.DELETED },
      });
    });

    it('should handle empty id array', async () => {
      (prisma.sysLogininfor.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await service.remove([]);

      expect(result.code).toBe(200);
      expect(result.data).toBe(0);
    });
  });

  describe('removeAll', () => {
    it('should remove all login logs', async () => {
      (prisma.sysLogininfor.updateMany as jest.Mock).mockResolvedValue({ count: 100 });

      const result = await service.removeAll();

      expect(result.code).toBe(200);
      expect(prisma.sysLogininfor.updateMany).toHaveBeenCalledWith({
        data: { delFlag: DelFlagEnum.DELETED },
      });
    });
  });

  describe('unlock', () => {
    it('should unlock user', async () => {
      const result = await service.unlock('testuser');

      expect(result.code).toBe(200);
    });
  });

  describe('export', () => {
    it('should export login logs to xlsx', async () => {
      const mockResponse = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;

      (prisma.$transaction as jest.Mock).mockResolvedValue([[mockLoginLog], 1]);

      const query = plainToInstance(ListLoginlogDto, { pageNum: 1, pageSize: 10 });
      await service.export(mockResponse, query);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
