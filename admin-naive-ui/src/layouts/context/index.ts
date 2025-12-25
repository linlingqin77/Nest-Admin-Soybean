import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useContext } from '@sa/hooks';
import type { RouteKey } from '@elegant-router/types';
import { useRouteStore } from '@/store/modules/route';
import { useRouterPush } from '@/hooks/common/router';

const { setupStore: _setupMixMenuContext, useStore: _useMixMenuContext } = useContext('mix-menu', useMixMenu);

// Wrapper to support optional debug name argument (like upstream)
export function setupMixMenuContext() {
  return _setupMixMenuContext();
}

// Wrapper to support optional debug name argument (like upstream)
export function useMixMenuContext(_debugName?: string) {
  return _useMixMenuContext();
}

function useMixMenu() {
  const route = useRoute();
  const routeStore = useRouteStore();
  const { routerPushByKeyWithMetaQuery } = useRouterPush();
  const { selectedKey } = useMenu();

  const activeFirstLevelMenuKey = ref('');
  const activeSecondLevelMenuKey = ref('');

  function setActiveFirstLevelMenuKey(key: string) {
    activeFirstLevelMenuKey.value = key;
  }

  function setActiveSecondLevelMenuKey(key: string) {
    activeSecondLevelMenuKey.value = key;
  }

  function getActiveFirstLevelMenuKey() {
    const [firstLevelRouteName] = selectedKey.value.split('_');

    setActiveFirstLevelMenuKey(firstLevelRouteName);
  }

  function getActiveSecondLevelMenuKey() {
    const parts = selectedKey.value.split('_');
    if (parts.length > 1) {
      const secondLevelRouteName = parts.slice(0, 2).join('_');
      setActiveSecondLevelMenuKey(secondLevelRouteName);
    } else {
      setActiveSecondLevelMenuKey('');
    }
  }

  const allMenus = computed<App.Global.Menu[]>(() => routeStore.menus);

  const firstLevelMenus = computed<App.Global.Menu[]>(() =>
    routeStore.menus.map((menu) => {
      const { children: _, ...rest } = menu;

      return rest;
    }),
  );

  const secondLevelMenus = computed<App.Global.Menu[]>(
    () => routeStore.menus.find((menu) => menu.key === activeFirstLevelMenuKey.value)?.children || [],
  );

  const childLevelMenus = computed<App.Global.Menu[]>(
    () => secondLevelMenus.value.find((menu) => menu.key === activeSecondLevelMenuKey.value)?.children || [],
  );

  const isActiveFirstLevelMenuHasChildren = computed(() => {
    if (!activeFirstLevelMenuKey.value) {
      return false;
    }

    const findItem = allMenus.value.find((item) => item.key === activeFirstLevelMenuKey.value);

    return Boolean(findItem?.children?.length);
  });

  const isActiveSecondLevelMenuHasChildren = computed(() => {
    if (!activeSecondLevelMenuKey.value) {
      return false;
    }

    const findItem = secondLevelMenus.value.find((item) => item.key === activeSecondLevelMenuKey.value);

    return Boolean(findItem?.children?.length);
  });

  /**
   * Handle select first level menu
   *
   * @param key First level menu key
   */
  function handleSelectFirstLevelMenu(key: RouteKey) {
    setActiveFirstLevelMenuKey(key);

    const hasChildren = isActiveFirstLevelMenuHasChildren.value;

    if (!hasChildren) {
      routerPushByKeyWithMetaQuery(key);
    }
  }

  /**
   * Handle select second level menu
   *
   * @param key Second level menu key
   */
  function handleSelectSecondLevelMenu(key: RouteKey) {
    setActiveSecondLevelMenuKey(key);

    const hasChildren = isActiveSecondLevelMenuHasChildren.value;

    if (!hasChildren) {
      routerPushByKeyWithMetaQuery(key);
    }
  }

  watch(
    () => route.name,
    () => {
      getActiveFirstLevelMenuKey();
      getActiveSecondLevelMenuKey();
    },
    { immediate: true },
  );

  return {
    allMenus,
    firstLevelMenus,
    secondLevelMenus,
    childLevelMenus,
    isActiveFirstLevelMenuHasChildren,
    isActiveSecondLevelMenuHasChildren,
    activeFirstLevelMenuKey,
    activeSecondLevelMenuKey,
    setActiveFirstLevelMenuKey,
    setActiveSecondLevelMenuKey,
    getActiveFirstLevelMenuKey,
    getActiveSecondLevelMenuKey,
    handleSelectFirstLevelMenu,
    handleSelectSecondLevelMenu,
  };
}

export function useMenu() {
  const route = useRoute();

  const selectedKey = computed(() => {
    const { hideInMenu, activeMenu } = route.meta;
    const name = route.name as string;

    const routeName = (hideInMenu ? activeMenu : name) || name;

    return routeName;
  });

  return {
    selectedKey,
  };
}
