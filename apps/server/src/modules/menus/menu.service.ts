import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Result, ResponseCode } from 'src/shared/response';
import { BusinessException } from 'src/shared/exceptions';
import { DelFlagEnum, StatusEnum, CacheEnum } from 'src/shared/enums/index';
import { Cacheable } from 'src/core/auth/decorators/redis.decorator';
import { CreateMenuRequestDto, UpdateMenuRequestDto, ListMenuRequestDto } from './dto/requests';
import { MenuResponseDto } from './dto/responses';
import { ListToTree, Uniq } from 'src/shared/utils/index';
import { toDto, toDtoList } from 'src/shared/utils/serialize.util';
import { UserRoleBridgeService } from 'src/shared/services';
import { buildMenus } from './utils';
import { MenuRepository } from './menu.repository';
import { InjectTransactionHost, PrismaTransactionHost } from 'src/core/http/decorators/transactional.decorator';

@Injectable()
export class MenuService {
  constructor(
    private readonly userRoleBridge: UserRoleBridgeService,
    @InjectTransactionHost() private readonly txHost: PrismaTransactionHost,
    private readonly menuRepo: MenuRepository,
  ) {}
  private get prisma() { return this.txHost.tx; }

  async create(createMenuDto: CreateMenuRequestDto) {
    const res = await this.menuRepo.create({
      ...createMenuDto,
      path: createMenuDto.path ?? '',
      icon: createMenuDto.icon ?? '',
      delFlag: '0',
    });
    return Result.ok(toDto(MenuResponseDto, res));
  }

  async findAll(query: ListMenuRequestDto) {
    const res = await this.menuRepo.findAllMenus(query);
    return Result.ok(toDtoList(MenuResponseDto, res));
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
        delFlag: '0',
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
    BusinessException.throwIfNull(res, '菜单不存在', ResponseCode.DATA_NOT_FOUND);
    return Result.ok(toDto(MenuResponseDto, res));
  }

  async update(updateMenuDto: UpdateMenuRequestDto) {
    const res = await this.menuRepo.update(updateMenuDto.menuId, updateMenuDto);
    return Result.ok(toDto(MenuResponseDto, res));
  }

  async remove(menuId: number) {
    const data = await this.menuRepo.softDelete(menuId);
    return Result.ok(data);
  }

  /**
   * 级联删除菜单（包含所有子菜单）
   */
  async cascadeRemove(menuIds: number[]) {
    // 递归获取所有子菜单ID
    const allMenuIds = await this.getAllChildMenuIds(menuIds);

    const data = await this.prisma.sysMenu.updateMany({
      where: {
        menuId: {
          in: allMenuIds,
        },
      },
      data: {
        delFlag: '1',
      },
    });
    return Result.ok(data.count);
  }

  /**
   * 递归获取所有子菜单ID
   */
  private async getAllChildMenuIds(parentIds: number[]): Promise<number[]> {
    const result = new Set<number>(parentIds);

    const findChildren = async (ids: number[]) => {
      if (ids.length === 0) return;

      const children = await this.prisma.sysMenu.findMany({
        where: {
          parentId: { in: ids },
          delFlag: '0',
        },
        select: { menuId: true },
      });

      const childIds = children.map((c) => c.menuId).filter((id) => !result.has(id));

      if (childIds.length > 0) {
        childIds.forEach((id) => result.add(id));
        await findChildren(childIds);
      }
    };

    await findChildren(parentIds);
    return Array.from(result);
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
  @Cacheable(CacheEnum.SYS_MENU_KEY, 'user:{0}')
  async getMenuListByUserId(userId: number) {
    const roleIds = await this.userRoleBridge.getRoleIdsByUserId(userId);
    let menuIds: number[] = [];

    if (roleIds.includes(1)) {
      const allMenus = await this.prisma.sysMenu.findMany({
        where: {
          delFlag: '0',
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
        delFlag: '0',
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
    const menuTree = buildMenus(menuList as unknown as Parameters<typeof buildMenus>[0]);
    return Result.ok(menuTree);
  }
}
