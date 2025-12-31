import { isURL } from 'class-validator';
import * as Lodash from 'lodash';
import * as UserConstants from 'src/module/system/user/user.constant';

/**
 * 菜单项接口
 */
interface MenuItem {
  menuId: number;
  parentId: number;
  menuName: string;
  path: string;
  component?: string;
  query?: string;
  visible: string;
  isCache: string;
  isFrame: string;
  menuType: string;
  icon?: string;
  link?: string;
  name?: string;
  children?: MenuItem[];
}

/**
 * 内部菜单项接口（带id）
 */
interface InternalMenuItem extends MenuItem {
  id: number;
}

/**
 * 路由配置接口
 */
interface RouterConfig {
  hidden: boolean;
  name: string;
  path: string;
  component: string;
  query?: string;
  meta: { title: string; icon?: string; noCache: boolean; link?: string } | null;
  alwaysShow?: boolean;
  redirect?: string;
  children?: RouterConfig[];
}

/**
 * 菜单列表转树形结构
 * @param arr
 */
export const buildMenus = (arr: MenuItem[]): RouterConfig[] => {
  //保证父级菜单排在前面
  arr.sort((a, b) => a.parentId - b.parentId);
  const kData: Record<number, InternalMenuItem> = {}; // 以id做key的对象 暂时储存数据
  const lData: InternalMenuItem[] = []; // 最终的数据 arr
  arr.forEach((m) => {
    const item: InternalMenuItem = {
      ...m,
      id: m.menuId,
    };
    kData[item.id] = {
      ...item,
    };
    if (item.parentId === 0) {
      lData.push(kData[item.id]);
    } else {
      kData[item.parentId] = kData[item.parentId] || ({ children: [] } as unknown as InternalMenuItem);
      kData[item.parentId].children = kData[item.parentId].children || [];
      kData[item.parentId].children!.push(kData[item.id]);
    }
  });
  return formatTreeNodeBuildMenus(lData);
};

/**
 * 格式化菜单数据
 * @param arr
 * @param getId
 * @returns
 */
const formatTreeNodeBuildMenus = (menus: MenuItem[]): RouterConfig[] => {
  return menus.map((menu) => {
    const router: RouterConfig = {
      hidden: menu.visible === '1',
      name: getRouteName(menu),
      path: getRouterPath(menu),
      component: getComponent(menu),
      query: menu.query,
      meta: setMeta(menu),
    };

    const hasChildren = menu.children && menu.children.length > 0;
    const isDirectory = menu.menuType === UserConstants.TYPE_DIR;

    if (hasChildren && isDirectory) {
      router.alwaysShow = true;
      router.redirect = 'noRedirect';
      router.children = formatTreeNodeBuildMenus(menu.children!);
    } else if (isMenuFrame(menu)) {
      router.meta = null;
      const childrenList: RouterConfig[] = [];
      const childrenRouter: RouterConfig = {
        hidden: false,
        name: Lodash.capitalize(menu.path),
        path: menu.path,
        component: menu.component || '',
        meta: setMeta(menu),
        query: menu.query,
      };
      childrenList.push(childrenRouter);
      router.children = childrenList;
    } else if (menu.parentId === 0 && isInnerLink(menu)) {
      router.meta = {
        title: menu.name || menu.menuName,
        icon: menu.icon,
        noCache: false,
      };
      router.path = '/';
      const childrenList: RouterConfig[] = [];
      const childrenRouter: RouterConfig = {
        hidden: false,
        name: Lodash.capitalize(menu.name || menu.menuName),
        path: innerLinkReplaceEach(menu.path),
        component: UserConstants.INNER_LINK,
        meta: {
          title: menu.name || menu.menuName,
          icon: menu.icon,
          noCache: false,
          link: menu.path,
        },
      };
      childrenList.push(childrenRouter);
      router.children = childrenList;
    }

    return router;
  });
};

/**
 * 设置meta信息
 */
const setMeta = (menu: MenuItem): { title: string; icon?: string; noCache: boolean; link?: string } => {
  const meta: { title: string; icon?: string; noCache: boolean; link?: string } = {
    title: menu.menuName,
    icon: menu.icon,
    noCache: menu.isCache === '1',
  };

  if (menu.link && isURL(menu.link)) {
    meta.link = menu.link;
  }

  return meta;
};

/**
 * 获取路由名称
 *
 * @param menu 菜单信息
 * @return 路由名称
 */
const getRouteName = (menu: MenuItem): string => {
  let routerName = Lodash.capitalize(menu.path);
  // 非外链并且是一级目录（类型为目录）
  if (isMenuFrame(menu)) {
    routerName = '';
  }
  return routerName;
};
/**
 * 是否为菜单内部跳转
 *
 * @param menu 菜单信息
 * @return 结果
 */
const isMenuFrame = (menu: MenuItem): boolean => {
  return menu.parentId === 0 && menu.menuType === UserConstants.TYPE_MENU && menu.isFrame === UserConstants.NO_FRAME;
};

/**
 * 是否为内链组件
 *
 * @param menu 菜单信息
 * @return 结果
 */
const isInnerLink = (menu: MenuItem): boolean => {
  return menu.isFrame === UserConstants.NO_FRAME && isURL(menu.path);
};

/**
 * 是否为parent_view组件
 *
 * @param menu 菜单信息
 * @return 结果
 */
const isParentView = (menu: MenuItem): boolean => {
  return menu.parentId !== 0 && menu.menuType === UserConstants.TYPE_DIR;
};

/**
 * 获取组件信息
 *
 * @param menu 菜单信息
 * @return 组件信息
 */
const getComponent = (menu: MenuItem): string => {
  let component = UserConstants.LAYOUT;
  if (menu.component && !isMenuFrame(menu)) {
    component = menu.component;
  } else if (!menu.component && menu.parentId !== 0 && isInnerLink(menu)) {
    component = UserConstants.INNER_LINK;
  } else if (!menu.component && isParentView(menu)) {
    component = UserConstants.PARENT_VIEW;
  }
  return component;
};

/**
 * 内链域名特殊字符替换
 *
 * @return 替换后的内链域名
 */
const innerLinkReplaceEach = (path: string): string => {
  const replacements = [
    ['http://', ''],
    ['https://', ''],
    ['www.', ''],
    ['.', '/'],
    [':', '/'],
  ];

  // 遍历替换规则并应用到路径上
  for (const [oldValue, newValue] of replacements) {
    path = path.replace(new RegExp(oldValue, 'g'), newValue);
  }

  return path;
};

/**
 * 获取路由地址
 *
 * @param menu 菜单信息
 * @return 路由地址
 */
const getRouterPath = (menu: MenuItem): string => {
  let routerPath = menu.path;
  // 内链打开外网方式
  if (menu.parentId !== 0 && isInnerLink(menu)) {
    routerPath = innerLinkReplaceEach(routerPath);
  }
  // 非外链并且是一级目录（类型为目录）
  if (menu.parentId === 0 && menu.menuType === UserConstants.TYPE_DIR && menu.isFrame === UserConstants.NO_FRAME) {
    routerPath = '/' + menu.path;
  }
  // 非外链并且是一级目录（类型为菜单）
  else if (isMenuFrame(menu)) {
    routerPath = '/';
  }
  return routerPath;
};
