<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NDivider, NInputNumber, NSpace, NTag } from 'naive-ui';
import { fetchHistoryBatchDelete, fetchHistoryCleanup, fetchHistoryDelete, fetchHistoryList } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useAuth } from '@/hooks/business/auth';
import { useDownload } from '@/hooks/business/download';
import { useTable, useTableOperate, useTableProps } from '@/hooks/common/table';
import { $t } from '@/locales';
import ButtonIcon from '@/components/custom/button-icon.vue';
import HistorySearch from './modules/history-search.vue';
import HistoryDetailDrawer from './modules/history-detail-drawer.vue';

defineOptions({
  name: 'GenHistoryList'
});

const appStore = useAppStore();
const { hasAuth } = useAuth();
const { zip: downloadZip } = useDownload();

const tableProps = useTableProps();

// 构建下载 URL
function getHistoryDownloadUrl(id: number): string {
  return `/api/v1/tool/gen/history/${id}/download`;
}

// 格式化日期时间
function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

const {
  columns,
  columnChecks,
  data,
  getData,
  getDataByPage,
  loading,
  mobilePagination,
  searchParams,
  resetSearchParams
} = useTable({
  apiFn: fetchHistoryList as any,
  apiParams: {
    pageNum: 1,
    pageSize: 10,
    tableName: null
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      width: 48
    },
    {
      key: 'index',
      title: $t('common.index'),
      align: 'center',
      width: 64
    },
    {
      key: 'tableName',
      title: '表名',
      align: 'center',
      minWidth: 150,
      render: row => {
        const dataRow = row as unknown as Api.Tool.GenHistory;
        return (
          <NTag type="primary" size="small">
            {dataRow.tableName}
          </NTag>
        );
      }
    },
    {
      key: 'tableComment',
      title: '表描述',
      align: 'center',
      minWidth: 150,
      render: row => {
        const dataRow = row as unknown as Api.Tool.GenHistory;
        return dataRow.table?.tableComment || '-';
      }
    },
    {
      key: 'className',
      title: '类名',
      align: 'center',
      minWidth: 120,
      render: row => {
        const dataRow = row as unknown as Api.Tool.GenHistory;
        return dataRow.table?.className || '-';
      }
    },
    {
      key: 'templateGroup',
      title: '模板组',
      align: 'center',
      minWidth: 120,
      render: row => {
        const dataRow = row as unknown as Api.Tool.GenHistory;
        return (
          <NTag type="info" size="small">
            {dataRow.templateGroup?.name || '-'}
          </NTag>
        );
      }
    },
    {
      key: 'generatedBy',
      title: '生成人',
      align: 'center',
      width: 100
    },
    {
      key: 'generatedAt',
      title: '生成时间',
      align: 'center',
      minWidth: 180,
      render: row => {
        const dataRow = row as unknown as Api.Tool.GenHistory;
        return formatDateTime(dataRow.generatedAt as string);
      }
    },
    {
      key: 'operate',
      title: $t('common.operate'),
      align: 'center',
      width: 180,
      render: row => {
        const dataRow = row as unknown as Api.Tool.GenHistory;

        const viewBtn = () => {
          if (!hasAuth('tool:gen:history:query')) {
            return null;
          }
          return (
            <ButtonIcon
              text
              type="info"
              icon="material-symbols:visibility-outline"
              tooltipContent="查看详情"
              onClick={() => handleViewDetail(dataRow)}
            />
          );
        };

        const downloadBtn = () => {
          if (!hasAuth('tool:gen:history:download')) {
            return null;
          }
          return (
            <ButtonIcon
              text
              type="success"
              icon="material-symbols:download"
              tooltipContent="下载"
              onClick={() => handleDownload(dataRow.id as number)}
            />
          );
        };

        const deleteBtn = () => {
          if (!hasAuth('tool:gen:history:remove')) {
            return null;
          }
          return (
            <ButtonIcon
              text
              type="error"
              icon="material-symbols:delete-outline"
              tooltipContent={$t('common.delete')}
              popconfirmContent={$t('common.confirmDelete')}
              onPositiveClick={() => handleDelete(dataRow.id as number)}
            />
          );
        };

        const buttons = [viewBtn(), downloadBtn(), deleteBtn()].filter(Boolean);

        return (
          <div class="flex-center gap-8px">
            {buttons.map((btn, index) => (
              <>
                {index !== 0 && <NDivider vertical />}
                {btn}
              </>
            ))}
          </div>
        );
      }
    }
  ]
});

const { checkedRowKeys, onBatchDeleted, onDeleted } = useTableOperate(data as any, getData);

// 详情抽屉状态
const detailDrawerVisible = ref(false);
const currentHistory = ref<Api.Tool.GenHistory | null>(null);

// 清理弹窗状态
const cleanupModalVisible = ref(false);
const cleanupDays = ref(30);
const cleanupLoading = ref(false);

async function handleBatchDelete() {
  try {
    await fetchHistoryBatchDelete(checkedRowKeys.value.map(Number));
    onBatchDeleted();
  } catch {
    // error handled by request interceptor
  }
}

async function handleDelete(id: number) {
  try {
    await fetchHistoryDelete(id);
    onDeleted();
  } catch {
    // error handled by request interceptor
  }
}

function handleViewDetail(row: Api.Tool.GenHistory) {
  currentHistory.value = row;
  detailDrawerVisible.value = true;
}

function handleDownload(id: number) {
  const downloadUrl = getHistoryDownloadUrl(id);
  const filename = `history_${id}.zip`;
  downloadZip(downloadUrl, filename);
}

function showCleanupModal() {
  cleanupModalVisible.value = true;
}

async function handleCleanup() {
  cleanupLoading.value = true;
  try {
    const { data: count } = await fetchHistoryCleanup(cleanupDays.value);
    window.$message?.success(`成功清理 ${count} 条过期记录`);
    cleanupModalVisible.value = false;
    getData();
  } catch {
    // error handled by request interceptor
  } finally {
    cleanupLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <HistorySearch v-model:model="searchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <NCard title="生成历史" :bordered="false" size="small" class="card-wrapper sm:flex-1-hidden">
      <template #header-extra>
        <NSpace>
          <NButton v-if="hasAuth('tool:gen:history:cleanup')" secondary @click="showCleanupModal">
            <template #icon>
              <SvgIcon icon="material-symbols:cleaning-services" />
            </template>
            清理过期
          </NButton>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-delete="checkedRowKeys.length === 0"
            :loading="loading"
            :show-add="false"
            :show-delete="hasAuth('tool:gen:history:remove')"
            @delete="handleBatchDelete"
            @refresh="getData"
          />
        </NSpace>
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        v-bind="tableProps"
        :flex-height="!appStore.isMobile"
        :scroll-x="1200"
        :loading="loading"
        remote
        :row-key="row => row.id"
        :pagination="mobilePagination"
        class="sm:h-full"
      />
      <HistoryDetailDrawer v-model:visible="detailDrawerVisible" :row-data="currentHistory" />
    </NCard>

    <!-- 清理过期记录弹窗 -->
    <NModal
      v-model:show="cleanupModalVisible"
      preset="dialog"
      title="清理过期历史记录"
      positive-text="确认清理"
      negative-text="取消"
      :loading="cleanupLoading"
      @positive-click="handleCleanup"
    >
      <div class="py-16px">
        <NSpace vertical :size="12">
          <div>将清理指定天数之前的历史记录，此操作不可恢复。</div>
          <NFormItem label="保留天数" label-placement="left">
            <NInputNumber v-model:value="cleanupDays" :min="1" :max="365" />
            <span class="ml-8px text-gray-500">天</span>
          </NFormItem>
        </NSpace>
      </div>
    </NModal>
  </div>
</template>

<style scoped></style>
