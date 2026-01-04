/**
 * 公告服务单元测试
 *
 * @description
 * 测试NoticeService的CRUD方法
 * - create: 创建公告
 * - findAll: 查询公告列表
 * - findOne: 查询单个公告
 * - update: 更新公告
 * - remove: 删除公告
 *
 * _Requirements: 13.2, 13.4, 13.5_
 */

import { NoticeService } from './notice.service';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { Result } from 'src/common/response';

describe('NoticeService', () => {
  let prisma: PrismaMock;
  let service: NoticeService;
  const noticeRepo = {
    create: jest.fn(),
    findPageWithFilter: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDeleteBatch: jest.fn(),
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new NoticeService(prisma, noticeRepo as any);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a notice successfully', async () => {
      const createDto = {
        noticeTitle: '测试公告',
        noticeType: '1',
        noticeContent: '测试内容',
        status: '0',
      };

      noticeRepo.create.mockResolvedValue({ noticeId: 1, ...createDto });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(200);
      expect(noticeRepo.create).toHaveBeenCalledWith(createDto);
    });

    it('should create a notice with minimal data', async () => {
      const createDto = {
        noticeTitle: '最小公告',
        noticeType: '2',
      };

      noticeRepo.create.mockResolvedValue({ noticeId: 2, ...createDto });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(200);
      expect(noticeRepo.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated notice list', async () => {
      const mockNotices = [
        { noticeId: 1, noticeTitle: '公告1', noticeType: '1', createTime: new Date() },
        { noticeId: 2, noticeTitle: '公告2', noticeType: '2', createTime: new Date() },
      ];

      noticeRepo.findPageWithFilter.mockResolvedValue({
        list: mockNotices,
        total: 2,
      });

      const result = await service.findAll({ pageNum: 1, pageSize: 10, skip: 0, take: 10 } as any);

      expect(result.code).toBe(200);
      expect(result.data.total).toBe(2);
      expect(result.data.rows).toHaveLength(2);
    });

    it('should filter by noticeTitle', async () => {
      noticeRepo.findPageWithFilter.mockResolvedValue({
        list: [{ noticeId: 1, noticeTitle: '系统公告', createTime: new Date() }],
        total: 1,
      });

      const result = await service.findAll({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        noticeTitle: '系统',
      } as any);

      expect(result.code).toBe(200);
      expect(result.data.total).toBe(1);
      expect(noticeRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          noticeTitle: { contains: '系统' },
        }),
        0,
        10,
      );
    });

    it('should filter by noticeType', async () => {
      noticeRepo.findPageWithFilter.mockResolvedValue({
        list: [{ noticeId: 1, noticeType: '1', createTime: new Date() }],
        total: 1,
      });

      const result = await service.findAll({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        noticeType: '1',
      } as any);

      expect(result.code).toBe(200);
      expect(noticeRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          noticeType: '1',
        }),
        0,
        10,
      );
    });

    it('should filter by createBy', async () => {
      noticeRepo.findPageWithFilter.mockResolvedValue({
        list: [{ noticeId: 1, createBy: 'admin', createTime: new Date() }],
        total: 1,
      });

      const result = await service.findAll({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        createBy: 'admin',
      } as any);

      expect(result.code).toBe(200);
      expect(noticeRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          createBy: { contains: 'admin' },
        }),
        0,
        10,
      );
    });

    it('should filter by date range', async () => {
      noticeRepo.findPageWithFilter.mockResolvedValue({
        list: [],
        total: 0,
      });

      const result = await service.findAll({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        params: {
          beginTime: '2024-01-01',
          endTime: '2024-12-31',
        },
      } as any);

      expect(result.code).toBe(200);
      expect(noticeRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          createTime: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        }),
        0,
        10,
      );
    });

    it('should return empty list when no notices found', async () => {
      noticeRepo.findPageWithFilter.mockResolvedValue({
        list: [],
        total: 0,
      });

      const result = await service.findAll({ pageNum: 1, pageSize: 10, skip: 0, take: 10 } as any);

      expect(result.code).toBe(200);
      expect(result.data.total).toBe(0);
      expect(result.data.rows).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a notice by id', async () => {
      const mockNotice = {
        noticeId: 1,
        noticeTitle: '测试公告',
        noticeType: '1',
        noticeContent: '内容',
        status: '0',
      };

      noticeRepo.findById.mockResolvedValue(mockNotice);

      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockNotice);
      expect(noticeRepo.findById).toHaveBeenCalledWith(1);
    });

    it('should return null for non-existent notice', async () => {
      noticeRepo.findById.mockResolvedValue(null);

      const result = await service.findOne(99999);

      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a notice successfully', async () => {
      const updateDto = {
        noticeId: 1,
        noticeTitle: '更新后的公告',
        noticeType: '2',
        noticeContent: '更新后的内容',
        status: '0',
      };

      noticeRepo.update.mockResolvedValue({ ...updateDto });

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(200);
      expect(noticeRepo.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should update notice with partial data', async () => {
      const updateDto = {
        noticeId: 1,
        noticeTitle: '仅更新标题',
        noticeType: '1',
      };

      noticeRepo.update.mockResolvedValue({ ...updateDto });

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(200);
      expect(noticeRepo.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should soft delete notices by ids', async () => {
      noticeRepo.softDeleteBatch.mockResolvedValue({ count: 2 });

      const result = await service.remove([1, 2]);

      expect(result.code).toBe(200);
      expect(noticeRepo.softDeleteBatch).toHaveBeenCalledWith([1, 2]);
    });

    it('should soft delete a single notice', async () => {
      noticeRepo.softDeleteBatch.mockResolvedValue({ count: 1 });

      const result = await service.remove([1]);

      expect(result.code).toBe(200);
      expect(noticeRepo.softDeleteBatch).toHaveBeenCalledWith([1]);
    });

    it('should handle empty array', async () => {
      noticeRepo.softDeleteBatch.mockResolvedValue({ count: 0 });

      const result = await service.remove([]);

      expect(result.code).toBe(200);
      expect(noticeRepo.softDeleteBatch).toHaveBeenCalledWith([]);
    });
  });
});
