import { Test, TestingModule } from '@nestjs/testing';
import { OperlogService } from 'src/module/monitor/operlog/operlog.service';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { plainToInstance } from 'class-transformer';
import { ListMenuDto } from './dto/list-menu.dto';

describe('MenuController', () => {
  let controller: MenuController;
  let service: MenuService;

  const mockMenuService = {
    getMenuListByUserId: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    treeSelect: jest.fn(),
    roleMenuTreeselect: jest.fn(),
    tenantPackageMenuTreeselect: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    cascadeRemove: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    userId: 1,
    userName: 'admin',
    tenantId: '000000',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MenuController],
      providers: [
        {
          provide: MenuService,
          useValue: mockMenuService,
        },
        {
          provide: OperlogService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<MenuController>(MenuController);
    service = module.get<MenuService>(MenuService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getRouters', () => {
    it('should return user routers', async () => {
      const mockResult = { code: 200, data: [] };
      mockMenuService.getMenuListByUserId.mockResolvedValue(mockResult);

      const result = await controller.getRouters(mockUser as any);

      expect(result).toEqual(mockResult);
      expect(service.getMenuListByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe('create', () => {
    it('should create a menu', async () => {
      const createDto = {
        menuName: '测试菜单',
        parentId: 0,
        orderNum: 1,
        path: '/test',
        component: 'test/index',
        menuType: 'C',
        visible: '0',
        status: '0',
        query: '',
        isCache: '0',
        isFrame: '1',
        perms: 'test:menu:list',
      };
      const mockResult = { code: 200, msg: '创建成功' };
      mockMenuService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockResult);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return menu list', async () => {
      const query = plainToInstance(ListMenuDto, { menuName: '测试' });
      const mockResult = { code: 200, data: [] };
      mockMenuService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('treeSelect', () => {
    it('should return menu tree', async () => {
      const mockResult = { code: 200, data: [] };
      mockMenuService.treeSelect.mockResolvedValue(mockResult);

      const result = await controller.treeSelect();

      expect(result).toEqual(mockResult);
      expect(service.treeSelect).toHaveBeenCalled();
    });
  });

  describe('roleMenuTreeselect', () => {
    it('should return role menu tree', async () => {
      const mockResult = { code: 200, data: { menus: [], checkedKeys: [] } };
      mockMenuService.roleMenuTreeselect.mockResolvedValue(mockResult);

      const result = await controller.roleMenuTreeselect('1');

      expect(result).toEqual(mockResult);
      expect(service.roleMenuTreeselect).toHaveBeenCalledWith(1);
    });
  });

  describe('tenantPackageMenuTreeselect', () => {
    it('should return tenant package menu tree', async () => {
      const mockResult = { code: 200, data: { menus: [], checkedKeys: [] } };
      mockMenuService.tenantPackageMenuTreeselect.mockResolvedValue(mockResult);

      const result = await controller.tenantPackageMenuTreeselect('1');

      expect(result).toEqual(mockResult);
      expect(service.tenantPackageMenuTreeselect).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne', () => {
    it('should return menu by id', async () => {
      const mockResult = { code: 200, data: { menuId: 1, menuName: '测试菜单' } };
      mockMenuService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockResult);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a menu', async () => {
      const updateDto = {
        menuId: 1,
        menuName: '更新菜单',
        parentId: 0,
        orderNum: 2,
        query: '',
        menuType: 'C',
        isCache: '0',
        isFrame: '1',
        perms: 'test:menu:list',
        path: '/test',
        visible: '0',
        status: '0',
      };
      const mockResult = { code: 200, msg: '更新成功' };
      mockMenuService.update.mockResolvedValue(mockResult);

      const result = await controller.update(updateDto);

      expect(result).toEqual(mockResult);
      expect(service.update).toHaveBeenCalledWith(updateDto);
    });
  });

  describe('cascadeRemove', () => {
    it('should cascade remove menus', async () => {
      const mockResult = { code: 200, msg: '删除成功' };
      mockMenuService.cascadeRemove.mockResolvedValue(mockResult);

      const result = await controller.cascadeRemove('1,2,3');

      expect(result).toEqual(mockResult);
      expect(service.cascadeRemove).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('remove', () => {
    it('should remove a menu', async () => {
      const mockResult = { code: 200, msg: '删除成功' };
      mockMenuService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('1');

      expect(result).toEqual(mockResult);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
