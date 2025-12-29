import { Test, TestingModule } from '@nestjs/testing';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { NoticeController } from './notice.controller';
import { NoticeService } from './notice.service';
import { plainToInstance } from 'class-transformer';
import { ListNoticeDto } from './dto/list-notice.dto';

describe('NoticeController', () => {
  let controller: NoticeController;
  let service: NoticeService;

  const mockNoticeService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoticeController],
      providers: [
        {
          provide: NoticeService,
          useValue: mockNoticeService,
        },
        {
          provide: OperlogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<NoticeController>(NoticeController);
    service = module.get<NoticeService>(NoticeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notice', async () => {
      const createDto = { noticeTitle: '测试通知', noticeType: '1', noticeContent: '内容' };
      const mockUserTool = { injectCreate: jest.fn((dto) => dto), injectUpdate: jest.fn((dto) => dto) };
      const mockResult = { code: 200, msg: '创建成功' };
      mockNoticeService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto, mockUserTool);

      expect(result).toEqual(mockResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return notice list', async () => {
      const query = plainToInstance(ListNoticeDto, { pageNum: 1, pageSize: 10 });
      const mockResult = { code: 200, data: { rows: [], total: 0 } };
      mockNoticeService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return notice by id', async () => {
      const mockResult = { code: 200, data: { noticeId: 1 } };
      mockNoticeService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockResult);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a notice', async () => {
      const updateDto = { noticeId: 1, noticeTitle: '更新通知', noticeType: '1', noticeContent: '内容' };
      const mockResult = { code: 200, msg: '更新成功' };
      mockNoticeService.update.mockResolvedValue(mockResult);

      const result = await controller.update(updateDto);

      expect(result).toEqual(mockResult);
      expect(service.update).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('remove', () => {
    it('should remove notices', async () => {
      const mockResult = { code: 200, msg: '删除成功' };
      mockNoticeService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1,2,3');

      expect(result).toEqual(mockResult);
      expect(service.remove).toHaveBeenCalledWith([1, 2, 3]);
    });
  });
});
