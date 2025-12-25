import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result } from 'src/common/response';
import { DelFlagEnum, StatusEnum, CacheEnum } from 'src/common/enum/index';
import { Cacheable } from 'src/common/decorators/redis.decorator';
import { CreateMenuDto, UpdateMenuDto, ListMenuDto } from './dto/index';
import { ListToTree, Uniq } from 'src/common/utils/index';
import { UserService } from '../user/user.service';
import { buildMenus } from './utils';
import { PrismaService } from 'src/prisma/prisma.service';
import { MenuRepository } from './menu.repository';

@Injectable()
export class MenuService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly menuRepo: MenuRepository,
  ) {}

  async create(createMenuDto: CreateMenuDto) {
    const res = await this.menuRepo.create({
      ...createMenuDto,
      path: createMenuDto.path ?? '',
      icon: createMenuDto.icon ?? '',
      delFlag: DelFlagEnum.NORMAL,
    });
    return Result.ok(res);
  }

  async findAll(query: ListMenuDto) {
    const res = await this.menuRepo.findAllMenus(query);
    return Result.ok(res);
  }

  async treeSelect() {
    const res = await this.menuRepo.findAllMenus();
    const tree = ListToTree(
      res,
      (m) => m.menuId,
      (m) => m.menuName,
    );
    return Result.ok(tree);
  }

  async roleMenuTreeselect(roleId: number): Promise<any> {
    const res = await this.menuRepo.findAllMenus();
    const tree = ListToTree(
      res,
      (m) => m.menuId,
      (m) => m.menuName,
    );
    const menuIds = await this.menuRepo.findRoleMenus(roleId);
    const checkedKeys = menuIds.map((item) => item.menuId);
    return Result.ok({
      menus: tree,
      checkedKeys: checkedKeys,
    });
  }

  /**
   * 租户套餐菜单树
   */
  async tenantPackageMenuTreeselect(packageId: number): Promise<any> {
    const res = await this.prisma.sysMenu.findMany({
      where: {
        delFlag: DelFlagEnum.NORMAL,
      },
      orderBy: [{ orderNum: 'asc' }, { parentId: 'asc' }],
    });
    const tree = ListToTree(
      res,
      (m) => m.menuId,
      (m) => m.menuName,
    );
    // 查询租户套餐关联的菜单ID（如果有对应的表）
    // 暂时返回空数组作为 checkedKeys
    return Result.ok({
      menus: tree,
      checkedKeys: [],
    });
  }

  async findOne(menuId: number) {
    const res = await this.menuRepo.findById(menuId);
    return Result.ok(res);
  }

  async update(updateMenuDto: UpdateMenuDto) {
    const res = await this.menuRepo.update(updateMenuDto.menuId, updateMenuDto);
    return Result.ok(res);
  }

  async remove(menuId: number) {
    const data = await this.menuRepo.softDelete(menuId);
    return Result.ok(data);
  }

  /**
   * 级联删除菜单
   */
  async cascadeRemove(menuIds: number[]) {
    const data = await this.prisma.sysMenu.updateMany({
      where: {
        menuId: {
          in: menuIds,
        },
      },
      data: {
        delFlag: '1',
      },
    });
    return Result.ok(data.count);
  }

  async findMany(args: Prisma.SysMenuFindManyArgs) {
    return await this.prisma.sysMenu.findMany(args);
  }

  /**
   * 根据用户ID查询菜单
   *
   * @param userId 用户ID
   * @return 菜单列表
   */
  @Cacheable(CacheEnum.SYS_MENU_KEY, 'user:{userId}')
  async getMenuListByUserId(userId: number) {
    const roleIds = await this.userService.getRoleIds([userId]);
    let menuIds: number[] = [];

    if (roleIds.includes(1)) {
      const allMenus = await this.prisma.sysMenu.findMany({
        where: {
          delFlag: DelFlagEnum.NORMAL,
          status: StatusEnum.NORMAL,
        },
        select: {
          menuId: true,
        },
      });
      menuIds = allMenus.map((item) => item.menuId);
    } else {
      const menuWidthRoleList = await this.prisma.sysRoleMenu.findMany({
        where: {
          roleId: {
            in: roleIds,
          },
        },
        select: {
          menuId: true,
        },
      });
      menuIds = Uniq(menuWidthRoleList.map((item) => item.menuId));
    }

    if (menuIds.length === 0) {
      return Result.ok([]);
    }

    const menuList = await this.prisma.sysMenu.findMany({
      where: {
        delFlag: DelFlagEnum.NORMAL,
        status: StatusEnum.NORMAL,
        menuId: {
          in: menuIds,
        },
      },
      orderBy: {
        orderNum: 'asc',
      },
    });
    // 构建前端需要的菜单树
    const menuTree = buildMenus(menuList);
    return Result.ok(menuTree);
  }
}
