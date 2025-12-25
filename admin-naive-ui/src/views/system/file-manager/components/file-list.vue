<template>
  <div class="file-list-view">
    <n-data-table
      :columns="columns"
      :data="fileList"
      :loading="loading"
      :row-key="(row: FileItem) => row.id"
      :virtual-scroll="fileList.length > VIRTUAL_SCROLL_THRESHOLD"
      :max-height="600"
      v-model:checked-row-keys="checkedKeys"
      remote
      striped
      @scroll="handleScroll"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import { NDataTable, NEllipsis, NCheckbox, NIcon, useThemeVars } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import {
  TABLE_ROW_HEIGHT,
  VIRTUAL_SCROLL_THRESHOLD,
  FILE_ICON_SIZE,
  formatFileSize,
  formatDate,
  getFileIcon,
} from '../constants';

export interface FileItem {
  type: 'folder' | 'file';
  id: string | number;
  name: string;
  size?: number;
  createTime?: string;
  updateTime?: string;
  thumbnail?: string;
  ext?: string;
  url?: string;
}

interface Props {
  fileList: FileItem[];
  loading?: boolean;
}

interface Emits {
  (e: 'itemClick', item: FileItem): void;
  (e: 'itemDblClick', item: FileItem): void;
  (e: 'contextMenu', event: MouseEvent, item: FileItem): void;
  (e: 'scroll', event: Event): void;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
});

const emit = defineEmits<Emits>();

// 使用 defineModel 定义双向绑定，这是 Vue 3.4+ 的标准做法
const checkedKeys = defineModel<(string | number)[]>('checkedKeys', { default: () => [] });

const themeVars = useThemeVars();

// 列定义
const columns = computed<DataTableColumns<FileItem>>(() => [
  {
    type: 'selection',
    width: 48,
    cellProps: () => ({
      class: 'checkbox-cell',
    }),
  },
  {
    title: '文件名',
    key: 'name',
    minWidth: 300,
    ellipsis: {
      tooltip: true,
    },
    render: (row) => {
      const iconClass = getFileIcon(row.ext, row.type === 'folder');
      return h(
        'div',
        {
          class: 'file-name-cell',
          onClick: () => emit('itemClick', row),
          onDblclick: () => emit('itemDblClick', row),
          onContextmenu: (e: MouseEvent) => {
            e.preventDefault();
            emit('contextMenu', e, row);
          },
        },
        [
          h('i', {
            class: `${iconClass} file-icon`,
            style: {
              fontSize: '24px',
              color: row.type === 'folder' ? '#ffc107' : undefined,
            },
          }),
          h(NEllipsis, { style: { flex: 1 } }, { default: () => row.name }),
        ],
      );
    },
  },
  {
    title: '大小',
    key: 'size',
    width: 120,
    render: (row) => (row.type === 'file' ? formatFileSize(row.size) : '-'),
  },
  {
    title: '修改时间',
    key: 'updateTime',
    width: 180,
    render: (row) => formatDate(row.updateTime || row.createTime),
  },
]);

// 处理滚动
function handleScroll(event: Event) {
  emit('scroll', event);

  // 检测是否滚动到底部，触发加载更多
  const target = event.target as HTMLElement;
  if (target) {
    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      // 即将到达底部
      emit('scroll', event);
    }
  }
}
</script>

<style scoped lang="scss">
.file-list-view {
  width: 100%;
  height: 100%;
}
</style>
