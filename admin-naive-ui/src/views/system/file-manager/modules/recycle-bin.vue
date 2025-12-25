<template>
  <div class="recycle-bin-wrapper h-full flex flex-col">
    <!-- 工具栏 -->
    <div class="toolbar-container mb-4 p-4 bg-white rounded-lg">
      <n-space justify="space-between">
        <n-space>
          <n-input
            v-model:value="searchParams.fileName"
            placeholder="搜索文件名"
            clearable
            @keyup.enter="handleSearch"
            style="width: 240px"
          >
            <template #prefix>
              <icon-carbon-search />
            </template>
          </n-input>
          <n-button @click="handleSearch" :size="themeStore.componentSize">搜索</n-button>
          <n-button @click="handleReset" :size="themeStore.componentSize">重置</n-button>
          <n-button @click="getRecycleList" :size="themeStore.componentSize">
            <template #icon>
              <icon-carbon-renew />
            </template>
            刷新
          </n-button>
        </n-space>

        <n-space v-if="selectedRows.length > 0">
          <n-text>已选择 {{ selectedRows.length }} 项</n-text>
          <n-button type="primary" @click="handleBatchRestore" :size="themeStore.componentSize">
            <template #icon>
              <icon-carbon-undo />
            </template>
            恢复
          </n-button>
          <n-button type="error" @click="handleBatchDelete" :size="themeStore.componentSize">
            <template #icon>
              <icon-carbon-trash-can />
            </template>
            彻底删除
          </n-button>
        </n-space>
      </n-space>
    </div>

    <!-- 数据表格 -->
    <div class="flex-1 overflow-hidden">
      <n-data-table
        :columns="columns"
        :data="dataSource"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row) => row.uploadId"
        :checked-row-keys="checkedRowKeys"
        @update:checked-row-keys="handleCheck"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        class="h-full"
        flex-height
        remote
      />
    </div>
  </div>
</template>

<script setup lang="tsx">
import { ref, reactive, onMounted } from 'vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useMessage, useDialog, NButton, NSpace, NTag, NTime } from 'naive-ui';
import { useThemeStore } from '@/store/modules/theme';
import { fetchGetRecycleList, fetchRestoreFiles, fetchClearRecycle } from '@/service/api';
import { formatFileSize, formatDateTime } from '@/utils/common';
import { $t } from '@/locales';

const message = useMessage();
const dialog = useDialog();
const themeStore = useThemeStore();

const loading = ref(false);
const dataSource = ref<Api.System.FileManager.RecycleFile[]>([]);
const selectedRows = ref<Api.System.FileManager.RecycleFile[]>([]);
const checkedRowKeys = ref<string[]>([]);

const searchParams = reactive({
  fileName: '',
  pageNum: 1,
  pageSize: 20,
});

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 20,
  pageCount: 1,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 50],
  onChange: (page: number) => {
    pagination.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
  },
});

const columns: DataTableColumns<Api.System.FileManager.RecycleFile> = [
  {
    type: 'selection',
  },
  {
    title: '文件名',
    key: 'fileName',
    ellipsis: {
      tooltip: true,
    },
    render: (row) => (
      <NSpace align="center">
        <div class="i-carbon-document" />
        <span>{row.fileName}</span>
      </NSpace>
    ),
  },
  {
    title: '大小',
    key: 'fileSize',
    width: 120,
    render: (row) => formatFileSize(row.fileSize),
  },
  {
    title: '类型',
    key: 'ext',
    width: 100,
    render: (row) => <NTag size="small">{row.ext.toUpperCase()}</NTag>,
  },
  {
    title: '删除时间',
    key: 'updateTime',
    width: 180,
    render: (row) => <NTime time={new Date(row.updateTime)} format="yyyy-MM-dd HH:mm:ss" />,
  },
  {
    title: '删除人',
    key: 'updateBy',
    width: 120,
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    fixed: 'right',
    render: (row) => (
      <NSpace>
        <NButton size={themeStore.componentSize} type="primary" onClick={() => handleRestore([row.uploadId])}>
          恢复
        </NButton>
        <NButton size={themeStore.componentSize} type="error" onClick={() => handleDelete([row.uploadId])}>
          删除
        </NButton>
      </NSpace>
    ),
  },
];

/** 获取回收站列表 */
async function getRecycleList() {
  loading.value = true;
  try {
    const { data } = await fetchGetRecycleList({
      ...searchParams,
      pageNum: pagination.page || 1,
      pageSize: pagination.pageSize || 20,
    });

    if (data) {
      dataSource.value = data.rows;
      pagination.itemCount = data.total;
      pagination.pageCount = Math.ceil(data.total / (pagination.pageSize || 20));
    }
  } catch (error) {
    message.error($t('page.fileManager.getRecycleListFailed'));
  } finally {
    loading.value = false;
  }
}

/** 搜索 */
function handleSearch() {
  pagination.page = 1;
  getRecycleList();
}

/** 重置 */
function handleReset() {
  searchParams.fileName = '';
  pagination.page = 1;
  getRecycleList();
}

/** 分页变化 */
function handlePageChange(page: number) {
  pagination.page = page;
  getRecycleList();
}

/** 每页大小变化 */
function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize;
  pagination.page = 1;
  getRecycleList();
}

/** 选择变化 */
function handleCheck(keys: (string | number)[]) {
  checkedRowKeys.value = keys as string[];
  selectedRows.value = dataSource.value.filter((item) => keys.includes(item.uploadId));
}

/** 恢复文件 */
function handleRestore(uploadIds: string[]) {
  dialog.warning({
    title: $t('page.fileManager.restoreFile'),
    content: $t('page.fileManager.restoreFileConfirm', { count: uploadIds.length }),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await fetchRestoreFiles(uploadIds);
        message.success($t('page.fileManager.restoreFileSuccess'));
        checkedRowKeys.value = [];
        selectedRows.value = [];
        getRecycleList();
      } catch (error) {
        message.error($t('page.fileManager.restoreFileFailed'));
      }
    },
  });
}

/** 批量恢复 */
function handleBatchRestore() {
  if (checkedRowKeys.value.length === 0) {
    message.warning($t('page.fileManager.selectFilesToRestore'));
    return;
  }
  handleRestore(checkedRowKeys.value);
}

/** 彻底删除文件 */
function handleDelete(uploadIds: string[]) {
  dialog.error({
    title: $t('page.fileManager.permanentDelete'),
    content: $t('page.fileManager.permanentDeleteConfirm', { count: uploadIds.length }),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      try {
        await fetchClearRecycle(uploadIds);
        message.success($t('common.deleteSuccess'));
        checkedRowKeys.value = [];
        selectedRows.value = [];
        getRecycleList();
      } catch (error) {
        message.error($t('page.fileManager.deleteFailed'));
      }
    },
  });
}

/** 批量删除 */
function handleBatchDelete() {
  if (checkedRowKeys.value.length === 0) {
    message.warning($t('page.fileManager.selectFilesToDelete'));
    return;
  }
  handleDelete(checkedRowKeys.value);
}

onMounted(() => {
  getRecycleList();
});
</script>

<style scoped>
.recycle-bin-wrapper {
  padding: 16px;
}
</style>
