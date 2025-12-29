import { Test, TestingModule } from '@nestjs/testing';
import { NoticeService } from './notice.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NoticeRepository } from './notice.repository';
import { plainToInstance } from 'class-transformer';
import { ListNoticeDto } from './dto/list-notice.dto';

describe('NoticeService', () => {
  let service: NoticeService;
  let prisma: PrismaService;
  let noticeRepo: NoticeRepository;

  const mockPrismaService = {
    sysNotice: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockNoticeRepository = {
    create: jest.fn(),
    findPageWithFilter: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoticeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NoticeRepository,
          useValue: mockNoticeRepository,
        },
      ],
    }).compile();

    service = module.get<NoticeService>(NoticeService);
    prisma = module.get<PrismaService>(PrismaService);
    noticeRepo = module.get<NoticeRepository>(NoticeRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notice', async () => {
      const createDto = {
        noticeTitle: '测试通知',
        noticeType: '1',
        noticeContent: '测试内容',
        status: '0',
      };
      mockNoticeRepository.create.mockResolvedValue({});

      const result = await service.create(createDto);

      expect(result.code).toBe(200);
      expect(noticeRepo.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return notice list', async () => {
      const query = plainToInstance(ListNoticeDto, { pageNum: 1, pageSize: 10 });
      const mockData = {
        list: [{ noticeId: 1, noticeTitle: '通知1' }],
        total: 1,
      };
      mockNoticeRepository.findPageWithFilter.mockResolvedValue(mockData);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(noticeRepo.findPageWithFilter).toHaveBeenCalled();
    });

    it('should filter by notice title', async () => {
      const query = plainToInstance(ListNoticeDto, { noticeTitle: '测试', pageNum: 1, pageSize: 10 });
      const mockData = { list: [], total: 0 };
      mockNoticeRepository.findPageWithFilter.mockResolvedValue(mockData);

      await service.findAll(query);

      expect(noticeRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          noticeTitle: { contains: '测试' },
        }),
        0,
        10,
      );
    });
  });
});
