import { SysMenu, Status, DelFlag } from '@prisma/client';
import { BaseFactory } from './base.factory';

/**
 * 菜单测试数据工厂
 * 
 * @description
 * 提供创建 SysMenu 测试数据的方法
 * 
 * @example
 * ```typescript
 * const menu = MenuFactory.create({ menuName: '系统管理' });
 * const menus = MenuFactory.createMany(5);
 * ```
 */
export class MenuFactory extends BaseFactory<SysMenu> {
  protected getDefaults(): SysMenu {
    return {
      menuId: 1,
      tenantId: '000000',
      menuName: '测试菜单',
      parentId: 0,
      orderNum: 1,
      path: '/test',
      component: 'test/index',
      query: '',
      isFrame: '1',
      isCache: '0',
      menuType: 'C',
      visible: '0',
      status: Status.NORMAL,
      perms: 'test:menu:list',
      icon: 'test',
      createBy: 'admin',
      createTime: new Date(),
      updateBy: 'admin',
      updateTime: new Date(),
      remark: null,
      delFlag: DelFlag.NORMAL,
    };
  }

  protected getSequentialOverrides(index: number): Partial<SysMenu> {
    return {
      menuId: index + 1,
      menuName: `测试菜单${index + 1}`,
      orderNum: index + 1,
      path: `/test${index + 1}`,
      component: `test${index + 1}/index`,
      perms: `test:menu${index + 1}:list`,
    };
  }

  /**
   * 创建目录菜单
   */
  static createDirectory(overrides?: Partial<SysMenu>): SysMenu {
    const factory = new MenuFactory();
    return factory.create({
      menuType: 'M',
      component: null,
      perms: '',
      ...overrides,
    });
  }

  /**
   * 创建菜单
   */
  static createMenu(overrides?: Partial<SysMenu>): SysMenu {
    const factory = new MenuFactory();
    return factory.create({
      menuType: 'C',
      ...overrides,
    });
  }

  /**
   * 创建按钮
   */
  static createButton(overrides?: Partial<SysMenu>): SysMenu {
    const factory = new MenuFactory();
    return factory.create({
      menuType: 'F',
      path: '',
      component: null,
      ...overrides,
    });
  }

  /**
   * 创建外链菜单
   */
  static createExternalLink(overrides?: Partial<SysMenu>): SysMenu {
    const factory = new MenuFactory();
    return factory.create({
      isFrame: '0',
      path: 'https://example.com',
      component: null,
      ...overrides,
    });
  }

  /**
   * 创建菜单树
   * 
   * @param depth 树的深度
   * @param childrenPerLevel 每层的子节点数量
   */
  static createTree(depth: number = 2, childrenPerLevel: number = 3): SysMenu[] {
    const factory = new MenuFactory();
    const menus: SysMenu[] = [];
    let currentId = 1;

    // 创建根目录
    const root = factory.create({
      menuId: currentId++,
      parentId: 0,
      menuName: '系统管理',
      menuType: 'M',
      path: '/system',
      component: null,
      perms: '',
    });
    menus.push(root);

    // 递归创建子菜单
    const createChildren = (parent: SysMenu, currentDepth: number) => {
      if (currentDepth >= depth) return;

      for (let i = 0; i < childrenPerLevel; i++) {
        const isLastLevel = currentDepth === depth - 1;
        const child = factory.create({
          menuId: currentId++,
          parentId: parent.menuId,
          menuName: `${parent.menuName}-子菜单${i + 1}`,
          menuType: isLastLevel ? 'C' : 'M',
          path: `${parent.path}/child${i + 1}`,
          component: isLastLevel ? `${parent.path}/child${i + 1}/index` : null,
          perms: isLastLevel ? `${parent.path}:child${i + 1}:list` : '',
        });
        menus.push(child);
        
        if (!isLastLevel) {
          createChildren(child, currentDepth + 1);
        }
      }
    };

    createChildren(root, 1);
    return menus;
  }

  /**
   * 创建隐藏菜单
   */
  static createHiddenMenu(overrides?: Partial<SysMenu>): SysMenu {
    const factory = new MenuFactory();
    return factory.create({
      visible: '1',
      ...overrides,
    });
  }

  /**
   * 创建禁用菜单
   */
  static createDisabledMenu(overrides?: Partial<SysMenu>): SysMenu {
    const factory = new MenuFactory();
    return factory.create({
      status: Status.DISABLED,
      ...overrides,
    });
  }

  /**
   * 创建单个菜单（静态方法）
   */
  static create(overrides?: Partial<SysMenu>): SysMenu {
    const factory = new MenuFactory();
    return factory.create(overrides);
  }

  /**
   * 批量创建菜单（静态方法）
   */
  static createMany(count: number, overrides?: Partial<SysMenu>): SysMenu[] {
    const factory = new MenuFactory();
    return factory.createMany(count, overrides);
  }

  /**
   * 创建带关联的菜单（静态方法）
   */
  static createWithRelations(relations: Record<string, any>): SysMenu {
    const factory = new MenuFactory();
    return factory.createWithRelations(relations);
  }
}
