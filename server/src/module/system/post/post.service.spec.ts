import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostRepository } from './post.repository';
import { DeptService } from '../dept/dept.service';
import { plainToInstance } from 'class-transformer';
import { ListPostDto } from './dto/list-post.dto';

describe('PostService', () => {
  let service: PostService;
  let prisma: PrismaService;
  let postRepo: PostRepository;

  const mockPrismaService = {
    sysPost: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockPostRepository = {
    create: jest.fn(),
    findPageWithFilter: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDeleteBatch: jest.fn(),
    findAll: jest.fn(),
  };

  const mockDeptService = {
    findOne: jest.fn(),
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PostRepository,
          useValue: mockPostRepository,
        },
        {
          provide: DeptService,
          useValue: mockDeptService,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    prisma = module.get<PrismaService>(PrismaService);
    postRepo = module.get<PostRepository>(PostRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a post', async () => {
      const createDto = {
        postCode: 'CEO',
        postName: '董事长',
        postSort: 1,
        status: '0',
      };
      mockPostRepository.create.mockResolvedValue({});

      const result = await service.create(createDto);

      expect(result.code).toBe(200);
      expect(postRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        postCode: 'CEO',
        postName: '董事长',
        postSort: 1,
        status: '0',
      }));
    });
  });

  describe('findAll', () => {
    it('should return post list', async () => {
      const query = plainToInstance(ListPostDto, { pageNum: 1, pageSize: 10 });
      const mockData = {
        list: [{ postId: 1, postName: '岗位1' }],
        total: 1,
      };
      mockPostRepository.findPageWithFilter.mockResolvedValue(mockData);

      const result = await service.findAll(query);

      expect(result.code).toBe(200);
      expect(postRepo.findPageWithFilter).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return post by id', async () => {
      const mockPost = { postId: 1, postName: '岗位1' };
      (mockPostRepository as any).findById = jest.fn().mockResolvedValue(mockPost);

      const result = await service.findOne(1);

      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockPost);
    });
  });

  describe('update', () => {
    it('should update a post', async () => {
      const updateDto = { postId: 1, postName: '更新岗位', postCode: 'CEO', postSort: 1 };
      mockPostRepository.update.mockResolvedValue({});

      const result = await service.update(updateDto);

      expect(result.code).toBe(200);
      expect(postRepo.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('should remove posts', async () => {
      mockPostRepository.softDeleteBatch.mockResolvedValue({ count: 2 });

      const result = await service.remove(['1', '2']);

      expect(result.code).toBe(200);
      expect(postRepo.softDeleteBatch).toHaveBeenCalledWith([1, 2]);
    });
  });
});
