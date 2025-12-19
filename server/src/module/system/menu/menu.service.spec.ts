import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MenuRepository } from './menu.repository';
import { UserService } from '../user/user.service';
import { RedisService } from 'src/module/common/redis/redis.service';
import { StatusEnum, DelFlagEnum } from 'src/common/enum/index';
import { ResponseCode } from 'src/common/response';

describe('MenuService', () => {
    let service: MenuService;
    let prisma: PrismaService;
    let menuRepo: MenuRepository;
    let userService: UserService;

    const mockMenu = {
        menuId: 1,
        tenantId: '000000',
        menuName: '系统管理',
        parentId: 0,
        orderNum: 1,
        path: '/system',
        component: 'Layout',
        query: null,
        routeName: 'System',
        isFrame: '1',
        isCache: '0',
        menuType: 'M',
        visible: '0',
        status: StatusEnum.NORMAL,
        perms: null,
        icon: 'system',
        createBy: 'admin',
        createTime: new Date(),
        updateBy: null,
        updateTime: null,
        remark: '系统管理目录',
        delFlag: DelFlagEnum.NORMAL,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MenuService,
                {
                    provide: PrismaService,
                    useValue: {
                        sysMenu: {
                            create: jest.fn(),
                            update: jest.fn(),
                            updateMany: jest.fn(),
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                        },
                        sysRoleMenu: {
                            findMany: jest.fn(),
                        },
                    },
                },
                {
                    provide: MenuRepository,
                    useValue: {
                        findById: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                        softDelete: jest.fn(),
                        findAllMenus: jest.fn(),
                        findRoleMenus: jest.fn(),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        getRoleIds: jest.fn(),
                    },
                },
                {
                    provide: RedisService,
                    useValue: {
                        get: jest.fn(),
                        set: jest.fn(),
                        del: jest.fn(),
                        keys: jest.fn().mockResolvedValue([]),
                        getClient: jest.fn(() => ({
                            get: jest.fn(),
                            set: jest.fn(),
                            del: jest.fn(),
                        })),
                    },
                },
            ],
        }).compile();

        service = module.get<MenuService>(MenuService);
        prisma = module.get<PrismaService>(PrismaService);
        menuRepo = module.get<MenuRepository>(MenuRepository);
        userService = module.get<UserService>(UserService);
    });

    describe('update', () => {
        it('should update a menu', async () => {
            const updateDto = {
                menuId: 1,
                menuName: '更新菜单',
            };

            (menuRepo.update as jest.Mock).mockResolvedValue(mockMenu);

            const result = await service.update(updateDto as any);

            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(menuRepo.update).toHaveBeenCalledWith(1, updateDto);
        });
    });

    describe('remove', () => {
        it('should soft delete a menu', async () => {
            (menuRepo.softDelete as jest.Mock).mockResolvedValue(mockMenu);

            const result = await service.remove(1);

            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(menuRepo.softDelete).toHaveBeenCalledWith(1);
        });

        it('should throw error if menu has children', async () => {
            (menuRepo.softDelete as jest.Mock).mockRejectedValue(
                new Error('存在子菜单，不允许删除')
            );

            await expect(service.remove(1)).rejects.toThrow();
        });
    });

    describe('treeSelect', () => {
        it('should return menu tree structure', async () => {
            (menuRepo.findAllMenus as jest.Mock).mockResolvedValue([mockMenu]);

            const result = await service.treeSelect();

            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(result.data).toBeDefined();
        });
    });

    describe('getMenuListByUserId', () => {
        it('should return menu list for user', async () => {
            const mockMenus = [mockMenu];
            (userService.getRoleIds as jest.Mock).mockResolvedValue([2]);
            (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([
                { menuId: 1 },
            ]);
            (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue(mockMenus);

            const result = await service.getMenuListByUserId(1);

            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(result.data).toBeDefined();
        });
    });

    describe('roleMenuTreeselect', () => {
        it('should return menu tree with checked keys', async () => {
            (menuRepo.findAllMenus as jest.Mock).mockResolvedValue([mockMenu]);
            (menuRepo.findRoleMenus as jest.Mock).mockResolvedValue([{ menuId: 1 }]);

            const result = await service.roleMenuTreeselect(1);

            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(result.data.menus).toBeDefined();
            expect(result.data.checkedKeys).toEqual([1]);
        });
    });
});
