/**
 * 岗位服务单元测试
 *
 * @description
 * 测试PostService的CRUD方法
 * - create: 创建岗位
 * - findAll: 查询岗位列表
 * - findOne: 查询单个岗位
 * - update: 更新岗位
 * - remove: 删除岗位
 * - optionselect: 岗位选择框列表
 *
 * _Requirements: 14.2, 14.4, 14.5_
 */

import { PostService } from './post.service';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { Result } from 'src/common/response';
import { ExportTable } from 'src/common/utils/export';

jest.mock('src/common/utils/export', () => ({
  ExportTable: jest.fn(),
}));

describe('PostService', () => {
  let prisma: PrismaMock;
  let service: PostService;
  const postRepo = {
    create: jest.fn(),
    findPageWithFilter: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDeleteBatch: jest.fn(),
    findForSelect: jest.fn(),
  };
  const deptService = {
    getChildDeptIds: jest.fn().mockResolvedValue([]),
    deptTree: jest.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new PostService(prisma, deptService as any, postRepo as any);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a post successfully', async () => {
      const createDto = {
        postCode: 'ceo',
        postName: '董事长',
        postSort: 1,
        status: '0',
        remark: '公司最高领导',
      };

      postRepo.create.mockResolvedValue({ postId: 1, ...createDto });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(200);
      expect(postRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          postCode: 'ceo',
          postName: '董事长',
        }),
      );
    });

    it('should create a post with default values', async () => {
      const createDto = {
        postCode: 'manager',
        postName: '经理',
      };

      postRepo.create.mockResolvedValue({ postId: 2, ...createDto, postSort: 0, status: '0' });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(200);
      expect(postRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          postCode: 'manager',
          postName: '经理',
          postSort: 0,
          status: '0',
        }),
      );
    });

    it('should create a post with deptId', async () => {
      const createDto = {
        postCode: 'dev',
        postName: '开发工程师',
        deptId: 100,
      };

      postRepo.create.mockResolvedValue({ postId: 3, ...createDto });

      const result = await service.create(createDto as any);

      expect(result.code).toBe(200);
      expect(postRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          deptId: 100,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated post list', async () => {
      const mockPosts = [
        { postId: 1, postCode: 'ceo', postName: '董事长', postSort: 1, createTime: new Date() },
        { postId: 2, postCode: 'manager', postName: '经理', postSort: 2, createTime: new Date() },
      ];

      postRepo.findPageWithFilter.mockResolvedValue({
        list: mockPosts,
        total: 2,
      });

      const result = await service.findAll({ pageNum: 1, pageSize: 10, skip: 0, take: 10 } as any);

      expect(result.code).toBe(200);
      expect(result.data.total).toBe(2);
      expect(result.data.rows).toHaveLength(2);
    });

    it('should filter by postName', async () => {
      postRepo.findPageWithFilter.mockResolvedValue({
        list: [{ postId: 1, postName: '经理', createTime: new Date() }],
        total: 1,
      });

      const result = await service.findAll({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        postName: '经理',
      } as any);

      expect(result.code).toBe(200);
      expect(result.data.total).toBe(1);
      expect(postRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          postName: { contains: '经理' },
        }),
        0,
        10,
      );
    });

    it('should filter by postCode', async () => {
      postRepo.findPageWithFilter.mockResolvedValue({
        list: [{ postId: 1, postCode: 'ceo', createTime: new Date() }],
        total: 1,
      });

      const result = await service.findAll({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        postCode: 'ceo',
      } as any);

      expect(result.code).toBe(200);
      expect(postRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          postCode: { contains: 'ceo' },
        }),
        0,
        10,
      );
    });

    it('should filter by status', async () => {
      postRepo.findPageWithFilter.mockResolvedValue({
        list: [{ postId: 1, status: '0', createTime: new Date() }],
        total: 1,
      });

      const result = await service.findAll({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        status: '0',
      } as any);

      expect(result.code).toBe(200);
      expect(postRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          status: '0',
        }),
        0,
        10,
      );
    });

    it('should filter by belongDeptId', async () => {
      deptService.getChildDeptIds.mockResolvedValue([100, 101, 102]);
      postRepo.findPageWithFilter.mockResolvedValue({
        list: [{ postId: 1, deptId: 100, createTime: new Date() }],
        total: 1,
      });

      const result = await service.findAll({
        pageNum: 1,
        pageSize: 10,
        skip: 0,
        take: 10,
        belongDeptId: '100',
      } as any);

      expect(result.code).toBe(200);
      expect(deptService.getChildDeptIds).toHaveBeenCalledWith(100);
      expect(postRepo.findPageWithFilter).toHaveBeenCalledWith(
        expect.objectContaining({
          deptId: { in: [100, 101, 102] },
        }),
        0,
        10,
      );
    });

    it('should return empty list when no posts found', async () => {
      postRepo.findPageWithFilter.mockResolvedValue({
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
    it('should return a post by id', async () => {
      const mockPost = {
        postId: 1,
        postCode: 'ceo',
        postName: '董事长',
        postSort: 1,
        status: '0',
      };

      postRepo.findById.mockResolvedValue(mockPost);

      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockPost);
      expect(postRepo.findById).toHaveBeenCalledWith(1);
    });

    it('should return null for non-existent post', async () => {
      postRepo.findById.mockResolvedValue(null);

      const result = await service.findOne(99999);

      expect(result.code).toBe(200);
      expect(result.data).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a post successfully', async () => {
      const updateDto = {
        postId: 1,
        postCode: 'ceo_updated',
        postName: '董事长(更新)',
        postSort: 1,
        status: '0',
      };

      postRepo.update.mockResolvedValue({ ...updateDto });

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(200);
      expect(postRepo.update).toHaveBeenCalledWith(1, updateDto);
    });

    it('should update post with partial data', async () => {
      const updateDto = {
        postId: 1,
        postName: '仅更新名称',
        postCode: 'test',
      };

      postRepo.update.mockResolvedValue({ ...updateDto });

      const result = await service.update(updateDto as any);

      expect(result.code).toBe(200);
      expect(postRepo.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should soft delete posts by ids', async () => {
      postRepo.softDeleteBatch.mockResolvedValue({ count: 2 });

      const result = await service.remove(['1', '2']);

      expect(result.code).toBe(200);
      expect(postRepo.softDeleteBatch).toHaveBeenCalledWith([1, 2]);
    });

    it('should soft delete a single post', async () => {
      postRepo.softDeleteBatch.mockResolvedValue({ count: 1 });

      const result = await service.remove(['1']);

      expect(result.code).toBe(200);
      expect(postRepo.softDeleteBatch).toHaveBeenCalledWith([1]);
    });

    it('should handle empty array', async () => {
      postRepo.softDeleteBatch.mockResolvedValue({ count: 0 });

      const result = await service.remove([]);

      expect(result.code).toBe(200);
      expect(postRepo.softDeleteBatch).toHaveBeenCalledWith([]);
    });
  });

  describe('optionselect', () => {
    it('should return post options list', async () => {
      const mockPosts = [
        { postId: 1, postCode: 'ceo', postName: '董事长' },
        { postId: 2, postCode: 'manager', postName: '经理' },
      ];

      postRepo.findForSelect.mockResolvedValue(mockPosts);

      const result = await service.optionselect();

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockPosts);
      expect(postRepo.findForSelect).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should filter by deptId', async () => {
      const mockPosts = [{ postId: 1, postCode: 'dev', postName: '开发工程师', deptId: 100 }];

      postRepo.findForSelect.mockResolvedValue(mockPosts);

      const result = await service.optionselect(100);

      expect(result.code).toBe(200);
      expect(postRepo.findForSelect).toHaveBeenCalledWith(100, undefined);
    });

    it('should filter by postIds', async () => {
      const mockPosts = [{ postId: 1, postCode: 'ceo', postName: '董事长' }];

      postRepo.findForSelect.mockResolvedValue(mockPosts);

      const result = await service.optionselect(undefined, [1, 2]);

      expect(result.code).toBe(200);
      expect(postRepo.findForSelect).toHaveBeenCalledWith(undefined, [1, 2]);
    });
  });

  describe('deptTree', () => {
    it('should return department tree', async () => {
      const mockTree = [
        { id: 1, label: '总公司', children: [{ id: 2, label: '研发部' }] },
      ];

      deptService.deptTree.mockResolvedValue(mockTree);

      const result = await service.deptTree();

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockTree);
      expect(deptService.deptTree).toHaveBeenCalled();
    });
  });

  describe('export', () => {
    it('should export post list to Excel', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue(
        Result.ok({
          rows: [
            { postId: 1, postCode: 'ceo', postName: '董事长', postSort: 1, status: '0' },
          ],
          total: 1,
        }) as any,
      );

      const mockRes = {} as any;
      await service.export(mockRes, {} as any);

      expect(ExportTable).toHaveBeenCalledWith(
        expect.objectContaining({
          sheetName: '岗位数据',
          data: expect.any(Array),
          header: expect.arrayContaining([
            expect.objectContaining({ title: '岗位序号' }),
            expect.objectContaining({ title: '岗位编码' }),
            expect.objectContaining({ title: '岗位名称' }),
          ]),
        }),
        mockRes,
      );
    });

    it('should remove pagination params before export', async () => {
      const findAllSpy = jest.spyOn(service, 'findAll').mockResolvedValue(
        Result.ok({ rows: [], total: 0 }) as any,
      );

      const mockRes = {} as any;
      await service.export(mockRes, { pageNum: 1, pageSize: 10 } as any);

      expect(findAllSpy).toHaveBeenCalledWith(
        expect.not.objectContaining({
          pageNum: expect.anything(),
          pageSize: expect.anything(),
        }),
      );
    });
  });
});
