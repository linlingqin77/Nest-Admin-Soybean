import { ConfigService } from './config/config.service';
import { DeptService } from './dept/dept.service';
import { DictService } from './dict/dict.service';
import { MenuService } from './menu/menu.service';
import { NoticeService } from './notice/notice.service';
import { PostService } from './post/post.service';
import { RoleService } from './role/role.service';
import { ToolService } from './tool/tool.service';
import { UserService } from './user/user.service';
import { createPrismaMock, PrismaMock } from 'src/test-utils/prisma-mock';
import { Result } from 'src/common/response';
import { ExportTable } from 'src/common/utils/export';
import { CacheEnum, DataScopeEnum } from 'src/common/enum/index';
import { JwtService } from '@nestjs/jwt';

jest.mock('src/common/utils/export', () => ({
  ExportTable: jest.fn(),
}));

jest.mock('./tool/template/index', () => ({
  index: () => ({}),
}));

jest.mock('bcryptjs', () => ({
  genSaltSync: jest.fn().mockReturnValue('salt'),
  hashSync: jest.fn().mockImplementation((value: string) => `hashed-${value}`),
  compareSync: jest.fn().mockReturnValue(true),
}));

describe('System module services', () => {
  describe('ConfigService', () => {
    let prisma: PrismaMock;
    const redisService = {
      set: jest.fn(),
    };
    let service: ConfigService;

    beforeEach(() => {
      prisma = createPrismaMock();
      service = new ConfigService(prisma, redisService as any, {} as any);
    });

    it('should paginate config list', async () => {
      prisma.$transaction.mockResolvedValue([[{ configId: 1 }], 1]);
      const res = await service.findAll({ pageNum: 1, pageSize: 10 } as any);
      expect(res.data).toEqual({ rows: [{ configId: 1 }], total: 1 });
    });

    it('should reset cache by chaining helpers', async () => {
      const clearSpy = jest.spyOn(service, 'clearConfigCache').mockResolvedValue();
      const loadSpy = jest.spyOn(service, 'loadingConfigCache').mockResolvedValue();
      await service.resetConfigCache();
      expect(clearSpy).toHaveBeenCalled();
      expect(loadSpy).toHaveBeenCalled();
    });
  });

  describe('DeptService', () => {
    let prisma: PrismaMock;
    let service: DeptService;
    const createRedisMock = () => ({
      keys: jest.fn().mockResolvedValue([]),
      del: jest.fn(),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
    });
    let redisMock: ReturnType<typeof createRedisMock>;

    beforeEach(() => {
      prisma = createPrismaMock();
      service = new DeptService(prisma, {} as any);
      redisMock = createRedisMock();
      (service as any).redis = redisMock;
    });

    it('should create dept by inheriting parent ancestors', async () => {
      (prisma.sysDept.findUnique as jest.Mock).mockResolvedValue({ ancestors: '0' });
      await service.create({ parentId: 1, deptName: '研发部', orderNum: 1 } as any);
      expect(prisma.sysDept.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ deptName: '研发部' }) }));
    });

    it('should resolve dept ids by data scope', async () => {
      (prisma.sysDept.findMany as jest.Mock).mockResolvedValue([{ deptId: 1 }, { deptId: 2 }]);
      const ids = await service.findDeptIdsByDataScope(1, DataScopeEnum.DATA_SCOPE_DEPT_AND_CHILD);
      expect(ids).toEqual([1, 2]);
    });
  });

  describe('DictService', () => {
    let prisma: PrismaMock;
    const redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
    };
    let service: DictService;

    beforeEach(() => {
      prisma = createPrismaMock();
      service = new DictService(prisma, redisService as any, {} as any, {} as any);
    });

    it('should list dict types', async () => {
      prisma.$transaction.mockResolvedValue([[{ dictId: 1 }], 1]);
      const res = await service.findAllType({ pageNum: 1, pageSize: 10 } as any);
      expect(res.data.total).toBe(1);
    });

    it('should read dict from cache first and fallback to db', async () => {
      redisService.get.mockResolvedValueOnce([{ dictValue: '1' }]);
      const cached = await service.findOneDataType('sys_oper_type');
      expect(cached.data).toEqual([{ dictValue: '1' }]);

      redisService.get.mockResolvedValueOnce(null);
      (prisma.sysDictData.findMany as jest.Mock).mockResolvedValue([{ dictValue: '2' }] as any);
      const fresh = await service.findOneDataType('sys_oper_type');
      expect(redisService.set).toHaveBeenCalledWith(`${CacheEnum.SYS_DICT_KEY}sys_oper_type`, [{ dictValue: '2' }]);
      expect(fresh.data).toEqual([{ dictValue: '2' }]);
    });
  });

  describe('MenuService', () => {
    let prisma: PrismaMock;
    const userService = {
      getRoleIds: jest.fn(),
    };
    let service: MenuService;

    beforeEach(() => {
      prisma = createPrismaMock();
      service = new MenuService(userService as any, prisma, {} as any);
    });

    it('should return full menu tree for super admin', async () => {
      userService.getRoleIds.mockResolvedValue([1]);
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([
        { menuId: 1, parentId: 0, menuType: 'M', orderNum: 1, menuName: '仪表盘', path: '/dashboard', visible: '0', status: '0', perms: '*:*:*', component: 'Dashboard', delFlag: '0' } as any,
      ]);
      const data = await service.getMenuListByUserId(1);
      expect(data).toHaveLength(1);
    });

    it('should build role menu tree select payload', async () => {
      (prisma.sysMenu.findMany as jest.Mock).mockResolvedValue([
        { menuId: 1, parentId: 0, menuName: '系统管理', orderNum: 1, status: '0', delFlag: '0' },
        { menuId: 2, parentId: 1, menuName: '用户管理', orderNum: 1, status: '0', delFlag: '0' },
      ] as any);
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([{ menuId: 2 }]);
      const res = await service.roleMenuTreeselect(1);
      expect(res.data.checkedKeys).toEqual([2]);
    });
  });

  describe('NoticeService', () => {
    let prisma: PrismaMock;
    let service: NoticeService;

    beforeEach(() => {
      prisma = createPrismaMock();
      service = new NoticeService(prisma, {} as any);
    });

    it('should list notices', async () => {
      prisma.$transaction.mockResolvedValue([[{ noticeId: 1 }], 1]);
      const res = await service.findAll({ pageNum: 1, pageSize: 10 } as any);
      expect(res.data.total).toBe(1);
    });

    it('should soft delete notices', async () => {
      (prisma.sysNotice.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      await service.remove([1]);
      expect(prisma.sysNotice.updateMany).toHaveBeenCalled();
    });
  });

  describe('PostService', () => {
    let prisma: PrismaMock;
    let service: PostService;

    beforeEach(() => {
      prisma = createPrismaMock();
      const deptService = { getChildDeptIds: jest.fn().mockResolvedValue([]) } as any;
      service = new PostService(prisma, deptService, {} as any);
    });

    it('should list posts via prisma transaction', async () => {
      prisma.$transaction.mockResolvedValue([[{ postId: 1 }], 1]);
      const res = await service.findAll({ skip: 0, take: 10 } as any);
      expect(res.data.total).toBe(1);
    });

    it('should export post list', async () => {
      jest.spyOn(service, 'findAll').mockResolvedValue(Result.ok({ rows: [], total: 0 }));
      await service.export({} as any, {} as any);
      expect(ExportTable).toHaveBeenCalled();
    });
  });

  describe('RoleService', () => {
    let prisma: PrismaMock;
    const menuService = {
      findMany: jest.fn(),
    };
    const roleRepo = {
      findPageWithMenuCount: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };
    let service: RoleService;

    beforeEach(() => {
      prisma = createPrismaMock();
      service = new RoleService(prisma, roleRepo as any, menuService as any);
    });

    it('should create role with menu bindings inside transaction', async () => {
      prisma.$transaction.mockImplementation(async (cb) => cb(prisma));
      (prisma.sysRole.create as jest.Mock).mockResolvedValue({ roleId: 1 });
      await service.create({ roleName: '管理员', menuIds: [1, 2] } as any);
      expect(prisma.sysRoleMenu.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            { roleId: 1, menuId: 1 },
            { roleId: 1, menuId: 2 },
          ],
        }),
      );
    });

    it('should merge permissions from menu service', async () => {
      (prisma.sysRoleMenu.findMany as jest.Mock).mockResolvedValue([{ menuId: 1 }]);
      menuService.findMany.mockResolvedValue([{ perms: 'system:user:list' }]);
      const perms = await service.getPermissionsByRoleIds([2]);
      expect(perms).toEqual([{ perms: 'system:user:list' }]);
    });
  });

  describe('ToolService', () => {
    let prisma: PrismaMock;
    let service: ToolService;

    beforeEach(() => {
      prisma = createPrismaMock();
      service = new ToolService(prisma);
    });

    it('should list generator tables', async () => {
      prisma.$transaction.mockResolvedValue([[{ tableId: 1 }], 1]);
      const res = await service.findAll({ pageNum: 1, pageSize: 10 } as any);
      expect(res.data.total).toBe(1);
    });

    it('should extract primary key from column list', async () => {
      const pk = await service.getPrimaryKey([
        { javaField: 'id', isPk: '1' },
        { javaField: 'name', isPk: '0' },
      ] as any);
      expect(pk).toBe('id');
    });

    it('should import table metadata and columns', async () => {
      const selectSpy = jest.spyOn(service as any, 'selectDbTableListByNames').mockResolvedValue([{ tableName: 'sys_user', tableComment: '用户表' }]);
      const columnSpy = jest.spyOn(service as any, 'getTableColumnInfo').mockResolvedValue([
        {
          tableId: 1,
          columnName: 'user_id',
          columnComment: '用户id',
          columnType: 'bigint',
          javaType: 'number',
          javaField: 'userId',
          isPk: '1',
          isRequired: '1',
          isIncrement: '1',
          sort: 1,
        },
      ]);
      (prisma.genTable.create as jest.Mock).mockResolvedValue({ tableId: 1, tableName: 'sys_user', businessName: 'user' } as any);
      await service.importTable({ tableNames: 'sys_user' } as any, { userName: 'admin' } as any);
      expect(selectSpy).toHaveBeenCalled();
      expect(columnSpy).toHaveBeenCalled();
      expect(prisma.genTableColumn.create).toHaveBeenCalled();
    });
  });

  describe('UserService', () => {
    let prisma: PrismaMock;
    let service: UserService;
    const roleService = {
      findRoleWithDeptIds: jest.fn(),
      findRoles: jest.fn().mockResolvedValue([]),
      getPermissionsByRoleIds: jest.fn().mockResolvedValue([{ perms: 'system:user:list' }]),
    };
    const deptService = {
      findDeptIdsByDataScope: jest.fn(),
      deptTree: jest.fn(),
    };
    const jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
      verify: jest.fn(),
    } as unknown as JwtService;
    const redisService = {
      set: jest.fn(),
      get: jest.fn().mockResolvedValue({}),
    };
    const configService = {
      get: jest.fn(),
    };
    const userRepo = {
      findByUserName: jest.fn(),
      findById: jest.fn(),
      updateLoginTime: jest.fn(),
    };

    beforeEach(() => {
      prisma = createPrismaMock();
      service = new UserService(prisma, userRepo as any, roleService as any, deptService as any, jwtService, redisService as any, configService as any);
    });

    it('should create user with posts and roles', async () => {
      (prisma.sysUser.create as jest.Mock).mockResolvedValue({ userId: 10 } as any);
      await service.create({ userName: 'admin', password: '123456', postIds: [1], roleIds: [2] } as any);
      expect(prisma.sysUser.create).toHaveBeenCalled();
      expect(prisma.sysUserPost.createMany).toHaveBeenCalled();
      expect(prisma.sysUserRole.createMany).toHaveBeenCalled();
    });

    it('should deduplicate role ids when querying relations', async () => {
      (prisma.sysUserRole.findMany as jest.Mock).mockResolvedValue([{ roleId: 1 }, { roleId: 1 }, { roleId: 2 }]);
      const ids = await service.getRoleIds([1]);
      expect(ids).toEqual([1, 2]);
    });

    it('should merge redis session metadata when updating token', async () => {
      redisService.get.mockResolvedValueOnce({ token: 'abc', roles: [] });
      await service.updateRedisToken('token', { roles: ['admin'] } as any);
      expect(redisService.set).toHaveBeenCalledWith(`${CacheEnum.LOGIN_TOKEN_KEY}token`, expect.objectContaining({ roles: ['admin'] }), expect.any(Number));
    });

    it('should aggregate permissions from roles', async () => {
      jest.spyOn(service, 'getRoleIds').mockResolvedValue([2, 3]);
      roleService.getPermissionsByRoleIds.mockResolvedValue([{ perms: 'system:user:list' }, { perms: 'system:user:list' }]);
      const perms = await service.getUserPermissions(1);
      expect(perms).toEqual(['system:user:list']);
    });
  });
});
