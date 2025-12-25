<template>
  <div class="sidebar-menu" :style="{ width: `${totalWidth}px` }">
    <!-- 一级菜单 -->
    <div class="primary-menu" :style="{ width: `${SIDEBAR_PRIMARY_WIDTH}px` }">
      <div
        v-for="item in primaryMenuItems"
        :key="item.key"
        class="primary-menu-item"
        :class="{ active: activeMenu === item.key }"
        @click="handlePrimaryMenuClick(item.key)"
      >
        <div :class="item.icon" :style="iconStyle(item.key)" />
        <div class="menu-text" :style="textStyle(item.key)">
          {{ item.label }}
        </div>
      </div>
    </div>

    <!-- 二级菜单 -->
    <Transition name="slide">
      <div v-if="showSecondaryMenu" class="secondary-menu" :style="{ width: `${SIDEBAR_SECONDARY_WIDTH}px` }">
        <n-menu
          v-model:value="activeSecondaryMenu"
          :options="secondaryMenuOptions"
          :indent="MENU_INDENT"
          :root-indent="12"
          @update:value="handleSecondaryMenuClick"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { NMenu } from 'naive-ui';
import type { MenuOption } from 'naive-ui';
import { useThemeVars } from 'naive-ui';
import {
  SIDEBAR_PRIMARY_WIDTH,
  SIDEBAR_SECONDARY_WIDTH,
  FILE_ICON_SIZE,
  MENU_ITEM_HEIGHT,
  MENU_ITEM_BORDER_RADIUS,
  MENU_INDENT,
  PRIMARY_MENU_SPACING,
} from '../constants';

interface PrimaryMenuItem {
  key: string;
  label: string;
  icon: string;
  children?: SecondaryMenuItem[];
}

interface SecondaryMenuItem {
  key: string;
  label: string;
  icon?: string;
}

const themeVars = useThemeVars();

// 一级菜单数据
const primaryMenuItems = ref<PrimaryMenuItem[]>([
  {
    key: 'all',
    label: '全部',
    icon: 'i-carbon-folder',
    children: [
      { key: 'all-files', label: '全部文件' },
      { key: 'recent', label: '最近使用' },
    ],
  },
  {
    key: 'category',
    label: '分类',
    icon: 'i-carbon-category',
    children: [
      { key: 'image', label: '图片' },
      { key: 'video', label: '视频' },
      { key: 'document', label: '文档' },
      { key: 'audio', label: '音频' },
      { key: 'archive', label: '压缩包' },
      { key: 'code', label: '代码' },
      { key: 'other', label: '其他' },
    ],
  },
  {
    key: 'share',
    label: '分享',
    icon: 'i-carbon-share',
  },
  {
    key: 'recycle',
    label: '回收站',
    icon: 'i-carbon-trash-can',
  },
]);

// 当前激活的一级菜单
const activeMenu = ref('all');

// 当前激活的二级菜单
const activeSecondaryMenu = ref('all-files');

// 计算总宽度
const totalWidth = computed(() => {
  return showSecondaryMenu.value ? SIDEBAR_PRIMARY_WIDTH + SIDEBAR_SECONDARY_WIDTH : SIDEBAR_PRIMARY_WIDTH;
});

// 是否显示二级菜单
const showSecondaryMenu = computed(() => {
  const currentItem = primaryMenuItems.value.find((item) => item.key === activeMenu.value);
  return !!(currentItem?.children && currentItem.children.length > 0);
});

// 二级菜单选项
const secondaryMenuOptions = computed<MenuOption[]>(() => {
  const currentItem = primaryMenuItems.value.find((item) => item.key === activeMenu.value);
  if (!currentItem?.children) return [];

  return currentItem.children.map((child) => ({
    key: child.key,
    label: child.label,
    icon: child.icon ? () => h('div', { class: child.icon }) : undefined,
  }));
});

// 图标样式
const iconStyle = computed(() => (key: string) => ({
  fontSize: `${FILE_ICON_SIZE}px`,
  color: activeMenu.value === key ? themeVars.value.primaryColor : themeVars.value.textColor2,
}));

// 文字样式
const textStyle = computed(() => (key: string) => ({
  fontSize: '12px',
  color: activeMenu.value === key ? themeVars.value.primaryColor : themeVars.value.textColor2,
  fontWeight: activeMenu.value === key ? 700 : 400,
}));

// Emit
const emit = defineEmits<{
  primaryMenuChange: [key: string];
  secondaryMenuChange: [key: string];
}>();

// 一级菜单点击
function handlePrimaryMenuClick(key: string) {
  activeMenu.value = key;

  // 如果有二级菜单，默认选中第一个
  const item = primaryMenuItems.value.find((i) => i.key === key);
  if (item?.children && item.children.length > 0) {
    activeSecondaryMenu.value = item.children[0].key;
    emit('secondaryMenuChange', item.children[0].key);
  } else {
    emit('primaryMenuChange', key);
  }
}

// 二级菜单点击
function handleSecondaryMenuClick(key: string) {
  emit('secondaryMenuChange', key);
}

// 暴露方法
defineExpose({
  activeMenu,
  activeSecondaryMenu,
  setActiveMenu: (key: string) => {
    activeMenu.value = key;
  },
  setActiveSecondaryMenu: (key: string) => {
    activeSecondaryMenu.value = key;
  },
});
</script>

<style scoped lang="scss">
.sidebar-menu {
  display: flex;
  height: 100%;
  transition: width 0.1s ease-in-out;
}

.primary-menu {
  display: flex;
  flex-direction: column;
  width: v-bind('SIDEBAR_PRIMARY_WIDTH + "px"');
  padding-top: 40px;
  padding-bottom: 16px;
  background-color: v-bind('themeVars.cardColor');
  border-right: 1px solid v-bind('themeVars.dividerColor');
  box-shadow: 0 3px 10px 0 rgba(0, 0, 0, 0.06);
  height: 100%;

  .primary-menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 0;
    cursor: pointer;
    transition: background-color 0.2s;

    &:not(:first-child) {
      margin-top: v-bind('PRIMARY_MENU_SPACING + "px"');
    }

    &:hover {
      background-color: v-bind('themeVars.hoverColor');
    }

    &.active {
      background-color: transparent;
    }

    .menu-text {
      margin-top: 4px;
      text-align: center;
      transition:
        color 0.2s,
        font-weight 0.2s;
    }
  }
}

.secondary-menu {
  padding: 20px 0;
  background-color: v-bind('themeVars.cardColor');

  :deep(.n-menu-item) {
    height: v-bind('MENU_ITEM_HEIGHT + "px"');
    margin-left: 12px;
    width: calc(100% - 24px);
    border-radius: v-bind('MENU_ITEM_BORDER_RADIUS + "px"');
    font-size: 14px;
    font-weight: 700;
  }

  :deep(.n-menu-item:hover) {
    background-color: v-bind('themeVars.hoverColor');
  }

  :deep(.n-menu-item.n-menu-item--selected) {
    background-color: v-bind('themeVars.primaryColorSuppl + "1A"');
    color: v-bind('themeVars.primaryColor');
  }

  :deep(.n-menu-item-content-header) {
    padding-left: v-bind('MENU_INDENT + "px"');
  }
}

/* 滑动动画 */
.slide-enter-active,
.slide-leave-active {
  transition:
    transform 0.1s ease-in-out,
    opacity 0.1s ease-in-out;
}

.slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
