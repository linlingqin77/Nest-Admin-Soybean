import { Test, TestingModule } from '@nestjs/testing';
import { PostRepository } from './post.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatusEnum, DelFlagEnum } from 'src/common/enum';

describe('PostRepository', () => {
  let repository: PostRepository;
  let prisma: jest.Mocked<PrismaService>;

  const mockPost = {
    postId: 1,
    postCode: 'ceo',
    postName: '董事长',
    postSort: 1,
    deptId: null,
    status: StatusEnum.NORMAL,
    delFlag: DelFlagEnum.NORMAL,
    createBy: 'admin',
    createTime: new Date(),
    updateBy: 'admin',
    updateTime: new Date(),
    remark: null,
  };

  const mockPrisma = {
    sysPost: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    sysUserPost: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    repository = module.get<PostRepository>(PostRepository);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByPostCode', () => {
    it('should find post by code', async () => {
      mockPrisma.sysPost.findFirst.mockResolvedValue(mockPost);

      const result = await repository.findByPostCode('ceo');

      expect(result).toEqual(mockPost);
    });

    it('should return null if post not found', async () => {
      mockPrisma.sysPost.findFirst.mockResolvedValue(null);

      const result = await repository.findByPostCode('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('existsByPostCode', () => {
    it('should return true if post code exists', async () => {
      mockPrisma.sysPost.count.mockResolvedValue(1);

      const result = await repository.existsByPostCode('ceo');

      expect(result).toBe(true);
    });

    it('should return false if post code does not exist', async () => {
      mockPrisma.sysPost.count.mockResolvedValue(0);

      const result = await repository.existsByPostCode('nonexistent');

      expect(result).toBe(false);
    });

    it('should exclude specific post id when checking', async () => {
      mockPrisma.sysPost.count.mockResolvedValue(0);

      const result = await repository.existsByPostCode('ceo', 1);

      expect(result).toBe(false);
    });
  });

  describe('existsByPostName', () => {
    it('should return true if post name exists', async () => {
      mockPrisma.sysPost.count.mockResolvedValue(1);

      const result = await repository.existsByPostName('董事长');

      expect(result).toBe(true);
    });

    it('should return false if post name does not exist', async () => {
      mockPrisma.sysPost.count.mockResolvedValue(0);

      const result = await repository.existsByPostName('不存在');

      expect(result).toBe(false);
    });

    it('should exclude specific post id when checking', async () => {
      mockPrisma.sysPost.count.mockResolvedValue(0);

      const result = await repository.existsByPostName('董事长', 1);

      expect(result).toBe(false);
    });
  });

  describe('findPageWithFilter', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [mockPost];
      mockPrisma.$transaction.mockResolvedValue([mockPosts, 1]);

      const result = await repository.findPageWithFilter({}, 0, 10);

      expect(result).toEqual({ list: mockPosts, total: 1 });
    });

    it('should apply where conditions', async () => {
      mockPrisma.$transaction.mockResolvedValue([[], 0]);

      const where = { status: StatusEnum.NORMAL };
      await repository.findPageWithFilter(where, 0, 10);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('findForSelect', () => {
    it('should find posts for select without filter', async () => {
      mockPrisma.sysPost.findMany.mockResolvedValue([mockPost]);

      const result = await repository.findForSelect();

      expect(result).toEqual([mockPost]);
    });

    it('should filter by deptId', async () => {
      mockPrisma.sysPost.findMany.mockResolvedValue([mockPost]);

      const result = await repository.findForSelect(1);

      expect(result).toEqual([mockPost]);
    });

    it('should filter by postIds', async () => {
      mockPrisma.sysPost.findMany.mockResolvedValue([mockPost]);

      const result = await repository.findForSelect(undefined, [1, 2]);

      expect(result).toEqual([mockPost]);
    });

    it('should filter by both deptId and postIds', async () => {
      mockPrisma.sysPost.findMany.mockResolvedValue([mockPost]);

      const result = await repository.findForSelect(1, [1, 2]);

      expect(result).toEqual([mockPost]);
    });
  });

  describe('findUserPosts', () => {
    it('should find user posts', async () => {
      mockPrisma.sysPost.findMany.mockResolvedValue([mockPost]);

      const result = await repository.findUserPosts(1);

      expect(result).toEqual([mockPost]);
    });

    it('should return empty array if user has no posts', async () => {
      mockPrisma.sysPost.findMany.mockResolvedValue([]);

      const result = await repository.findUserPosts(999);

      expect(result).toEqual([]);
    });
  });

  describe('countUsers', () => {
    it('should count users in post', async () => {
      mockPrisma.sysUserPost.count.mockResolvedValue(5);

      const result = await repository.countUsers(1);

      expect(result).toBe(5);
    });

    it('should return 0 if no users in post', async () => {
      mockPrisma.sysUserPost.count.mockResolvedValue(0);

      const result = await repository.countUsers(999);

      expect(result).toBe(0);
    });
  });

  describe('inherited methods from SoftDeleteRepository', () => {
    it('should have access to findById', async () => {
      // SoftDeleteRepository.findById uses findOne which uses findFirst
      mockPrisma.sysPost.findFirst.mockResolvedValue(mockPost);

      const result = await repository.findById(1);

      expect(result).toEqual(mockPost);
    });

    it('should return null if not found', async () => {
      mockPrisma.sysPost.findFirst.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });

    it('should have access to findAll', async () => {
      mockPrisma.sysPost.findMany.mockResolvedValue([mockPost]);

      const result = await repository.findAll();

      expect(result).toEqual([mockPost]);
    });

    it('should have access to create', async () => {
      mockPrisma.sysPost.create.mockResolvedValue(mockPost);

      const result = await repository.create({
        postCode: 'ceo',
        postName: '董事长',
        postSort: 1,
      } as any);

      expect(result).toEqual(mockPost);
    });

    it('should have access to update', async () => {
      const updatedPost = { ...mockPost, postName: 'Updated' };
      mockPrisma.sysPost.update.mockResolvedValue(updatedPost);

      const result = await repository.update(1, { postName: 'Updated' });

      expect(result.postName).toBe('Updated');
    });

    it('should have access to softDelete', async () => {
      const deletedPost = { ...mockPost, delFlag: DelFlagEnum.DELETED };
      mockPrisma.sysPost.update.mockResolvedValue(deletedPost);

      const result = await repository.softDelete(1);

      expect(result.delFlag).toBe(DelFlagEnum.DELETED);
    });
  });
});
