import { Test, TestingModule } from '@nestjs/testing';
import { NoticeRepository } from './notice.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';

describe('NoticeRepository', () => {
  let repository: NoticeRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockNotice = {
    noticeId: 1,
    noticeTitle: '系统维护通知',
    noticeType: '1',
    noticeContent: '系统将于今晚进行维护',
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  const mockPrisma = {
    sysNotice: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoticeRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<NoticeRepository>(NoticeRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByNoticeTitle', () => {
    it('should find notice by title', async () => {
      mockPrisma.sysNotice.findFirst.mockResolvedValue(mockNotice);

      const result = await repository.findByNoticeTitle('系统维护通知');

      expect(result).toEqual(mockNotice);
    });

    it('should return null if notice not found', async () => {
      mockPrisma.sysNotice.findFirst.mockResolvedValue(null);

      const result = await repository.findByNoticeTitle('不存在');

      expect(result).toBeNull();
    });
  });

  describe('existsByNoticeTitle', () => {
    it('should return true if notice title exists', async () => {
      mockPrisma.sysNotice.count.mockResolvedValue(1);

      const result = await repository.existsByNoticeTitle('系统维护通知');

      expect(result).toBe(true);
    });

    it('should return false if notice title does not exist', async () => {
      mockPrisma.sysNotice.count.mockResolvedValue(0);

      const result = await repository.existsByNoticeTitle('不存在');

      expect(result).toBe(false);
    });

    it('should exclude specific notice id when checking', async () => {
      mockPrisma.sysNotice.count.mockResolvedValue(0);

      const result = await repository.existsByNoticeTitle('系统维护通知', 1);

      expect(result).toBe(false);
    });
  });

  describe('findPageWithFilter', () => {
    it('should return paginated notices', async () => {
      const mockNotices = [mockNotice];
      mockPrisma.$transaction.mockResolvedValue([mockNotices, 1]);

      const result = await repository.findPageWithFilter({}, 0, 10);

      expect(result).toEqual({ list: mockNotices, total: 1 });
    });

    it('should apply where conditions', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const where = { noticeType: '1' as any };
      await repository.findPageWithFilter(where, 0, 10);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findByNoticeType', () => {
    it('should find notices by type', async () => {
      mockPrisma.sysNotice.findMany.mockResolvedValue([mockNotice]);

      const result = await repository.findByNoticeType('1');

      expect(result).toEqual([mockNotice]);
    });

    it('should return empty array if no notices found', async () => {
      mockPrisma.sysNotice.findMany.mockResolvedValue([]);

      const result = await repository.findByNoticeType('99');

      expect(result).toEqual([]);
    });
  });

  describe('countByStatus', () => {
    it('should count notices by status', async () => {
      mockPrisma.sysNotice.count.mockResolvedValue(5);

      const result = await repository.countByStatus(StatusEnum.NORMAL);

      expect(result).toBe(5);
    });

    it('should return 0 if no notices with status', async () => {
      mockPrisma.sysNotice.count.mockResolvedValue(0);

      const result = await repository.countByStatus(StatusEnum.DISABLED);

      expect(result).toBe(0);
    });
  });

  describe('inherited methods from SoftDeleteRepository', () => {
    it('should have access to findById', async () => {
      // SoftDeleteRepository.findById uses findOne which uses findFirst
      mockPrisma.sysNotice.findFirst.mockResolvedValue(mockNotice);

      const result = await repository.findById(1);

      expect(result).toEqual(mockNotice);
    });

    it('should return null if not found', async () => {
      mockPrisma.sysNotice.findFirst.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it('should have access to findAll', async () => {
      mockPrisma.sysNotice.findMany.mockResolvedValue([mockNotice]);

      const result = await repository.findAll();

      expect(result).toEqual([mockNotice]);
    });

    it('should have access to create', async () => {
      mockPrisma.sysNotice.create.mockResolvedValue(mockNotice);

      const result = await repository.create({
        noticeTitle: '新通知',
        noticeType: '1',
        noticeContent: '内容',
      } as any);

      expect(result).toEqual(mockNotice);
    });

    it('should have access to update', async () => {
      const updatedNotice = { ...mockNotice, noticeTitle: 'Updated' };
      mockPrisma.sysNotice.update.mockResolvedValue(updatedNotice);

      const result = await repository.update(1, { noticeTitle: 'Updated' });

      expect(result.noticeTitle).toBe('Updated');
    });

    it('should have access to softDelete', async () => {
      const deletedNotice = { ...mockNotice, delFlag: DelFlagEnum.DELETED };
      mockPrisma.sysNotice.update.mockResolvedValue(deletedNotice);

      const result = await repository.softDelete(1);

      expect(result.delFlag).toBe(DelFlagEnum.DELETED);
    });
  });
});
