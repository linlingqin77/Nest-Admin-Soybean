import { Test, TestingModule } from '@nestjs/testing';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { plainToInstance } from 'class-transformer';
import { ListPostDto } from './dto/list-post.dto';

describe('PostController', () => {
  let controller: PostController;
  let service: PostService;

  const mockPostService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    export: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        {
          provide: PostService,
          useValue: mockPostService,
        },
        {
          provide: OperlogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<PostController>(PostController);
    service = module.get<PostService>(PostService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a post', async () => {
      const createDto = { postCode: 'CEO', postName: '董事长', postSort: 1 };
      const mockUserTool = { injectCreate: jest.fn((dto) => dto), injectUpdate: jest.fn((dto) => dto) };
      const mockResult = { code: 200, msg: '创建成功' };
      mockPostService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto, mockUserTool);

      expect(result).toEqual(mockResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return post list', async () => {
      const query = plainToInstance(ListPostDto, { pageNum: 1, pageSize: 10 });
      const mockResult = { code: 200, data: { rows: [], total: 0 } };
      mockPostService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return post by id', async () => {
      const mockResult = { code: 200, data: { postId: 1 } };
      mockPostService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockResult);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a post', async () => {
      const updateDto = { postId: 1, postName: '更新岗位', postCode: 'CEO', postSort: 1 };
      const mockResult = { code: 200, msg: '更新成功' };
      mockPostService.update.mockResolvedValue(mockResult);

      const result = await controller.update(updateDto);

      expect(result).toEqual(mockResult);
      expect(service.update).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('remove', () => {
    it('should remove posts', async () => {
      const mockResult = { code: 200, msg: '删除成功' };
      mockPostService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1,2,3');

      expect(result).toEqual(mockResult);
      expect(service.remove).toHaveBeenCalledWith(['1', '2', '3']);
    });
  });
});
