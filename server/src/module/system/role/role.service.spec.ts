import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleRepository } from './role.repository';
import { MenuService } from '../menu/menu.service';
import { DelFlagEnum, StatusEnum } from 'src/common/enum/index';
import { ResponseCode } from 'src/common/response';

describe('RoleService', () => {
    let service: RoleService;
    let prisma: PrismaService;
    let roleRepo: RoleRepository;
    let menuService: MenuService;

    const mockRole = {
        roleId: 1,
        tenantId: '000000',
        roleName: '管理员',
        roleKey: 'admin',
        roleSort: 1,
        dataScope: '1',
        menuCheckStrictly: false,
        deptCheckStrictly: false,
        status: StatusEnum.NORMAL,
        delFlag: DelFlagEnum.NORMAL,
        createBy: 'admin',
        createTime: new Date(),
        updateBy: 'admin',
        updateTime: new Date(),
        remark: null,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleService,
                {
                    provide: PrismaService,
                    useValue: {
                        sysRole: {
                            create: jest.fn(),
                            update: jest.fn(),
                            updateMany: jest.fn(),
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                        },
                        sysRoleMenu: {
                            createMany: jest.fn(),
                            deleteMany: jest.fn(),
                            findMany: jest.fn(),
                        },
                        sysRoleDept: {
                            createMany: jest.fn(),
                            deleteMany: jest.fn(),
                            findMany: jest.fn(),
                        },
                        sysDept: {
                            findMany: jest.fn(),
                        },
                        sysMenu: {
                            findMany: jest.fn(),
                        },
                    },
                },
                {
                    provide: RoleRepository,
                    useValue: {
                        findById: jest.fn(),
                        findPageWithMenuCount: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                    },
                },
                {
                    provide: MenuService,
                    useValue: {
                        findAllMenus: jest.fn(),
                        buildMenus: jest.fn(),
                        findMany: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<RoleService>(RoleService);
        prisma = module.get<PrismaService>(PrismaService);
        roleRepo = module.get<RoleRepository>(RoleRepository);
        menuService = module.get<MenuService>(MenuService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a role with menu associations', async () => {
            const createDto = {
                roleName: '测试角色',
                roleKey: 'test',
                roleSort: 1,
                dataScope: '2',
                status: '0',
                menuIds: [1, 2, 3],
            };

            (prisma.sysRole.create as jest.Mock).mockResolvedValue(mockRole);
            (prisma.sysRoleMenu.createMany as jest.Mock).mockResolvedValue({ count: 3 });

            const result = await service.create(createDto as any);

            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(prisma.sysRole.create).toHaveBeenCalled();
            expect(prisma.sysRoleMenu.createMany).toHaveBeenCalledWith({
                data: [
                    { roleId: 1, menuId: 1 },
                    { roleId: 1, menuId: 2 },
                    { roleId: 1, menuId: 3 },
                ],
                skipDuplicates: true,
            });
        });

        it('should create a role without menus', async () => {
            const createDto = {
                roleName: '测试角色',
                roleKey: 'test',
                roleSort: 1,
                dataScope: '2',
                status: '0',
            };

            (prisma.sysRole.create as jest.Mock).mockResolvedValue(mockRole);

            const result = await service.create(createDto as any);

            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(prisma.sysRoleMenu.createMany).not.toHaveBeenCalled();
        });
    });

    describe('findAll', () => {
        it('should return paginated roles', async () => {
            const query = {
                pageNum: 1,
                pageSize: 10,
                skip: 0,
                take: 10,
            };

            (roleRepo.findPageWithMenuCount as jest.Mock).mockResolvedValue({
                list: [mockRole],
                total: 1,
            });

            const result = await service.findAll(query as any);

            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(result.data.rows).toHaveLength(1);
            expect(result.data.total).toBe(1);
        });

        it('should filter roles by roleName', async () => {
            const query = {
                pageNum: 1,
                pageSize: 10,
                skip: 0,
                take: 10,
                roleName: '管理员',
            };

            (roleRepo.findPageWithMenuCount as jest.Mock).mockResolvedValue({
                list: [mockRole],
                total: 1,
            });

            await service.findAll(query as any);

            const callArgs = (roleRepo.findPageWithMenuCount as jest.Mock).mock.calls[0][0];
            expect(callArgs.roleName).toEqual({ contains: '管理员' });
        });
    });

    describe('update', () => {
        it('should update role and menu associations', async () => {
            const updateDto = {
                roleId: 1,
                roleName: '更新角色',
                menuIds: [4, 5, 6],
            };

            (prisma.sysRoleMenu.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });
            (prisma.sysRoleMenu.createMany as jest.Mock).mockResolvedValue({ count: 3 });
            (prisma.sysRole.update as jest.Mock).mockResolvedValue(mockRole);

            const result = await service.update(updateDto as any);

            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(prisma.sysRoleMenu.deleteMany).toHaveBeenCalledWith({
                where: { roleId: 1 },
            });
            expect(prisma.sysRoleMenu.createMany).toHaveBeenCalled();
        });
    });

    describe('changeStatus', () => {
        it('should change role status', async () => {
            const changeStatusDto = {
                roleId: 1,
                status: '1',
            };

            (prisma.sysRole.update as jest.Mock).mockResolvedValue({
                ...mockRole,
                status: '1',
            });

            const result = await service.changeStatus(changeStatusDto);

            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(prisma.sysRole.update).toHaveBeenCalledWith({
                where: { roleId: 1 },
                data: { status: '1' },
            });
        });
    });

    describe('remove', () => {
        it('should soft delete roles', async () => {
            (prisma.sysRole.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

            const result = await service.remove([1, 2]);

            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(result.data).toBe(2);
            expect(prisma.sysRole.updateMany).toHaveBeenCalledWith({
                where: { roleId: { in: [1, 2] } },
                data: { delFlag: '1' },
            });
        });
    });

    describe('getPermissionsByRoleIds', () => {
        it('should return all permissions for super admin', async () => {
            const result = await service.getPermissionsByRoleIds([1]);

            expect(result).toEqual([{ perms: '*:*:*' }]);
        });

        it('should return specific permissions for normal roles', async () => {
            (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([
                { menuId: 1 },
                { menuId: 2 },
            ]);
            (menuService.findMany as jest.Mock).mockResolvedValue([
                { menuId: 1, perms: 'system:user:list' },
                { menuId: 2, perms: 'system:user:add' },
            ]);

            const result = await service.getPermissionsByRoleIds([2]);

            expect(result).toHaveLength(2);
            expect(prisma.sysRoleMenu.findMany).toHaveBeenCalledWith({
                where: { roleId: { in: [2] } },
                select: { menuId: true },
            });
        });
    });

    describe('deptTree', () => {
        it('should return department tree with checked keys', async () => {
            const mockDepts = [
                {
                    deptId: 100,
                    parentId: 0,
                    deptName: '总部',
                    delFlag: DelFlagEnum.NORMAL,
                },
            ];

            (prisma.sysDept.findMany as jest.Mock).mockResolvedValue(mockDepts);
            (prisma.sysRoleDept.findMany as jest.Mock).mockResolvedValue([
                { deptId: 100 },
            ]);

            const result = await service.deptTree(1);

            expect(result.code).toBe(ResponseCode.SUCCESS);
            expect(result.data.depts).toBeDefined();
            expect(result.data.checkedKeys).toEqual([100]);
        });
    });
});
