import { Test, TestingModule } from '@nestjs/testing';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { UserService } from '../user/user.service';
import { plainToInstance } from 'class-transformer';
import { ListRoleDto } from './dto/list-role.dto';

describe('RoleController', () => {
  let controller: RoleController;
  let service: RoleService;

  const mockRoleService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    changeStatus: jest.fn(),
    dataScope: jest.fn(),
    allocatedList: jest.fn(),
    unallocatedList: jest.fn(),
    cancelAuthUser: jest.fn(),
    cancelAuthUserAll: jest.fn(),
    selectAuthUserAll: jest.fn(),
    export: jest.fn(),
  };

  const mockUserService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: mockRoleService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: OperlogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<RoleController>(RoleController);
    service = module.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a role', async () => {
      const createDto = { roleName: '测试角色', roleKey: 'test', roleSort: 1, dataScope: 'ALL' as any };
      const userTool = { injectCreate: jest.fn((dto) => dto), injectUpdate: jest.fn((dto) => dto) };
      const mockResult = { code: 200, msg: '创建成功' };
      mockRoleService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto, userTool);

      expect(result).toEqual(mockResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return role list', async () => {
      const query = plainToInstance(ListRoleDto, { pageNum: 1, pageSize: 10 });
      const mockUser = { userId: 1, userName: 'admin' } as any;
      const mockResult = { code: 200, data: { rows: [], total: 0 } };
      mockRoleService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query, mockUser);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return role by id', async () => {
      const mockResult = { code: 200, data: { roleId: 1 } };
      mockRoleService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockResult);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const updateDto = { 
        roleId: 1, 
        roleName: '更新角色', 
        roleKey: 'updated', 
        dataScope: 'ALL' as any,
        roleSort: 1,
        status: '0'
      };
      const mockResult = { code: 200, msg: '更新成功' };
      mockRoleService.update.mockResolvedValue(mockResult);

      const result = await controller.update(updateDto as any);

      expect(result).toEqual(mockResult);
      expect(service.update).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('remove', () => {
    it('should remove roles', async () => {
      const mockResult = { code: 200, msg: '删除成功' };
      mockRoleService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1,2,3');

      expect(result).toEqual(mockResult);
      expect(service.remove).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('changeStatus', () => {
    it('should change role status', async () => {
      const changeDto = { roleId: 1, status: '1' };
      const mockResult = { code: 200, msg: '状态修改成功' };
      mockRoleService.changeStatus.mockResolvedValue(mockResult);

      const result = await controller.changeStatus(changeDto);

      expect(result).toEqual(mockResult);
      expect(service.changeStatus).toHaveBeenCalledWith(changeDto);
    });
  });

  describe('dataScope', () => {
    it('should update data scope', async () => {
      const dataScopeDto = { 
        roleId: 1, 
        roleName: '测试角色', 
        roleKey: 'test', 
        dataScope: 'CUSTOM' as any, 
        deptIds: [1, 2],
        roleSort: 1,
        status: '0'
      };
      const mockResult = { code: 200, msg: '修改成功' };
      mockRoleService.dataScope.mockResolvedValue(mockResult);

      const result = await controller.dataScope(dataScopeDto as any);

      expect(result).toEqual(mockResult);
      expect(service.dataScope).toHaveBeenCalledWith(dataScopeDto);
    });
  });
});
